// /api/parks — read-only surface (search + detail). Writes go through
// /api/submissions and require moderation, with the exception of admin direct
// edits exposed below.
import { Router } from 'express';
import { z } from 'zod';
import { query, withTx } from '../db.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { notFound } from '../utils/errors.js';

const router = Router();

// --- search ----------------------------------------------------------
// Two modes:
//   (a) bounding box: ?bbox=west,south,east,north  (used by map view)
//   (b) radius:       ?lat=&lng=&radiusKm=          (used by list view)
// Both accept ?features=slug1,slug2 (AND semantics) and ?q=text (name match)
const searchSchema = z.object({
    bbox: z.string().regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().positive().max(200).optional(),
    features: z.string().max(500).optional(),
    q: z.string().max(80).optional(),
    limit: z.coerce.number().int().positive().max(200).default(100),
});

router.get('/', validate({ query: searchSchema }), async (req, res, next) => {
    try {
        const { bbox, lat, lng, radiusKm, features, q, limit } = req.query;
        const where = [`p.status = 'published'`];
        const vals = [];

        if (bbox) {
            const [w, s, e, n] = bbox.split(',').map(Number);
            vals.push(w, s, e, n);
            where.push(
                `ST_Intersects(p.location, ST_MakeEnvelope($${vals.length - 3}, $${vals.length - 2}, $${vals.length - 1}, $${vals.length}, 4326)::geography)`,
            );
        } else if (lat != null && lng != null && radiusKm != null) {
            vals.push(lng, lat, radiusKm * 1000);
            where.push(
                `ST_DWithin(p.location, ST_MakePoint($${vals.length - 2}, $${vals.length - 1})::geography, $${vals.length})`,
            );
        }

        if (q) {
            vals.push(`%${q.toLowerCase()}%`);
            where.push(`lower(p.name) LIKE $${vals.length}`);
        }

        // Feature filter is AND semantics: every requested slug must be present.
        let featureJoin = '';
        if (features) {
            const slugs = features.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20);
            if (slugs.length) {
                vals.push(slugs);
                vals.push(slugs.length);
                featureJoin = `
                    JOIN (
                        SELECT pf.park_id
                        FROM park_features pf
                        JOIN features f ON f.id = pf.feature_id AND f.slug = ANY($${vals.length - 1})
                        GROUP BY pf.park_id
                        HAVING COUNT(DISTINCT f.id) = $${vals.length}
                    ) ff ON ff.park_id = p.id
                `;
            }
        }

        vals.push(limit);
        const sql = `
            SELECT p.id, p.name, p.description, p.address, p.city, p.region, p.country,
                   ST_Y(p.location::geometry) AS lat,
                   ST_X(p.location::geometry) AS lng,
                   COALESCE(
                     (SELECT json_agg(json_build_object('id', f.id, 'slug', f.slug, 'name', f.name, 'kind', f.kind))
                      FROM park_features pf JOIN features f ON f.id = pf.feature_id
                      WHERE pf.park_id = p.id),
                     '[]'::json
                   ) AS features
            FROM parks p
            ${featureJoin}
            WHERE ${where.join(' AND ')}
            ORDER BY p.name
            LIMIT $${vals.length}
        `;
        const result = await query(sql, vals);
        res.json({ parks: result.rows.map(mapPark) });
    } catch (err) {
        next(err);
    }
});

router.get(
    '/:id',
    validate({ params: z.object({ id: z.coerce.number().int().positive() }) }),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await query(
                `SELECT p.id, p.name, p.description, p.address, p.city, p.region, p.country,
                        ST_Y(p.location::geometry) AS lat,
                        ST_X(p.location::geometry) AS lng,
                        p.created_at, p.updated_at,
                        COALESCE(
                          (SELECT json_agg(json_build_object('id', f.id, 'slug', f.slug, 'name', f.name))
                           FROM park_features pf JOIN features f ON f.id = pf.feature_id
                           WHERE pf.park_id = p.id),
                          '[]'::json
                        ) AS features
                 FROM parks p
                 WHERE p.id = $1 AND p.status = 'published'`,
                [id],
            );
            if (!result.rowCount) throw notFound('Park not found');
            res.json({ park: mapPark(result.rows[0]) });
        } catch (err) {
            next(err);
        }
    },
);

// Admin/moderator: direct edit (bypasses queue) — handy for cleanup.
// Regular users must use /api/submissions.
const directEditSchema = z.object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(4000).optional().nullable(),
    address: z.string().max(240).optional().nullable(),
    city: z.string().max(80).optional().nullable(),
    region: z.string().max(80).optional().nullable(),
    country: z.string().length(2).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    status: z.enum(['published', 'hidden', 'removed']).optional(),
    featureIds: z.array(z.number().int().positive()).max(40).optional(),
});

router.patch(
    '/:id',
    requireAuth,
    requireRole('moderator', 'admin'),
    validate({
        params: z.object({ id: z.coerce.number().int().positive() }),
        body: directEditSchema,
    }),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            await withTx(async (client) => {
                const b = req.body;
                const sets = [];
                const vals = [];
                for (const [k, v] of Object.entries({
                    name: b.name,
                    description: b.description,
                    address: b.address,
                    city: b.city,
                    region: b.region,
                    country: b.country,
                    status: b.status,
                })) {
                    if (v !== undefined) {
                        vals.push(v);
                        sets.push(`${k} = $${vals.length}`);
                    }
                }
                if (b.lat != null && b.lng != null) {
                    vals.push(b.lng, b.lat);
                    sets.push(`location = ST_MakePoint($${vals.length - 1}, $${vals.length})::geography`);
                }
                if (sets.length) {
                    vals.push(id);
                    const upd = await client.query(
                        `UPDATE parks SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING id`,
                        vals,
                    );
                    if (!upd.rowCount) throw notFound('Park not found');
                }
                if (b.featureIds) {
                    await client.query('DELETE FROM park_features WHERE park_id = $1', [id]);
                    for (const fid of b.featureIds) {
                        await client.query(
                            'INSERT INTO park_features (park_id, feature_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [id, fid],
                        );
                    }
                }
                await client.query(
                    `INSERT INTO audit_log (actor_id, action, target, meta, ip)
                     VALUES ($1, 'park.direct_edit', $2, $3, $4)`,
                    [req.user.id, `park:${id}`, JSON.stringify(b), req.ip],
                );
            });
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

function mapPark(row) {
    return {
        id: Number(row.id),
        name: row.name,
        description: row.description,
        address: row.address,
        city: row.city,
        region: row.region,
        country: row.country,
        lat: Number(row.lat),
        lng: Number(row.lng),
        features: row.features || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export default router;

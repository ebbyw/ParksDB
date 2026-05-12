// /api/features — read-only for everyone; admins can manage the catalog.
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { conflict, notFound } from '../utils/errors.js';

const router = Router();

router.get('/', async (_req, res, next) => {
    try {
        // Ordering: kind first (controls UI section order), then category for
        // sub-grouping within a kind, then name.
        const result = await query(
            `SELECT id, slug, name, kind, category, icon, is_active
             FROM features
             WHERE is_active = TRUE
             ORDER BY
               CASE kind
                 WHEN 'park_type'     THEN 1
                 WHEN 'facility'      THEN 2
                 WHEN 'amenity'       THEN 3
                 WHEN 'accessibility' THEN 4
                 WHEN 'environment'   THEN 5
                 ELSE 99
               END,
               category NULLS LAST,
               name`,
        );
        res.json({ features: result.rows.map(mapFeature) });
    } catch (err) {
        next(err);
    }
});

const FEATURE_KINDS = ['park_type', 'facility', 'amenity', 'accessibility', 'environment'];

const featureSchema = z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(40),
    name: z.string().min(2).max(60),
    kind: z.enum(FEATURE_KINDS),
    category: z.string().min(2).max(40).optional(),
    icon: z.string().max(40).optional(),
});

router.post(
    '/',
    requireAuth,
    requireRole('admin'),
    validate({ body: featureSchema }),
    async (req, res, next) => {
        try {
            const { slug, name, kind, category, icon } = req.body;
            const existing = await query('SELECT 1 FROM features WHERE slug = $1', [slug]);
            if (existing.rowCount) throw conflict('Feature slug already exists');
            const result = await query(
                `INSERT INTO features (slug, name, kind, category, icon)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, slug, name, kind, category, icon, is_active`,
                [slug, name, kind, category || null, icon || null],
            );
            res.status(201).json({ feature: mapFeature(result.rows[0]) });
        } catch (err) {
            next(err);
        }
    },
);

router.patch(
    '/:id',
    requireAuth,
    requireRole('admin'),
    validate({
        params: z.object({ id: z.coerce.number().int().positive() }),
        body: featureSchema.partial().extend({ isActive: z.boolean().optional() }),
    }),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const fields = req.body;
            const sets = [];
            const vals = [];
            for (const [k, v] of Object.entries({
                slug: fields.slug,
                name: fields.name,
                kind: fields.kind,
                category: fields.category,
                icon: fields.icon,
                is_active: fields.isActive,
            })) {
                if (v !== undefined) {
                    vals.push(v);
                    sets.push(`${k} = $${vals.length}`);
                }
            }
            if (!sets.length) throw notFound('No fields to update');
            vals.push(id);
            const result = await query(
                `UPDATE features SET ${sets.join(', ')} WHERE id = $${vals.length}
                 RETURNING id, slug, name, kind, category, icon, is_active`,
                vals,
            );
            if (!result.rowCount) throw notFound('Feature not found');
            res.json({ feature: mapFeature(result.rows[0]) });
        } catch (err) {
            next(err);
        }
    },
);

function mapFeature(row) {
    return {
        id: Number(row.id),
        slug: row.slug,
        name: row.name,
        kind: row.kind,
        category: row.category,
        icon: row.icon,
        isActive: row.is_active,
    };
}

export default router;

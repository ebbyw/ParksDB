// /api/submissions — user-submitted park creates / edits + moderation queue.
//
// Lifecycle:
//   1. Authenticated user POSTs to /submissions (create or edit kind).
//      Payload is validated, CAPTCHA verified, write rate-limit applied.
//   2. Submission stored with status='pending'.
//   3. Moderator/admin lists pending submissions via GET /submissions?status=pending.
//   4. Moderator approves (POST /:id/approve) or rejects (POST /:id/reject).
//      Approve applies the payload to the parks table inside a transaction.
import { Router } from 'express';
import { z } from 'zod';
import { query, withTx } from '../db.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { verifyCaptcha } from '../middleware/captcha.js';
import { badRequest, notFound } from '../utils/errors.js';

const router = Router();

// ---- shared payload schemas -----------------------------------------
const parkPayloadSchema = z.object({
    name: z.string().min(2).max(120),
    description: z.string().max(4000).optional(),
    address: z.string().max(240).optional(),
    city: z.string().max(80).optional(),
    region: z.string().max(80).optional(),
    country: z.string().length(2).default('US'),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    featureIds: z.array(z.number().int().positive()).max(40).default([]),
});

// Edits allow any subset (lat/lng must come as a pair if present).
const editPayloadSchema = parkPayloadSchema
    .partial()
    .refine(
        (v) => (v.lat == null && v.lng == null) || (v.lat != null && v.lng != null),
        { message: 'lat and lng must be provided together' },
    );

// ---- create submission ----------------------------------------------
const createBodySchema = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('create'),
        payload: parkPayloadSchema,
        captchaToken: z.string().optional(),
    }),
    z.object({
        kind: z.literal('edit'),
        targetParkId: z.number().int().positive(),
        payload: editPayloadSchema,
        captchaToken: z.string().optional(),
    }),
]);

router.post(
    '/',
    requireAuth,
    writeLimiter,
    validate({ body: createBodySchema }),
    verifyCaptcha,
    async (req, res, next) => {
        try {
            const body = req.body;
            if (body.kind === 'edit') {
                const exists = await query('SELECT 1 FROM parks WHERE id = $1', [body.targetParkId]);
                if (!exists.rowCount) throw notFound('Target park not found');
            }

            const result = await query(
                `INSERT INTO submissions (kind, target_park_id, payload, submitted_by, submitter_ip)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, kind, target_park_id, status, created_at`,
                [
                    body.kind,
                    body.kind === 'edit' ? body.targetParkId : null,
                    JSON.stringify(body.payload),
                    req.user.id,
                    req.ip,
                ],
            );
            res.status(201).json({ submission: mapSubmissionRow(result.rows[0]) });
        } catch (err) {
            next(err);
        }
    },
);

// ---- list (moderator/admin only) ------------------------------------
const listSchema = z.object({
    status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
    limit: z.coerce.number().int().positive().max(200).default(50),
});

router.get(
    '/',
    requireAuth,
    requireRole('moderator', 'admin'),
    validate({ query: listSchema }),
    async (req, res, next) => {
        try {
            const { status, limit } = req.query;
            const result = await query(
                `SELECT s.id, s.kind, s.target_park_id, s.payload, s.status,
                        s.moderator_note, s.moderated_at, s.created_at,
                        u.email AS submitter_email
                 FROM submissions s
                 LEFT JOIN users u ON u.id = s.submitted_by
                 WHERE s.status = $1
                 ORDER BY s.created_at DESC
                 LIMIT $2`,
                [status, limit],
            );
            res.json({ submissions: result.rows.map(mapSubmissionRowFull) });
        } catch (err) {
            next(err);
        }
    },
);

// ---- approve --------------------------------------------------------
router.post(
    '/:id/approve',
    requireAuth,
    requireRole('moderator', 'admin'),
    validate({
        params: z.object({ id: z.coerce.number().int().positive() }),
        body: z.object({ note: z.string().max(500).optional() }).optional(),
    }),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const note = req.body?.note || null;
            const out = await withTx(async (client) => {
                const sRes = await client.query(
                    `SELECT id, kind, target_park_id, payload, status
                     FROM submissions WHERE id = $1 FOR UPDATE`,
                    [id],
                );
                if (!sRes.rowCount) throw notFound('Submission not found');
                const s = sRes.rows[0];
                if (s.status !== 'pending') throw badRequest(`Submission already ${s.status}`);

                let parkId;
                if (s.kind === 'create') {
                    const p = s.payload;
                    const created = await client.query(
                        `INSERT INTO parks (name, description, address, city, region, country, location, created_by)
                         VALUES ($1, $2, $3, $4, $5, $6,
                                 ST_MakePoint($7, $8)::geography, $9)
                         RETURNING id`,
                        [
                            p.name, p.description || null, p.address || null,
                            p.city || null, p.region || null, p.country || 'US',
                            p.lng, p.lat, req.user.id,
                        ],
                    );
                    parkId = created.rows[0].id;
                    for (const fid of p.featureIds || []) {
                        await client.query(
                            `INSERT INTO park_features (park_id, feature_id) VALUES ($1, $2)
                             ON CONFLICT DO NOTHING`,
                            [parkId, fid],
                        );
                    }
                } else {
                    parkId = s.target_park_id;
                    const p = s.payload;
                    const sets = [];
                    const vals = [];
                    for (const [k, v] of Object.entries({
                        name: p.name,
                        description: p.description,
                        address: p.address,
                        city: p.city,
                        region: p.region,
                        country: p.country,
                    })) {
                        if (v !== undefined) {
                            vals.push(v);
                            sets.push(`${k} = $${vals.length}`);
                        }
                    }
                    if (p.lat != null && p.lng != null) {
                        vals.push(p.lng, p.lat);
                        sets.push(`location = ST_MakePoint($${vals.length - 1}, $${vals.length})::geography`);
                    }
                    if (sets.length) {
                        vals.push(parkId);
                        await client.query(
                            `UPDATE parks SET ${sets.join(', ')} WHERE id = $${vals.length}`,
                            vals,
                        );
                    }
                    if (p.featureIds) {
                        await client.query('DELETE FROM park_features WHERE park_id = $1', [parkId]);
                        for (const fid of p.featureIds) {
                            await client.query(
                                `INSERT INTO park_features (park_id, feature_id) VALUES ($1, $2)
                                 ON CONFLICT DO NOTHING`,
                                [parkId, fid],
                            );
                        }
                    }
                }

                await client.query(
                    `UPDATE submissions
                     SET status='approved', moderator_id=$1, moderator_note=$2,
                         moderated_at=NOW(), target_park_id=$3
                     WHERE id=$4`,
                    [req.user.id, note, parkId, id],
                );
                await client.query(
                    `INSERT INTO audit_log (actor_id, action, target, meta, ip)
                     VALUES ($1, 'submission.approve', $2, $3, $4)`,
                    [req.user.id, `submission:${id}`, JSON.stringify({ parkId }), req.ip],
                );
                return parkId;
            });
            res.json({ ok: true, parkId: Number(out) });
        } catch (err) {
            next(err);
        }
    },
);

// ---- reject ---------------------------------------------------------
router.post(
    '/:id/reject',
    requireAuth,
    requireRole('moderator', 'admin'),
    validate({
        params: z.object({ id: z.coerce.number().int().positive() }),
        body: z.object({ note: z.string().min(1).max(500) }),
    }),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { note } = req.body;
            const result = await query(
                `UPDATE submissions
                 SET status='rejected', moderator_id=$1, moderator_note=$2, moderated_at=NOW()
                 WHERE id=$3 AND status='pending'
                 RETURNING id`,
                [req.user.id, note, id],
            );
            if (!result.rowCount) throw notFound('Submission not found or already resolved');
            await query(
                `INSERT INTO audit_log (actor_id, action, target, meta, ip)
                 VALUES ($1, 'submission.reject', $2, $3, $4)`,
                [req.user.id, `submission:${id}`, JSON.stringify({ note }), req.ip],
            );
            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    },
);

// ---- own submissions list (any authed user) -------------------------
router.get('/mine', requireAuth, async (req, res, next) => {
    try {
        const result = await query(
            `SELECT id, kind, target_park_id, status, moderator_note, created_at, moderated_at
             FROM submissions
             WHERE submitted_by = $1
             ORDER BY created_at DESC
             LIMIT 100`,
            [req.user.id],
        );
        res.json({ submissions: result.rows.map(mapSubmissionRow) });
    } catch (err) {
        next(err);
    }
});

function mapSubmissionRow(row) {
    return {
        id: Number(row.id),
        kind: row.kind,
        targetParkId: row.target_park_id ? Number(row.target_park_id) : null,
        status: row.status,
        moderatorNote: row.moderator_note || null,
        createdAt: row.created_at,
        moderatedAt: row.moderated_at,
    };
}
function mapSubmissionRowFull(row) {
    return {
        ...mapSubmissionRow(row),
        payload: row.payload,
        submitterEmail: row.submitter_email || null,
    };
}

export default router;

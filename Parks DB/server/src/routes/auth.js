// /api/auth — register, login, me.
// Security notes:
//  - Passwords hashed with bcrypt (rounds configurable).
//  - We deliberately return the same generic error for "wrong email" vs
//    "wrong password" to avoid user enumeration.
//  - The access token is returned in JSON AND set as an HttpOnly cookie so
//    both fetch-based and form-based clients work.
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { query } from '../db.js';
import { config } from '../config.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, signAccessToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { verifyCaptcha } from '../middleware/captcha.js';
import { badRequest, conflict, unauthorized } from '../utils/errors.js';

const router = Router();

const registerSchema = z.object({
    email: z.string().email().max(254),
    password: z.string().min(10).max(200),
    displayName: z.string().min(1).max(60).optional(),
    captchaToken: z.string().optional(),   // verified by middleware
});

const loginSchema = z.object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(200),
});

router.post(
    '/register',
    authLimiter,
    validate({ body: registerSchema }),
    verifyCaptcha,
    async (req, res, next) => {
        try {
            const { email, password, displayName } = req.body;

            // Light password complexity check beyond min length.
            if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
                throw badRequest('Password must contain letters and digits');
            }

            const existing = await query('SELECT 1 FROM users WHERE email = $1', [email]);
            if (existing.rowCount) throw conflict('Email already registered');

            const hash = await bcrypt.hash(password, config.bcryptRounds);
            const result = await query(
                `INSERT INTO users (email, password_hash, display_name)
                 VALUES ($1, $2, $3)
                 RETURNING id, email, display_name, role`,
                [email, hash, displayName || null],
            );
            const user = result.rows[0];
            const token = signAccessToken({ id: user.id, role: user.role, email: user.email });
            setAuthCookie(res, token);
            res.status(201).json({ user: publicUser(user), token });
        } catch (err) {
            next(err);
        }
    },
);

router.post(
    '/login',
    authLimiter,
    validate({ body: loginSchema }),
    async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await query(
                `SELECT id, email, password_hash, role, display_name, is_disabled
                 FROM users WHERE email = $1`,
                [email],
            );
            const row = result.rows[0];
            // Constant-ish-time: always run a bcrypt comparison so timing is
            // similar whether the user exists or not.
            const dummyHash = '$2b$12$abcdefghijklmnopqrstuuPPbE2DV8K0Y0Q4hQ3rPpEMwdH35a3Yyq';
            const ok = await bcrypt.compare(password, row?.password_hash || dummyHash);
            if (!row || row.is_disabled || !ok) throw unauthorized('Invalid email or password');

            const token = signAccessToken({ id: row.id, role: row.role, email: row.email });
            setAuthCookie(res, token);
            res.json({ user: publicUser(row), token });
        } catch (err) {
            next(err);
        }
    },
);

router.post('/logout', (_req, res) => {
    res.clearCookie('access_token');
    res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const result = await query(
            `SELECT id, email, display_name, role, created_at
             FROM users WHERE id = $1`,
            [req.user.id],
        );
        if (!result.rowCount) throw unauthorized();
        res.json({ user: publicUser(result.rows[0]) });
    } catch (err) {
        next(err);
    }
});

function setAuthCookie(res, token) {
    res.cookie('access_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.env === 'production',
        maxAge: 15 * 60_000, // matches default access TTL
        path: '/',
    });
}

function publicUser(row) {
    return {
        id: Number(row.id),
        email: row.email,
        displayName: row.display_name || null,
        role: row.role,
    };
}

export default router;

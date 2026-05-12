// Tiered rate limits. The defaults below are conservative enough for an MVP
// running on a single node — for multi-node deployments swap the in-memory
// store for a Redis store (express-rate-limit supports this directly).
import rateLimit from 'express-rate-limit';

// Per-IP. Used as a baseline on every route.
export const globalLimiter = rateLimit({
    windowMs: 15 * 60_000,         // 15 minutes
    limit: 300,                    // 300 req / 15 min / IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'rate_limited', message: 'Too many requests' } },
});

// Auth routes — defends credential stuffing. Per-IP.
export const authLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,                     // 10 attempts / 15 min / IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,  // only failed attempts count
    message: { error: { code: 'rate_limited', message: 'Too many auth attempts' } },
});

// Write-heavy endpoints — submissions / edits. Keyed by user if authenticated,
// otherwise by IP.
export const writeLimiter = rateLimit({
    windowMs: 60 * 60_000,         // 1 hour
    limit: 20,                     // 20 writes / hour
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => (req.user ? `u:${req.user.id}` : `ip:${req.ip}`),
    message: { error: { code: 'rate_limited', message: 'Submission limit reached, try again later' } },
});

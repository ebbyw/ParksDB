// JWT auth middleware. Tokens are short-lived bearer tokens signed with the
// app secret. We attach { id, role, email } to req.user when verified.
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export function signAccessToken(user) {
    return jwt.sign(
        { sub: user.id, role: user.role, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.accessTtl, issuer: 'parksdb' },
    );
}

// Required: 401 if missing/invalid.
export function requireAuth(req, _res, next) {
    const token = extractToken(req);
    if (!token) return next(unauthorized());
    try {
        const payload = jwt.verify(token, config.jwt.secret, { issuer: 'parksdb' });
        req.user = { id: Number(payload.sub), role: payload.role, email: payload.email };
        next();
    } catch {
        next(unauthorized('Invalid or expired token'));
    }
}

// Optional: attaches req.user if a valid token is present, otherwise continues.
export function optionalAuth(req, _res, next) {
    const token = extractToken(req);
    if (!token) return next();
    try {
        const payload = jwt.verify(token, config.jwt.secret, { issuer: 'parksdb' });
        req.user = { id: Number(payload.sub), role: payload.role, email: payload.email };
    } catch {
        // Ignore — treat as anonymous.
    }
    next();
}

export function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user) return next(unauthorized());
        if (!roles.includes(req.user.role)) return next(forbidden());
        next();
    };
}

function extractToken(req) {
    const h = req.headers.authorization;
    if (h && h.startsWith('Bearer ')) return h.slice(7);
    // Allow cookie fallback for browser clients (HttpOnly, set on login).
    if (req.cookies && req.cookies.access_token) return req.cookies.access_token;
    return null;
}

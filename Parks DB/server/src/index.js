// ParksDB API entry point.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { pool } from './db.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { optionalAuth } from './middleware/auth.js';
import { HttpError } from './utils/errors.js';

import authRoutes from './routes/auth.js';
import parksRoutes from './routes/parks.js';
import featuresRoutes from './routes/features.js';
import submissionsRoutes from './routes/submissions.js';

const app = express();

// Behind a reverse proxy (Heroku/Render/etc) `req.ip` needs trust proxy on.
app.set('trust proxy', 1);

// Security headers — sensible defaults; strict CSP belongs on the web app.
app.use(helmet());

// CORS — strict allowlist. Frontend must send credentials for cookie auth.
app.use(
    cors({
        origin(origin, cb) {
            if (!origin) return cb(null, true);  // same-origin / curl
            if (config.corsOrigins.includes(origin)) return cb(null, true);
            cb(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
    }),
);

app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());

// Populate req.user (verified signature) before rate limiters so skip logic is safe.
app.use(optionalAuth);

// Global rate limit applies to every route (auth routes layer on a stricter one).
app.use(globalLimiter);

// Health (no rate-limit-bypass concerns: still subject to global limit).
app.get('/api/health', (_req, res) => res.json({ ok: true, env: config.env }));
// Expose only the public CAPTCHA sitekey for the frontend.
app.get('/api/config', (_req, res) =>
    res.json({ captchaSitekey: config.captcha.sitekey, captchaDisabled: config.captcha.disabled }),
);

app.use('/api/auth',        authRoutes);
app.use('/api/parks',       parksRoutes);
app.use('/api/features',    featuresRoutes);
app.use('/api/submissions', submissionsRoutes);

// 404 for unknown /api routes
app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'not_found', message: 'Not found' } }));

// Global error handler. Hides internals; logs the raw error server-side.
app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({
            error: { code: err.code, message: err.message, details: err.details },
        });
    }
    console.error('[unhandled]', err);
    res.status(500).json({ error: { code: 'internal', message: 'Internal server error' } });
});

const server = app.listen(config.port, () => {
    console.log(`ParksDB API listening on :${config.port} (env=${config.env})`);
});

// Graceful shutdown so connections drain on Ctrl-C / SIGTERM.
function shutdown(signal) {
    console.log(`\n${signal} received, shutting down…`);
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
    // Give existing requests a few seconds.
    setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { app };

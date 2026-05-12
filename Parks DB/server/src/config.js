// Centralized config loading. Anywhere else in the code that needs a setting
// should import from here — never read process.env directly.
import 'dotenv/config';

function required(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
}

function bool(name, fallback = false) {
    const v = process.env[name];
    if (v == null) return fallback;
    return v === 'true' || v === '1';
}

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),

    databaseUrl: required('DATABASE_URL'),

    jwt: {
        secret: required('JWT_SECRET'),
        accessTtl: process.env.JWT_ACCESS_TTL || '15m',
        refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
    },
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

    captcha: {
        disabled: bool('CAPTCHA_DISABLED', false),
        secret: process.env.HCAPTCHA_SECRET || '',
        sitekey: process.env.HCAPTCHA_SITEKEY || '',
    },
};

// Hard fail in production if dangerous defaults are present.
if (config.env === 'production') {
    if (config.jwt.secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 chars in production');
    }
    if (config.captcha.disabled) {
        throw new Error('CAPTCHA_DISABLED must be false in production');
    }
}

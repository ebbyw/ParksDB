import { doubleCsrf } from 'csrf-csrf';
import { config } from '../config.js';

const { generateToken, doubleCsrfProtection } = doubleCsrf({
    getSecret: () => config.csrfSecret,
    // Tie the token to the current session cookie so tokens aren't reusable across sessions.
    getSessionIdentifier: (req) => req.cookies?.access_token ?? '',
    cookieName: 'x-csrf-token',
    cookieOptions: {
        sameSite: 'strict',
        path: '/',
        secure: config.env === 'production',
        // Must be false so the browser JS can read and re-send it in the x-csrf-token header.
        httpOnly: false,
    },
    // Bearer token requests are server-to-server (scraper); CSRF doesn't apply.
    skipCsrfProtection: (req) => req.headers.authorization?.startsWith('Bearer ') === true,
});

export { generateToken, doubleCsrfProtection };

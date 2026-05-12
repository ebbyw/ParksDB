// hCaptcha verification. Frontend submits a `captchaToken` field in the body;
// we POST it to hCaptcha's verify endpoint and require success.
// In dev with CAPTCHA_DISABLED=true we skip — useful for local + tests.
import { config } from '../config.js';
import { badRequest } from '../utils/errors.js';

const HCAPTCHA_URL = 'https://hcaptcha.com/siteverify';

export async function verifyCaptcha(req, _res, next) {
    if (config.captcha.disabled) return next();

    const token = req.body?.captchaToken;
    if (!token) return next(badRequest('Missing captchaToken'));

    try {
        const params = new URLSearchParams({
            secret: config.captcha.secret,
            response: token,
            remoteip: req.ip,
        });
        const res = await fetch(HCAPTCHA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });
        const data = await res.json();
        if (!data.success) return next(badRequest('CAPTCHA verification failed'));
        next();
    } catch (err) {
        next(err);
    }
}

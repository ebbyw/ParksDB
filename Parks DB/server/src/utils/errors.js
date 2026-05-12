// Standard error class so route handlers can throw and the global handler
// translates to a clean JSON response.
export class HttpError extends Error {
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export const badRequest   = (msg, details) => new HttpError(400, 'bad_request', msg, details);
export const unauthorized = (msg = 'Unauthorized') => new HttpError(401, 'unauthorized', msg);
export const forbidden    = (msg = 'Forbidden')    => new HttpError(403, 'forbidden', msg);
export const notFound     = (msg = 'Not found')    => new HttpError(404, 'not_found', msg);
export const conflict     = (msg)                  => new HttpError(409, 'conflict', msg);
export const tooMany      = (msg = 'Too many requests') => new HttpError(429, 'rate_limited', msg);

// Zod-based validator middleware. Pass any of body/query/params schemas;
// validated values overwrite req.body/query/params with parsed (typed) data.
import { ZodError } from 'zod';
import { badRequest } from '../utils/errors.js';

export function validate({ body, query, params }) {
    return (req, _res, next) => {
        try {
            if (body)   req.body   = body.parse(req.body);
            if (query)  req.query  = query.parse(req.query);
            if (params) req.params = params.parse(req.params);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                next(badRequest('Validation failed', err.flatten()));
            } else {
                next(err);
            }
        }
    };
}

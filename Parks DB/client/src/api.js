// Thin fetch wrapper. We use cookie auth in the browser, so credentials must
// be sent on every request. Errors are surfaced as { status, code, message }.
const BASE = '/api';

async function request(method, path, { body, token, query } = {}) {
    const url = new URL(BASE + path, window.location.origin);
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v != null && v !== '') url.searchParams.set(k, v);
        }
    }
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url.pathname + url.search, {
        method,
        headers,
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
        const err = new Error(data?.error?.message || res.statusText);
        err.status = res.status;
        err.code = data?.error?.code;
        err.details = data?.error?.details;
        throw err;
    }
    return data;
}
function safeJson(t) { try { return JSON.parse(t); } catch { return null; } }

export const api = {
    get:    (p, opts) => request('GET',    p, opts),
    post:   (p, body, opts) => request('POST',   p, { ...opts, body }),
    patch:  (p, body, opts) => request('PATCH',  p, { ...opts, body }),
    delete: (p, opts) => request('DELETE', p, opts),
};

// Singleton pg pool. All queries should go through `query()` (parameterized)
// or `withTx()` for transactions.
import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
});

export function query(text, params) {
    return pool.query(text, params);
}

export async function withTx(fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// Lightweight migration runner. For an MVP we just apply migrations/*.sql in
// lexical order against the configured DATABASE_URL. Re-running is safe because
// each migration uses IF NOT EXISTS / OR REPLACE.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '..', 'migrations');

async function main() {
    const { DATABASE_URL } = process.env;
    if (!DATABASE_URL) {
        console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
        process.exit(1);
    }

    const client = new pg.Client({ connectionString: DATABASE_URL });
    await client.connect();

    const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        console.log(`Applying ${file}…`);
        await client.query(sql);
    }

    await client.end();
    console.log('Migrations complete.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

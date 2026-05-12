// Seed script — features catalog, ~15 mock parks across a few US cities,
// and a default admin account.
//
// Idempotent: re-running upserts features and skips parks/users that exist.
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';

// ---- feature catalog ------------------------------------------------
// `kind` is the semantic role; `category` is finer-grained UI grouping
// *within* a kind. The filter sidebar groups by kind first, then category.
const FEATURES = [
    // ===== park_type — describes what the park IS =====
    { slug: 'dog-park',          name: 'Dog park',          kind: 'park_type', category: 'recreation' },
    { slug: 'skate-park',        name: 'Skate park',        kind: 'park_type', category: 'recreation' },
    { slug: 'beach',             name: 'Beach',             kind: 'park_type', category: 'water' },
    { slug: 'botanical-garden',  name: 'Botanical garden',  kind: 'park_type', category: 'nature' },
    { slug: 'nature-preserve',   name: 'Nature preserve',   kind: 'park_type', category: 'nature' },

    // ===== facility — substantial built thing the park HAS =====
    { slug: 'basketball-court',  name: 'Basketball court',  kind: 'facility', category: 'ball sports' },
    { slug: 'tennis-court',      name: 'Tennis court',      kind: 'facility', category: 'racket sports' },
    { slug: 'pickleball-court',  name: 'Pickleball court',  kind: 'facility', category: 'racket sports' },
    { slug: 'volleyball-court',  name: 'Volleyball court',  kind: 'facility', category: 'ball sports' },
    { slug: 'soccer-field',      name: 'Soccer field',      kind: 'facility', category: 'field sports' },
    { slug: 'baseball-field',    name: 'Baseball field',    kind: 'facility', category: 'field sports' },
    { slug: 'running-track',     name: 'Running track',     kind: 'facility', category: 'fitness' },
    { slug: 'swimming-pool',     name: 'Swimming pool',     kind: 'facility', category: 'water' },
    { slug: 'splash-pad',        name: 'Splash pad',        kind: 'facility', category: 'water' },
    { slug: 'playground',        name: 'Playground',        kind: 'facility', category: 'kids' },
    { slug: 'walking-trail',     name: 'Walking trail',     kind: 'facility', category: 'paths' },
    { slug: 'bike-trail',        name: 'Bike trail',        kind: 'facility', category: 'paths' },
    { slug: 'fishing',           name: 'Fishing access',    kind: 'facility', category: 'water' },

    // ===== amenity — small on-site item =====
    { slug: 'public-bathroom',   name: 'Public bathroom',   kind: 'amenity', category: 'comfort' },
    { slug: 'drinking-fountain', name: 'Drinking fountain', kind: 'amenity', category: 'comfort' },
    { slug: 'picnic-tables',     name: 'Picnic tables',     kind: 'amenity', category: 'seating' },
    { slug: 'covered-seating',   name: 'Covered seating',   kind: 'amenity', category: 'seating' },
    { slug: 'benches',           name: 'Benches',           kind: 'amenity', category: 'seating' },
    { slug: 'bbq-grills',        name: 'BBQ grills',        kind: 'amenity', category: 'cooking' },
    { slug: 'recycling-bins',    name: 'Recycling bins',    kind: 'amenity', category: 'sanitation' },
    { slug: 'parking',           name: 'Parking',           kind: 'amenity', category: 'access' },
    { slug: 'wifi',              name: 'Free Wi-Fi',        kind: 'amenity', category: 'tech' },

    // ===== accessibility =====
    { slug: 'wheelchair-access', name: 'Wheelchair access', kind: 'accessibility', category: 'mobility' },
    { slug: 'ada-playground',    name: 'ADA playground',    kind: 'accessibility', category: 'kids' },

    // ===== environment / setting =====
    { slug: 'shade-trees',       name: 'Shade trees',       kind: 'environment', category: 'natural' },
    { slug: 'community-garden',  name: 'Community garden',  kind: 'environment', category: 'natural' },
];

// ---- mock parks -----------------------------------------------------
const PARKS = [
    // San Francisco
    { name: 'Dolores Park',           city: 'San Francisco', region: 'CA',
      lat: 37.7596, lng: -122.4269, address: 'Dolores St & 19th St',
      description: 'Popular hillside park with sweeping city views.',
      featureSlugs: ['public-bathroom','tennis-court','basketball-court','dog-park','playground','picnic-tables','benches'] },
    { name: 'Golden Gate Park - Panhandle', city: 'San Francisco', region: 'CA',
      lat: 37.7716, lng: -122.4493, address: 'Fell St',
      description: 'Long greenway popular for jogging and dog-walking.',
      featureSlugs: ['walking-trail','bike-trail','dog-park','benches','shade-trees'] },
    { name: 'Mission Playground',     city: 'San Francisco', region: 'CA',
      lat: 37.7596, lng: -122.4216, address: '19th & Linda',
      description: 'Neighborhood park with soccer field and pool.',
      featureSlugs: ['soccer-field','swimming-pool','playground','public-bathroom','wheelchair-access'] },
    { name: 'Alta Plaza Park',        city: 'San Francisco', region: 'CA',
      lat: 37.7916, lng: -122.4380, address: 'Jackson St & Steiner St',
      description: 'Terraced park with playgrounds and tennis courts.',
      featureSlugs: ['tennis-court','playground','dog-park','benches','shade-trees'] },
    { name: 'Buena Vista Park',       city: 'San Francisco', region: 'CA',
      lat: 37.7681, lng: -122.4407, address: 'Buena Vista Ave',
      description: 'Forested hilltop park with walking trails.',
      featureSlugs: ['walking-trail','dog-park','shade-trees','benches'] },

    // Brooklyn / NYC
    { name: 'McCarren Park',          city: 'Brooklyn', region: 'NY',
      lat: 40.7197, lng: -73.9509, address: 'Lorimer St',
      description: 'Large North Brooklyn park with pool and running track.',
      featureSlugs: ['running-track','swimming-pool','soccer-field','baseball-field','public-bathroom','dog-park','playground'] },
    { name: 'Prospect Park - Long Meadow', city: 'Brooklyn', region: 'NY',
      lat: 40.6614, lng: -73.9707, address: 'Prospect Park West',
      description: 'Open meadow great for picnics and pickup soccer.',
      featureSlugs: ['soccer-field','picnic-tables','walking-trail','shade-trees','bbq-grills','public-bathroom'] },
    { name: 'Domino Park',            city: 'Brooklyn', region: 'NY',
      lat: 40.7140, lng: -73.9676, address: '15 River St',
      description: 'Waterfront park with bocce, beach volleyball, taco stand.',
      featureSlugs: ['volleyball-court','playground','splash-pad','public-bathroom','wheelchair-access','wifi','covered-seating','recycling-bins'] },
    { name: 'WNYC Transmitter Park',  city: 'Brooklyn', region: 'NY',
      lat: 40.7268, lng: -73.9605, address: 'West St & Greenpoint Ave',
      description: 'Small waterfront park with great Manhattan views.',
      featureSlugs: ['benches','walking-trail','shade-trees','wheelchair-access'] },

    // Austin
    { name: 'Zilker Park',            city: 'Austin', region: 'TX',
      lat: 30.2669, lng: -97.7728, address: '2207 Lou Neff Rd',
      description: 'Iconic 350-acre park with swimming, trails, and festivals.',
      featureSlugs: ['swimming-pool','walking-trail','bike-trail','soccer-field','volleyball-court','public-bathroom','parking','picnic-tables','dog-park'] },
    { name: 'Pease Park',             city: 'Austin', region: 'TX',
      lat: 30.2856, lng: -97.7570, address: '1100 Kingsbury St',
      description: 'Tree-shaded park along Shoal Creek.',
      featureSlugs: ['walking-trail','playground','shade-trees','picnic-tables','dog-park'] },
    { name: 'Mueller Lake Park',      city: 'Austin', region: 'TX',
      lat: 30.2986, lng: -97.7050, address: '4550 Mueller Blvd',
      description: 'Family-friendly park with lake loop and amphitheater.',
      featureSlugs: ['walking-trail','playground','splash-pad','ada-playground','benches','public-bathroom','parking','covered-seating','recycling-bins'] },

    // Seattle
    { name: 'Cal Anderson Park',      city: 'Seattle', region: 'WA',
      lat: 47.6168, lng: -122.3197, address: '1635 11th Ave',
      description: 'Capitol Hill neighborhood park with pickleball.',
      featureSlugs: ['pickleball-court','basketball-court','playground','public-bathroom','benches','wheelchair-access'] },
    { name: 'Volunteer Park',         city: 'Seattle', region: 'WA',
      lat: 47.6307, lng: -122.3155, address: '1247 15th Ave E',
      description: 'Historic park with conservatory and water tower views.',
      featureSlugs: ['tennis-court','playground','walking-trail','shade-trees','picnic-tables'] },
    { name: 'Magnuson Park',          city: 'Seattle', region: 'WA',
      lat: 47.6816, lng: -122.2538, address: '7400 Sand Point Way NE',
      description: 'Lakefront park with off-leash dog area and fishing pier.',
      featureSlugs: ['dog-park','fishing','walking-trail','bike-trail','parking','public-bathroom','community-garden','recycling-bins'] },

    // --- parks showcasing the new park_type taxonomy ---
    { name: 'Ocean Beach',            city: 'San Francisco', region: 'CA',
      lat: 37.7594, lng: -122.5107, address: 'Great Hwy',
      description: 'Three-mile sandy beach along the Pacific. Bonfires permitted at marked pits.',
      featureSlugs: ['beach','fishing','parking','public-bathroom','walking-trail','wheelchair-access','recycling-bins'] },

    { name: 'Brooklyn Botanic Garden', city: 'Brooklyn', region: 'NY',
      lat: 40.6694, lng: -73.9624, address: '990 Washington Ave',
      description: '52-acre botanical garden with cherry esplanade, native flora, and conservatory.',
      featureSlugs: ['botanical-garden','walking-trail','benches','public-bathroom','parking','wheelchair-access','shade-trees','picnic-tables','recycling-bins','covered-seating'] },

    { name: 'Discovery Park',         city: 'Seattle', region: 'WA',
      lat: 47.6580, lng: -122.4070, address: '3801 Discovery Park Blvd',
      description: 'Largest park in the city, a 534-acre natural area on Puget Sound bluffs.',
      featureSlugs: ['nature-preserve','walking-trail','bike-trail','parking','public-bathroom','shade-trees','picnic-tables','recycling-bins','wheelchair-access','fishing'] },
];

async function seedFeatures(client) {
    for (const f of FEATURES) {
        await client.query(
            `INSERT INTO features (slug, name, kind, category)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (slug) DO UPDATE
               SET name     = EXCLUDED.name,
                   kind     = EXCLUDED.kind,
                   category = EXCLUDED.category`,
            [f.slug, f.name, f.kind, f.category],
        );
    }
    console.log(`✓ Seeded ${FEATURES.length} features`);
}

async function seedAdmin(client) {
    const email    = process.env.SEED_ADMIN_EMAIL    || 'admin@parksdb.local';
    const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!123';

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount) {
        console.log(`✓ Admin already exists: ${email}`);
        return existing.rows[0].id;
    }
    const hash = await bcrypt.hash(password, config.bcryptRounds);
    const result = await client.query(
        `INSERT INTO users (email, password_hash, role, display_name)
         VALUES ($1, $2, 'admin', 'Admin') RETURNING id`,
        [email, hash],
    );
    console.log(`✓ Admin created: ${email} / ${password}`);
    return result.rows[0].id;
}

async function seedParks(client, createdBy) {
    for (const p of PARKS) {
        const existing = await client.query(
            `SELECT id FROM parks WHERE name = $1 AND city = $2`,
            [p.name, p.city],
        );
        if (existing.rowCount) continue;

        const ins = await client.query(
            `INSERT INTO parks (name, description, address, city, region, country, location, created_by)
             VALUES ($1, $2, $3, $4, $5, 'US', ST_MakePoint($6, $7)::geography, $8)
             RETURNING id`,
            [p.name, p.description, p.address, p.city, p.region, p.lng, p.lat, createdBy],
        );
        const parkId = ins.rows[0].id;
        for (const slug of p.featureSlugs) {
            await client.query(
                `INSERT INTO park_features (park_id, feature_id)
                 SELECT $1, id FROM features WHERE slug = $2
                 ON CONFLICT DO NOTHING`,
                [parkId, slug],
            );
        }
    }
    console.log(`✓ Seeded up to ${PARKS.length} parks`);
}

async function main() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await seedFeatures(client);
        const adminId = await seedAdmin(client);
        await seedParks(client, adminId);
        await client.query('COMMIT');
        console.log('\nSeed complete.');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

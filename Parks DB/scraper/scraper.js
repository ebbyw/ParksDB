#!/usr/bin/env node
/**
 * Seattle Parks & Recreation Scraper
 * Crawls seattle.gov/parks, extracts park data, submits via ParksDB API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { load } from 'cheerio';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =====================================================================
// CONFIG
// =====================================================================
const API_BASE = process.env.API_BASE || 'http://localhost:4000/api';
const PARKS_LIST_URL = 'https://www.seattle.gov/parks/parks'; // Index of all parks
const DB_URL = process.env.DATABASE_URL || 'postgres://localhost/parksdb';
const RATE_LIMIT_MS = 5000; // 5s between requests (API rate limit)
const DRY_RUN = process.env.DRY_RUN === 'true'; // Log without submitting if true
const MAX_PARKS = process.env.MAX_PARKS ? parseInt(process.env.MAX_PARKS) : null; // Limit parks for testing
const ALLOW_RESUBMIT = process.env.ALLOW_RESUBMIT === 'true'; // Allow re-submission of already-submitted parks
const LOG_FILE = path.join(__dirname, 'scraper.log');

// Scraper auth credentials
const SCRAPER_EMAIL = process.env.SCRAPER_EMAIL || 'scraper@parksdb.local';
const SCRAPER_PASSWORD = process.env.SCRAPER_PASSWORD || 'SeattleParks2024SeattleParks2024';
let authToken = null;
let tokenExpiry = null; // Track token expiry for proactive refresh

// =====================================================================
// LOGGING
// =====================================================================
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(msg);
  logStream.write(line + '\n');
}

function logErr(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ERROR: ${msg}`;
  console.error(msg);
  logStream.write(line + '\n');
}

// Feature mapping: cleaned name → DB feature slug + metadata
const FEATURE_MAP = {
  'spray parks': { slug: 'splash-pad', kind: 'facility', category: 'water' },
  'spraypark': { slug: 'splash-pad', kind: 'facility', category: 'water' },
  'splash pad': { slug: 'splash-pad', kind: 'facility', category: 'water' },
  'tennis courts': { slug: 'tennis-court', kind: 'facility', category: 'racket sports' },
  'tennis court': { slug: 'tennis-court', kind: 'facility', category: 'racket sports' },
  'play area': { slug: 'playground', kind: 'facility', category: 'kids' },
  'playground': { slug: 'playground', kind: 'facility', category: 'kids' },
  'restrooms': { slug: 'public-bathroom', kind: 'amenity', category: 'comfort' },
  'restroom': { slug: 'public-bathroom', kind: 'amenity', category: 'comfort' },
  'picnic sites': { slug: 'picnic-tables', kind: 'amenity', category: 'seating' },
  'picnic site': { slug: 'picnic-tables', kind: 'amenity', category: 'seating' },
  'picnic tables': { slug: 'picnic-tables', kind: 'amenity', category: 'seating' },
  'skate park': { slug: 'skate-park', kind: 'park_type', category: 'recreation' },
  'skate spot': { slug: 'skate-park', kind: 'park_type', category: 'recreation' },
  'football fields': { slug: 'football-field', kind: 'facility', category: 'field sports' },
  'football field': { slug: 'football-field', kind: 'facility', category: 'field sports' },
  'soccer fields': { slug: 'soccer-field', kind: 'facility', category: 'field sports' },
  'soccer field': { slug: 'soccer-field', kind: 'facility', category: 'field sports' },
  'basketball courts': { slug: 'basketball-court', kind: 'facility', category: 'ball sports' },
  'basketball court': { slug: 'basketball-court', kind: 'facility', category: 'ball sports' },
  'basketball hoops': { slug: 'basketball-court', kind: 'facility', category: 'ball sports' },
  'baseball fields': { slug: 'baseball-field', kind: 'facility', category: 'field sports' },
  'baseball field': { slug: 'baseball-field', kind: 'facility', category: 'field sports' },
  'softball fields': { slug: 'baseball-field', kind: 'facility', category: 'field sports' },
  'softball field': { slug: 'baseball-field', kind: 'facility', category: 'field sports' },
  'baseball/softball fields': { slug: 'baseball-field', kind: 'facility', category: 'field sports' },
  'walking trail': { slug: 'walking-trail', kind: 'facility', category: 'paths' },
  'walking trails': { slug: 'walking-trail', kind: 'facility', category: 'paths' },
  'bike trail': { slug: 'bike-trail', kind: 'facility', category: 'paths' },
  'bike trails': { slug: 'bike-trail', kind: 'facility', category: 'paths' },
  'fishing': { slug: 'fishing', kind: 'facility', category: 'water' },
  'swimming pool': { slug: 'swimming-pool', kind: 'facility', category: 'water' },
  'swimming pools': { slug: 'swimming-pool', kind: 'facility', category: 'water' },
  'pool': { slug: 'swimming-pool', kind: 'facility', category: 'water' },
  'dog park': { slug: 'dog-park', kind: 'park_type', category: 'recreation' },
  'dog off-leash area': { slug: 'dog-off-leash-area', kind: 'facility', category: 'recreation' },
  'off-leash dog area': { slug: 'dog-off-leash-area', kind: 'facility', category: 'recreation' },
  'wheelchair access': { slug: 'wheelchair-access', kind: 'accessibility', category: 'mobility' },
  'wheelchair accessible': { slug: 'wheelchair-access', kind: 'accessibility', category: 'mobility' },
  'ada playground': { slug: 'ada-playground', kind: 'accessibility', category: 'kids' },
  'shade trees': { slug: 'shade-trees', kind: 'environment', category: 'natural' },
  'community garden': { slug: 'community-garden', kind: 'environment', category: 'natural' },
  'bbq grills': { slug: 'bbq-grills', kind: 'amenity', category: 'cooking' },
  'bbq': { slug: 'bbq-grills', kind: 'amenity', category: 'cooking' },
  'barbecue': { slug: 'bbq-grills', kind: 'amenity', category: 'cooking' },
  'barbecues': { slug: 'bbq-grills', kind: 'amenity', category: 'cooking' },
  'benches': { slug: 'benches', kind: 'amenity', category: 'seating' },
  'covered seating': { slug: 'covered-seating', kind: 'amenity', category: 'seating' },
  'covered shelter': { slug: 'covered-seating', kind: 'amenity', category: 'seating' },
  'drinking fountain': { slug: 'drinking-fountain', kind: 'amenity', category: 'comfort' },
  'drinking fountains': { slug: 'drinking-fountain', kind: 'amenity', category: 'comfort' },
  'recycling bins': { slug: 'recycling-bins', kind: 'amenity', category: 'sanitation' },
  'recycling': { slug: 'recycling-bins', kind: 'amenity', category: 'sanitation' },
  'parking': { slug: 'parking', kind: 'amenity', category: 'access' },
  'wifi': { slug: 'wifi', kind: 'amenity', category: 'tech' },
  'multi-use courts': { slug: 'multi-use-court', kind: 'facility', category: 'ball sports' },
  'multi-use court': { slug: 'multi-use-court', kind: 'facility', category: 'ball sports' },
  'pickleball court': { slug: 'pickleball-court', kind: 'facility', category: 'racket sports' },
  'pickleball courts': { slug: 'pickleball-court', kind: 'facility', category: 'racket sports' },
};

// =====================================================================
// UTILITIES
// =====================================================================

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Authenticate with API — login or register scraper account
async function authenticate() {
  log(`🔐 Authenticating scraper...`);

  // Try login first
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: SCRAPER_EMAIL, password: SCRAPER_PASSWORD }),
    });

    if (res.ok) {
      const data = await res.json();
      authToken = data.token;
      // Decode token to extract expiry for proactive refresh
      try {
        const [, payload] = authToken.split('.');
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
        tokenExpiry = decoded.exp ? new Date(decoded.exp * 1000) : null;
      } catch (e) {
        // If decode fails, just skip expiry tracking
      }
      log(`  ✓ Logged in as ${SCRAPER_EMAIL}`);
      return authToken;
    }

    if (res.status === 401) {
      log(`  User not found, registering...`);
      // Register if login fails
      const regRes = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: SCRAPER_EMAIL,
          password: SCRAPER_PASSWORD,
          displayName: 'Parks Scraper',
        }),
      });

      if (!regRes.ok) {
        throw new Error(`Registration failed: ${regRes.status}`);
      }

      const data = await regRes.json();
      authToken = data.token;
      // Decode token to extract expiry for proactive refresh
      try {
        const [, payload] = authToken.split('.');
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
        tokenExpiry = decoded.exp ? new Date(decoded.exp * 1000) : null;
      } catch (e) {
        // If decode fails, just skip expiry tracking
      }
      log(`  ✓ Registered & logged in as ${SCRAPER_EMAIL}`);
      return authToken;
    }

    throw new Error(`Login failed: ${res.status}`);
  } catch (err) {
    logErr(`Authentication failed: ${err.message}`);
    throw err;
  }
}

// Refresh token if expired or expiring soon (within 5 minutes)
async function ensureTokenValid() {
  if (!tokenExpiry || tokenExpiry < new Date(Date.now() + 5 * 60 * 1000)) {
    // Token missing, expired, or expiring soon — re-authenticate
    await authenticate();
  }
}

async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ParksDB-Scraper/1.0 (+https://github.com/ebbyw/ParksDB)',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      log(`  Retry ${i + 1}/${maxRetries} for ${url}: ${err.message}`);
      await sleep(2000);
    }
  }
}

// Normalize feature names and map to slugs
function parseFeatures(featureStrings) {
  return featureStrings
    .map((f) => f.trim().toLowerCase())
    .filter(Boolean)
    .map((f) => {
      const mapped = FEATURE_MAP[f];
      if (mapped) {
        return { slug: mapped.slug, kind: mapped.kind, category: mapped.category, original: f };
      }
      // Unmapped feature — create slug from name
      return {
        slug: f.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        kind: 'amenity',
        category: 'other',
        original: f,
        isNew: true,
      };
    })
    .filter((f) => f.slug);
}

// Geocode address via Nominatim (OpenStreetMap) — same as frontend form
// Rate limit: ~1 req/sec (scraper already does this)
async function geocodeAddress(address, city = 'Seattle', region = 'WA') {
  if (!address && !city) {
    return null;
  }

  const q = [address, city, region, 'US'].filter(Boolean).join(', ');
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({ q, format: 'json', limit: '1' });

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'ParksDB-Scraper/1.0' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!data.length) {
      log(`    ⚠️  Nominatim: no match for "${q}"`);
      return null;
    }

    const result = data[0];
    log(`    ✓ Geocoded: ${result.lat}, ${result.lon}`);
    return { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
  } catch (err) {
    log(`    ⚠️  Geocoding failed: ${err.message}`);
    return null;
  }
}

// =====================================================================
// SCRAPING
// =====================================================================

// Discover all park URLs from index page
async function discoverParkUrls() {
  log(`\n📍 Discovering park URLs from ${PARKS_LIST_URL}...`);
  const html = await fetchWithRetry(PARKS_LIST_URL);
  const $ = load(html);

  const urls = [];
  const rejected = []; // Track rejected URLs for debugging

  // Look for park detail links (adjust selector based on actual site structure)
  // Only accept /parks/parks/{slug} (2 levels), skip /parks/parks/{slug}/... (sub-pages)
  $('a[href*="/parks/parks/"]').each((_, el) => {
    let url = $(el).attr('href');
    if (url && !url.includes('?')) {
      if (!url.startsWith('http')) url = new URL(url, PARKS_LIST_URL).href;

      // Extract path and check depth: only /parks/parks/{slug}, not /parks/parks/{slug}/subpage
      try {
        const parsed = new URL(url);
        const pathParts = parsed.pathname.split('/').filter(Boolean); // ['parks', 'parks', 'slug'] or more
        // Only accept URLs with exactly 3 path components: parks/parks/{slug}
        if (pathParts.length === 3 && pathParts[0] === 'parks' && pathParts[1] === 'parks') {
          if (!urls.includes(url)) urls.push(url);
        } else {
          rejected.push({ url, depth: pathParts.length, path: parsed.pathname });
        }
      } catch (e) {
        // Skip malformed URLs
      }
    }
  });

  log(`✓ Found ${urls.length} parks`);
  if (rejected.length > 0 && rejected.length <= 10) {
    log(`⚠️  Rejected ${rejected.length} URLs (depth > 3):`);
    rejected.slice(0, 5).forEach(r => log(`    ${r.url}`));
    if (rejected.length > 5) log(`    ... and ${rejected.length - 5} more`);
  }
  return urls;
}

// Parse a single park page
function parseParkPage(html, url) {
  const $ = load(html);

  // Extract park name from h1
  const name = $('h1').first().text().trim();
  if (!name) return null;

  // Extract description from "About" section (look for heading or just first paragraph after amenities)
  let description = null;

  // Try to find "About" heading
  let aboutEl = null;
  $('h2, h3, h4').each((_, el) => {
    if ($(el).text().toLowerCase().includes('about')) {
      aboutEl = $(el);
      return false; // break
    }
  });

  if (aboutEl && aboutEl.length) {
    const textAfter = aboutEl
      .nextUntil('h2, h3, h4')
      .filter('p, div')
      .first()
      .text()
      .trim();
    if (textAfter && textAfter.length > 10) {
      description = textAfter;
    }
  }

  // Fallback: look for first substantial paragraph in main content
  if (!description) {
    $('main p, article p, .content p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50 && !text.match(/^(Images?|Features|Amenities|Visit|Current|Project)/i)) {
        description = text;
        return false; // break
      }
    });
  }

  // Extract features from Amenities section
  const features = [];
  const amenitiesSection = $('h2:contains("Amenities"), h3:contains("Amenities")').first();
  if (amenitiesSection.length) {
    // Features are usually listed as text items until next section
    let currentEl = amenitiesSection.next();
    while (currentEl.length && !currentEl.is('h2, h3, .section-divider')) {
      const text = currentEl.text().trim();
      if (text && !text.match(/^(Images?|About|Current|Project|Visit|Parks)/) && text.length < 100) {
        features.push(text);
      }
      currentEl = currentEl.next();
    }
  }

  // Extract address from location pin link (Google Maps icon)
  // Format: <a href="goo.gl/maps/..."><svg>...</svg>2150 S Norman St., Seattle, WA 98144</a>
  let address = null;

  // Look for any link with maps in href
  const mapLink = $('a[href*="goo.gl"], a[href*="maps.google"], a[href*="google.com/maps"]').first();
  if (mapLink.length) {
    const linkHtml = mapLink.html();
    // Extract text after SVG closing tag
    const textMatch = linkHtml.match(/<\/svg>(.*?)$/i);
    if (textMatch) {
      address = textMatch[1].trim();
    }
  }

  // Fallback: look for address pattern in page text (most specific first)
  if (!address) {
    const textContent = $.text();
    // Match: number + street + direction/type + city/state/zip
    const addressMatch = textContent.match(/(\d+\s+[A-Z][a-z\s.]+(?:Avenue|Ave|Street|St|Road|Rd|Drive|Dr|Way|Place|Pl)(?:\s+[A-Z]{1,2})?[.,\s]+Seattle[.,\s]+WA[.,\s]+\d{5})/i);
    if (addressMatch) {
      address = addressMatch[0].trim();
    }
  }

  return {
    name,
    description,
    address,
    city: 'Seattle',
    region: 'WA',
    country: 'US',
    url,
    features: parseFeatures(features),
    rawFeatures: features,
  };
}

// =====================================================================
// DATABASE
// =====================================================================

async function getOrCreateFeatures(pool, features) {
  if (!features.length) return [];

  const client = await pool.connect();
  try {
    const result = [];

    for (const f of features) {
      // Upsert feature
      const res = await client.query(
        `INSERT INTO features (slug, name, kind, category, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id, slug`,
        [f.slug, f.original || f.slug, f.kind, f.category],
      );
      // If insert was skipped (conflict), fetch existing
      if (!res.rowCount) {
        const existing = await client.query('SELECT id FROM features WHERE slug = $1', [f.slug]);
        if (existing.rowCount) {
          result.push({ id: Number(existing.rows[0].id), slug: f.slug });
        }
        continue;
      }
      result.push({ id: Number(res.rows[0].id), slug: f.slug });
    }

    return result;
  } finally {
    client.release();
  }
}

async function checkParkExists(pool, name, address) {
  const res = await pool.query(
    `SELECT id FROM parks WHERE lower(name) = lower($1) AND address = $2 LIMIT 1`,
    [name, address],
  );
  return res.rowCount > 0;
}

async function checkSubmissionExists(pool, name, address) {
  // Check if this park has already been submitted (any status, including rejected)
  // Don't re-submit rejected parks unless ALLOW_RESUBMIT is true
  // IS NOT DISTINCT FROM handles null comparisons correctly (null = null is true)
  const res = await pool.query(
    `SELECT id, payload->>'name' as stored_name, payload->>'address' as stored_address, status
     FROM submissions
     WHERE (payload->>'name') = $1
       AND (payload->>'address') IS NOT DISTINCT FROM $2
     LIMIT 1`,
    [name, address],
  );

  if (res.rowCount > 0) {
    const row = res.rows[0];
    log(`    Found existing submission ${row.id} (status: ${row.status})`);
  }
  return res.rowCount > 0;
}

// =====================================================================
// API SUBMISSION
// =====================================================================

async function submitParkToAPI(parkData, featureIds) {
  if (!parkData.name) {
    log('  ⚠️  Missing park name — skip');
    return null;
  }

  // Geocoding required for submission
  if (!parkData.lat || !parkData.lng) {
    log(`  ⚠️  Missing coordinates for "${parkData.name}" — manual geocoding required`);
    return null;
  }

  const payload = {
    kind: 'create',
    payload: {
      name: parkData.name,
      ...(parkData.description && { description: parkData.description }),
      ...(parkData.address && { address: parkData.address }),
      ...(parkData.city && { city: parkData.city }),
      ...(parkData.region && { region: parkData.region }),
      country: parkData.country || 'US',
      lat: parkData.lat,
      lng: parkData.lng,
      featureIds: featureIds || [],
    },
  };

  if (DRY_RUN) {
    log(`  🔍 [DRY RUN] Would submit:\n${JSON.stringify(payload, null, 2)}`);
    return null;
  }

  try {
    // Ensure token is fresh before submission
    await ensureTokenValid();

    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      log(`  ❌ API error: ${res.status}`);

      // Handle rate limit
      if (res.status === 429) {
        log(`    Rate limit hit — backing off 30s...`);
        await sleep(30000);
      }
      return null;
    }

    const data = await res.json();
    log(`  ✓ Submitted — submission ID: ${data.submission?.id}`);
    return data.submission?.id;
  } catch (err) {
    log(`  ❌ Submission failed: ${err.message}`);
    return null;
  }
}

// =====================================================================
// MAIN
// =====================================================================

async function main() {
  const pool = new pg.Pool({ connectionString: DB_URL });
  const stats = {
    discovered: 0,
    parsed: 0,
    duplicate: 0,
    needsGeocoding: 0,
    submitted: 0,
    failed: 0,
    newFeatures: [],
  };

  try {
    // Authenticate first
    if (!DRY_RUN) {
      await authenticate();
    }

    const parkUrls = await discoverParkUrls();
    stats.discovered = parkUrls.length;

    // Limit parks for testing if MAX_PARKS set
    const urlsToProcess = MAX_PARKS ? parkUrls.slice(0, MAX_PARKS) : parkUrls;
    if (MAX_PARKS && urlsToProcess.length < parkUrls.length) {
      log(`⚠️  MAX_PARKS=${MAX_PARKS} — processing ${urlsToProcess.length}/${parkUrls.length}`);
    }

    log(`\n🔄 Processing ${urlsToProcess.length} parks...\n`);

    for (let i = 0; i < urlsToProcess.length; i++) {
      const url = urlsToProcess[i];
      log(`[${i + 1}/${urlsToProcess.length}] ${url.split('/').pop()}`);

      try {
        // Fetch + parse
        const html = await fetchWithRetry(url);
        const park = parseParkPage(html, url);
        if (!park) {
          log('  ❌ Parse failed');
          stats.failed++;
          await sleep(RATE_LIMIT_MS);
          continue;
        }

        // Skip category/index pages (not real parks)
        if (park.name.match(/^Parks\s+[A-Z]/i) || park.name.match(/^(All|Browse|Search|Index)\s+Parks/i)) {
          log('  ⏭️  Category page — skip');
          await sleep(RATE_LIMIT_MS);
          continue;
        }

        stats.parsed++;
        log(`  Name: ${park.name}`);
        log(`  Address: ${park.address || '(not found)'}`);
        log(`  Features: ${park.features.length} (${park.rawFeatures.join(', ')})`);

        // Check if already exists in parks table
        const exists = await checkParkExists(pool, park.name, park.address);
        if (exists) {
          log('  ⏭️  Already in DB');
          stats.duplicate++;
          await sleep(RATE_LIMIT_MS);
          continue;
        }

        // Check if already submitted (pending or approved)
        if (!ALLOW_RESUBMIT) {
          const submitted = await checkSubmissionExists(pool, park.name, park.address);
          if (submitted) {
            log('  ⏭️  Already submitted');
            stats.duplicate++;
            await sleep(RATE_LIMIT_MS);
            continue;
          }
        }

        // Get/create features
        const featureRows = await getOrCreateFeatures(pool, park.features);
        const newFeatures = park.features.filter((f) => f.isNew);
        if (newFeatures.length) {
          stats.newFeatures.push(...newFeatures.map((f) => f.slug));
          log(`  ✨ New features: ${newFeatures.map((f) => f.original || f.slug).join(', ')}`);
        }

        // Geocode address
        if (!park.lat || !park.lng) {
          if (park.address) {
            log(`  🔍 Geocoding: "${park.address}, ${park.city}"`);
            const coords = await geocodeAddress(park.address, park.city, park.region);
            if (coords) {
              park.lat = coords.lat;
              park.lng = coords.lng;
            } else {
              log('  ⚠️  Geocoding failed');
              stats.needsGeocoding++;
              await sleep(RATE_LIMIT_MS);
              continue;
            }
          } else {
            log('  ⚠️  No address to geocode');
            stats.needsGeocoding++;
            await sleep(RATE_LIMIT_MS);
            continue;
          }
        }

        // Submit to API
        const submitted = await submitParkToAPI(park, featureRows.map((f) => f.id));
        if (submitted) {
          stats.submitted++;
        }

        await sleep(RATE_LIMIT_MS);
      } catch (err) {
        log(`  ❌ Error: ${err.message}`);
        stats.failed++;
        await sleep(RATE_LIMIT_MS);
      }
    }

    // Summary
    log(`\n${'='.repeat(60)}`);
    log('📊 SUMMARY');
    log(`${'='.repeat(60)}`);
    log(`Discovered:      ${stats.discovered}`);
    log(`Parsed:          ${stats.parsed}`);
    log(`Duplicates:      ${stats.duplicate}`);
    log(`Needs geocoding: ${stats.needsGeocoding}`);
    log(`Submitted:       ${stats.submitted}`);
    log(`Failed:          ${stats.failed}`);
    if (stats.newFeatures.length) {
      log(`\nNew features created: ${[...new Set(stats.newFeatures)].join(', ')}`);
    }
  } finally {
    await pool.end();
    logStream.end();
  }
}

main().catch((err) => {
  logErr(`Fatal error: ${err.message}`);
  logStream.end();
  process.exit(1);
});

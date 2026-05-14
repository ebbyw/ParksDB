# Seattle Parks & Recreation Scraper

Crawls seattle.gov/parks to discover and extract park data, then submits new parks to ParksDB via the submissions API.

## Features

- **Park Discovery**: Crawls index pages to find all park URLs
- **Page Parsing**: Extracts name, address, description, and amenities/features from park detail pages
- **Feature Mapping**: Maps Seattle Parks amenity names to ParksDB feature slugs (e.g., "Spray Parks" → `splash-pad`)
- **Auto-Create Features**: Creates new feature records if unmapped amenities are found
- **Deduplication**: Skips parks already in database
- **Rate Limiting**: Respects server load with 1s delays between requests
- **Dry Run Mode**: Preview submissions without actually posting to API

## Running

### Prerequisites

- Node 20+
- Docker (for containerized execution)
- ParksDB server running (`localhost:3000`)
- Postgres accessible at `localhost:5432` or via `DATABASE_URL` env var

### Local (Node)

```bash
cd scraper
npm install
npm run scrape                # Run scraper
npm run scrape:dry            # Preview without submitting
```

### Docker

```bash
# From ParksDB root
# Clean orphan containers, then run scraper
docker compose down && docker compose --profile scraper run scraper npm run scrape

# Or with preview/test:
docker compose down && docker compose --profile scraper run scraper npm run scrape:dry
docker compose down && docker compose --profile scraper run scraper npm run scrape:test
```

### Environment Variables

- `DATABASE_URL` — Postgres connection (default: `postgres://localhost/parksdb`)
- `API_BASE` — ParksDB API endpoint (default: `http://localhost:3000/api`)
- `DRY_RUN` — If `true`, log submissions without POSTing (default: `false`)

## How It Works

1. **Discovery**: Fetches `/parks/parks` index, extracts all park detail links
2. **Parse**: For each park:
   - Extract name from `<h1>`
   - Extract description from "About" section
   - Extract features from "Amenities" section
   - Extract address from text patterns
3. **Map Features**: Clean feature names, look up in `FEATURE_MAP`:
   - "Spray Parks" → `slug: 'splash-pad'`, `kind: 'facility'`
   - Unmapped names auto-create slugs (e.g., "Skate Bowl" → `skate-bowl`)
4. **Geocoding**: ⚠️ **TODO** — Currently logs parks needing coordinates. Needs:
   - Integration with Google Geocoding API, OR
   - Manual lookup from Seattle Parks API, OR
   - User provides coordinates file
5. **Submit**: POST to `/api/submissions` (kind='create') with park payload + feature IDs
6. **Report**: Summary of discovered, parsed, duplicates, needs-geocoding, submitted

## Geocoding

Uses **Nominatim** (OpenStreetMap, free, no API key) — same as the frontend form.

Process:
1. Scraper extracts address from park page
2. Calls Nominatim API with `[address, city, region, 'US']`
3. Returns lat/lng if found
4. Parks without address or failed geocoding skip submission

**Rate limiting**: Nominatim caps at ~1 req/sec; scraper respects this with `RATE_LIMIT_MS = 1000`

**If address extraction fails**:
- Check HTML parse patterns in `parseParkPage()` — may need refinement for different page layouts
- Or manually add coordinates CSV and merge post-scrape

### Feature Mapping

Some Seattle Parks amenities may not map perfectly. Check `FEATURE_MAP` in `scraper.js`. Unmapped features:
- Auto-create slug from name (e.g., "Tennis Courts" → `tennis-courts`)
- Marked as `kind: 'amenity'` by default
- May need cleanup/merge in DB later

### Moderation Queue

All submissions go to `/api/submissions` and require moderator approval before parks appear in public API.

## Development

### Testing

Run in dry-mode to preview parsing + mapping without submitting:

```bash
npm run scrape:dry
```

Check `scraper.js` FEATURE_MAP for coverage of Seattle Parks amenity names.

### Debugging

Add `console.log()` statements in parse functions, or increase verbosity:

```javascript
// In scraper.js, add detailed logging:
console.log('  Raw features:', park.rawFeatures);
console.log('  Mapped:', park.features);
```

### Adding Features

Edit `FEATURE_MAP` in `scraper.js` to handle new amenity names:

```javascript
'rock climbing wall': { slug: 'climbing-wall', kind: 'facility', category: 'sports' },
```

## TODO

- [ ] Geocoding integration (Google API or Seattle Parks data)
- [ ] Support for park photos/images
- [ ] Handle parks with multiple locations / merged parks
- [ ] Robustness: retry logic for failed pages
- [ ] Logging to file for audit trail
- [ ] Support for editing existing parks (kind='edit' submissions)
- [ ] Configuration file for feature mapping (instead of hardcoded)

## Example Output

```
📍 Discovering park URLs from https://www.seattle.gov/parks/parks...
✓ Found 106 parks

🔄 Processing 106 parks...

[1/106] judkins-park-and-playfield
  Name: Judkins Park and Playfield
  Address: 1125 Harvard Avenue East
  Features: 10 (Spray Parks, Tennis Courts, Play Area, Restrooms, Picnic Sites, Skate Park, Football Fields, Soccer Fields, Basketball Courts, Baseball/Softball Fields)
  ⚠️  Needs geocoding

[2/106] seward-park
  Name: Seward Park
  ...

============================================================
📊 SUMMARY
============================================================
Discovered:      106
Parsed:          106
Duplicates:      0
Needs geocoding: 106
Submitted:       0
Failed:          0
```

## License

See parent ParksDB repo.

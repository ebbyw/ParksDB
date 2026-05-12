# ParksDB

A community-maintained park search engine and REST API. Users can find parks near them, filter by features (basketball court, public bathroom, dog park, etc.), and submit new parks or edits — all moderated to prevent abuse.

This repo contains the MVP:

```
.
├── docker-compose.yml      # Postgres + PostGIS for local dev
├── server/                 # Node + Express REST API
│   ├── migrations/         # SQL schema migrations
│   ├── scripts/migrate.js  # Migration runner
│   ├── seed/seed.js        # Feature catalog + mock parks + admin user
│   └── src/                # Routes, middleware, config
└── client/                 # React + Vite + Leaflet web app
    └── src/                # Map UI, filters, auth, moderation
```

## Architecture at a glance

* **Database** — PostgreSQL with the PostGIS extension. Parks have a `geography(POINT, 4326)` column and a GIST spatial index, so radius and bounding-box queries are fast and correct on the WGS84 sphere.
* **Server** — Stateless Node/Express. Auth is JWT (HttpOnly cookie + Bearer header), passwords are bcrypt-hashed, input is Zod-validated, every endpoint sits behind rate limiting, and writes additionally clear an hCaptcha challenge.
* **Client** — React + Vite SPA. Map-first UI built on Leaflet + OpenStreetMap tiles, with a sidebar of feature filters. Submissions for new parks and edits to existing ones go through a moderation queue.

## Running locally

You need Node 20+ and Docker (for the Postgres container).

```bash
# 1) Start Postgres + PostGIS
docker compose up -d

# 2) Install + bootstrap the API
cd server
cp .env.example .env          # adjust as needed
npm install
npm run migrate               # creates tables, indexes, triggers
npm run seed                  # ~25 features, ~15 mock parks, admin user
npm run dev                   # listens on :4000

# 3) In another terminal, run the web app
cd ../client
npm install
npm run dev                   # listens on :5173, proxies /api → :4000
```

Open <http://localhost:5173>. Sign in with the seeded admin (`admin@parksdb.local` / `ChangeMe!123` by default — change these in `server/.env` before doing anything resembling production).

## Security model

| Concern                 | Mitigation                                                              |
| ----------------------- | ----------------------------------------------------------------------- |
| SQL injection           | All queries are parameterized (`pg` driver, never string-concat)        |
| XSS                     | React escapes by default; Helmet sets `Content-Type` and other headers  |
| CSRF                    | SameSite=Lax cookies + strict CORS allowlist                            |
| Brute-force login       | Per-IP rate limit on `/api/auth/*` (10 failed attempts / 15 min)        |
| Credential stuffing     | bcrypt (12 rounds), generic "invalid email or password" error           |
| Account enumeration     | Constant-ish-time login (always runs a bcrypt compare)                  |
| Bot signups / spam      | hCaptcha on `/auth/register` and `/submissions` (toggle in `.env`)      |
| API abuse               | Global per-IP limit (300 / 15 min); per-user write limit (20 / hour)    |
| Token theft             | JWT in HttpOnly + Secure cookie (in prod); 15-minute access TTL         |
| Vandalism of park data  | All user creates/edits go through a moderator approval queue            |
| Auditability            | Every approval/rejection/direct-edit writes to `audit_log`              |
| Insecure prod defaults  | `config.js` refuses to boot in production with short JWT secret or with CAPTCHA disabled |

### Why a moderation queue and not direct writes?

Direct user writes are the single biggest abuse vector for a UGC site (vandalism, spam, misinformation). For an MVP, holding all submissions in `submissions` until a moderator approves them is simple, auditable, and gives us a paper trail. A natural follow-up (see "Extending") is a per-user trust score: once a user has N approved edits, they can publish directly while new users stay in the queue.

## API surface (MVP)

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/features                # public catalog
POST   /api/features                # admin: add a new feature
PATCH  /api/features/:id            # admin: edit / deactivate

GET    /api/parks                   # search: ?bbox= OR ?lat&lng&radiusKm, ?features=, ?q=
GET    /api/parks/:id
PATCH  /api/parks/:id               # moderator/admin direct edit (bypasses queue)

POST   /api/submissions             # authed user: kind=create | kind=edit
GET    /api/submissions/mine        # authed user: own submissions
GET    /api/submissions             # moderator/admin: queue
POST   /api/submissions/:id/approve # moderator/admin
POST   /api/submissions/:id/reject  # moderator/admin

GET    /api/health
GET    /api/config                  # public CAPTCHA sitekey, etc.
```

## Extending the MVP

The architecture is deliberately wide-open in a few places so you can add capability without rewriting:

* **New park features** — admins POST `/api/features` (or do it via SQL); they immediately appear in the filter sidebar.
* **Map ⟷ list view** — the search endpoint already supports both `bbox` (map) and `lat/lng/radius` (list) modes; a list view is just a different React component pointing at the same endpoint.
* **OAuth login** — `signAccessToken` in `middleware/auth.js` is provider-agnostic. Add a Google/GitHub callback route that resolves to a `users` row and call `signAccessToken`.
* **Trust scores / auto-publish** — add `users.trust_score`, increment it on each approval, and in `submissions.POST` short-circuit to direct write when the score crosses a threshold.
* **OSM import** — a worker can call the Overpass API and insert parks directly with `status='published'`. The same feature taxonomy maps cleanly from OSM tags.
* **Multi-node deploy** — swap `express-rate-limit`'s in-memory store for `rate-limit-redis`. Everything else is already stateless.
* **Photos** — add a `park_photos` table and an S3-signed-upload route. Submissions can carry a photo key in the payload.

## Production checklist

Before exposing this to the internet:

1. Set `NODE_ENV=production` and a real `JWT_SECRET` (≥32 random bytes).
2. Set `CAPTCHA_DISABLED=false` and provision real hCaptcha keys.
3. Change the seed admin credentials.
4. Put the API behind TLS — cookies are marked `Secure` automatically in production.
5. Lock `CORS_ORIGINS` to your actual web host(s).
6. Pin Postgres behind a private network; don't expose 5432.
7. Back up the database; the `submissions` and `audit_log` tables are append-only and worth preserving.

## License

MIT (or whatever you want — this is your project).

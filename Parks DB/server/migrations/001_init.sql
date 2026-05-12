-- ParksDB schema — initial migration
-- Run with: psql $DATABASE_URL -f migrations/001_init.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================================
-- users
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    email           CITEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    display_name    TEXT,
    role            TEXT NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'moderator', 'admin')),
    is_disabled     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- features  (curated catalog — admins can add new entries)
-- =====================================================================
CREATE TABLE IF NOT EXISTS features (
    id              BIGSERIAL PRIMARY KEY,
    slug            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    category        TEXT,                  -- e.g. 'sports', 'amenities'
    icon            TEXT,                  -- optional UI hint
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS features_active_idx ON features(is_active);
CREATE INDEX IF NOT EXISTS features_category_idx ON features(category);

-- =====================================================================
-- parks
-- =====================================================================
CREATE TABLE IF NOT EXISTS parks (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    address         TEXT,
    city            TEXT,
    region          TEXT,                  -- state / province
    country         TEXT NOT NULL DEFAULT 'US',
    -- WGS84 point. Use geography for accurate distance in meters.
    location        GEOGRAPHY(POINT, 4326) NOT NULL,
    status          TEXT NOT NULL DEFAULT 'published'
                    CHECK (status IN ('published', 'hidden', 'removed')),
    created_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for radius / bbox queries
CREATE INDEX IF NOT EXISTS parks_location_gix ON parks USING GIST (location);
CREATE INDEX IF NOT EXISTS parks_status_idx   ON parks(status);
-- pg_trgm enables fast fuzzy name LIKE search via a GIN index.
CREATE INDEX IF NOT EXISTS parks_name_trgm_idx ON parks USING GIN (lower(name) gin_trgm_ops);

-- =====================================================================
-- park_features  (many-to-many)
-- =====================================================================
CREATE TABLE IF NOT EXISTS park_features (
    park_id     BIGINT NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
    feature_id  BIGINT NOT NULL REFERENCES features(id) ON DELETE RESTRICT,
    PRIMARY KEY (park_id, feature_id)
);

CREATE INDEX IF NOT EXISTS park_features_feature_idx ON park_features(feature_id);

-- =====================================================================
-- submissions  (user-submitted creates + edits; moderation queue)
-- =====================================================================
CREATE TABLE IF NOT EXISTS submissions (
    id              BIGSERIAL PRIMARY KEY,
    kind            TEXT NOT NULL CHECK (kind IN ('create', 'edit')),
    -- For 'edit' submissions: target park. For 'create': NULL until approved.
    target_park_id  BIGINT REFERENCES parks(id) ON DELETE CASCADE,
    payload         JSONB NOT NULL,         -- proposed park data + feature_ids[]
    submitted_by    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    moderator_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    moderator_note  TEXT,
    moderated_at    TIMESTAMPTZ,
    submitter_ip    INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS submissions_status_idx       ON submissions(status);
CREATE INDEX IF NOT EXISTS submissions_submitted_by_idx ON submissions(submitted_by);
CREATE INDEX IF NOT EXISTS submissions_kind_idx         ON submissions(kind);

-- =====================================================================
-- audit_log  (security-relevant events for traceability)
-- =====================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    actor_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,         -- e.g. 'park.approve', 'user.login'
    target      TEXT,                  -- e.g. 'park:42', 'submission:101'
    meta        JSONB,
    ip          INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_actor_idx  ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action);

-- =====================================================================
-- updated_at trigger helper
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS parks_set_updated_at ON parks;
CREATE TRIGGER parks_set_updated_at BEFORE UPDATE ON parks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;

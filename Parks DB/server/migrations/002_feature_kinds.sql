-- 002 — add `kind` to features.
--
-- `kind` captures the *semantic role* of a feature for the UI and filters:
--   park_type     — what the park IS (Dog Park, Beach, Skate Park, Botanical Garden)
--   facility      — substantial built thing the park HAS (basketball court, pool)
--   amenity       — small on-site item (picnic tables, recycling bins, bathroom)
--   accessibility — disability/access properties (wheelchair access, ADA playground)
--   environment   — setting/ambience (shade trees, community garden)
--
-- The existing `category` column stays — it remains the finer-grained label used
-- to sub-group items inside a kind (e.g. category='racket sports' inside the
-- 'facility' kind).

BEGIN;

ALTER TABLE features
    ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'amenity'
    CHECK (kind IN ('park_type','facility','amenity','accessibility','environment'));

CREATE INDEX IF NOT EXISTS features_kind_idx ON features(kind);

-- Re-tag features that were seeded under the old flat taxonomy. Safe to re-run.
UPDATE features SET kind = 'park_type'
    WHERE slug IN ('dog-park','skate-park');

UPDATE features SET kind = 'facility'
    WHERE slug IN (
        'basketball-court','tennis-court','soccer-field','baseball-field',
        'pickleball-court','volleyball-court','running-track','swimming-pool',
        'splash-pad','playground','walking-trail','bike-trail','fishing'
    );

UPDATE features SET kind = 'accessibility'
    WHERE slug IN ('wheelchair-access','ada-playground');

UPDATE features SET kind = 'environment'
    WHERE slug IN ('shade-trees','community-garden');

-- The remaining seeded slugs (public-bathroom, drinking-fountain, parking, wifi,
-- picnic-tables, bbq-grills, benches) keep the default kind='amenity'.

COMMIT;

-- Auto-reject Dexter submissions + process approved ones into parks
-- Rejects placeholder entries and creates parks from approved submissions
-- Run with: psql $DATABASE_URL -f scripts/approve-non-dexter-submissions.sql

BEGIN;

-- 0. Auto-approve pending 'create' submissions that have real coordinates and
--    do NOT use the Dexter Ave placeholder address.
WITH to_approve AS (
  SELECT id
  FROM submissions
  WHERE status = 'pending'
    AND kind = 'create'
    AND (payload->>'address') IS DISTINCT FROM '100 Dexter Ave N, Seattle, WA, 98109'
    AND (payload->>'lat') IS NOT NULL
    AND (payload->>'lng') IS NOT NULL
),
approved AS (
  UPDATE submissions
  SET status = 'approved',
      moderator_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
      moderator_note = 'Auto-approved: real coordinates, non-placeholder address',
      moderated_at = NOW()
  WHERE id IN (SELECT id FROM to_approve)
  RETURNING id
)
SELECT COUNT(*) as auto_approved_count FROM approved;

-- 1. Reject pending submissions WITH the Dexter address (the duplicates)
WITH submissions_to_reject AS (
  SELECT id, payload->>'name' as name, payload->>'address' as address
  FROM submissions
  WHERE status = 'pending'
    AND (payload->>'address') IS NOT DISTINCT FROM '100 Dexter Ave N, Seattle, WA, 98109'
),
rejected AS (
  UPDATE submissions
  SET status = 'rejected',
      moderator_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
      moderator_note = 'Duplicate/placeholder entry from park info page (shared address)',
      moderated_at = NOW()
  WHERE id IN (SELECT id FROM submissions_to_reject)
  RETURNING id
)
SELECT COUNT(*) as rejected_count FROM rejected;

-- 2. Create parks from approved 'create' submissions that haven't been processed yet
WITH pending_creates AS (
  SELECT id, payload,
         (payload->>'lat')::float as lat,
         (payload->>'lng')::float as lng
  FROM submissions
  WHERE status = 'approved'
    AND kind = 'create'
    AND target_park_id IS NULL
),
created_parks AS (
  INSERT INTO parks (name, description, address, city, region, country, location, created_by)
  SELECT
    payload->>'name',
    payload->>'description',
    payload->>'address',
    payload->>'city',
    payload->>'region',
    COALESCE(payload->>'country', 'US'),
    ST_MakePoint(lng, lat)::geography,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
  FROM pending_creates
  RETURNING id as park_id, (SELECT COUNT(*) FROM pending_creates) as total
),
link_submissions AS (
  UPDATE submissions s
  SET target_park_id = (SELECT MAX(park_id) FROM created_parks)
  WHERE id IN (SELECT id FROM pending_creates)
  RETURNING s.id
),
link_features AS (
  INSERT INTO park_features (park_id, feature_id)
  SELECT DISTINCT
    (SELECT MAX(park_id) FROM created_parks),
    f.id
  FROM pending_creates pc,
       jsonb_array_elements((pc.payload->'featureIds')::jsonb) as fid,
       features f
  WHERE f.id = (fid::text)::bigint
  ON CONFLICT DO NOTHING
)
SELECT COUNT(*) as parks_created FROM created_parks;

-- 3. Show summary
SELECT
  (SELECT COUNT(*) FROM submissions WHERE status = 'pending') as remaining_pending,
  (SELECT COUNT(*) FROM submissions WHERE status = 'approved') as total_approved,
  (SELECT COUNT(*) FROM submissions WHERE status = 'rejected') as total_rejected,
  (SELECT COUNT(*) FROM parks) as total_parks;

COMMIT;

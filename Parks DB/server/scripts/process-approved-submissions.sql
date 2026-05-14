-- Process approved submissions: create parks from 'create' submissions
-- Run with: psql $DATABASE_URL -f scripts/process-approved-submissions.sql

BEGIN;

-- For each approved 'create' submission, create the park and update submission
WITH pending_creates AS (
  SELECT id, payload, status
  FROM submissions
  WHERE status = 'approved'
    AND kind = 'create'
    AND target_park_id IS NULL  -- Not yet processed
  LIMIT 100  -- Process in batches to avoid huge transactions
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
    ST_MakePoint(
      (payload->>'lng')::float,
      (payload->>'lat')::float
    )::geography,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)  -- Created by admin
  FROM pending_creates
  RETURNING id as park_id
),
updated_submissions AS (
  UPDATE submissions s
  SET target_park_id = cp.park_id
  FROM pending_creates pc
  CROSS JOIN (SELECT park_id FROM created_parks LIMIT 1) cp
  WHERE s.id = pc.id
  RETURNING s.id, s.payload->>'name' as park_name
)
SELECT
  COUNT(*) as parks_created,
  COUNT(*) as submissions_updated
FROM created_parks, updated_submissions;

-- Show summary
SELECT
  COUNT(*) FILTER (WHERE kind = 'create' AND target_park_id IS NULL) as unprocessed_creates,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_submissions,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_submissions
FROM submissions;

COMMIT;

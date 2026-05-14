-- Find and remove duplicate submissions (keep oldest, remove newer duplicates)
-- Includes pending, approved, AND rejected to prevent re-submitting rejected parks
-- Run with: psql $DATABASE_URL -f scripts/cleanup-duplicate-submissions.sql

BEGIN;

-- First, identify duplicates: same name + address, keep the one with lowest id (oldest)
WITH duplicates AS (
  SELECT
    id,
    payload->>'name' as name,
    payload->>'address' as address,
    status,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY (payload->>'name'), (payload->>'address')
      ORDER BY id ASC
    ) as rn
  FROM submissions
)
SELECT
  COUNT(*) as total_duplicates,
  COUNT(*) FILTER (WHERE rn > 1) as to_delete
FROM duplicates
WHERE rn > 1;

-- Delete the duplicates (keeping the oldest submission of each park)
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY (payload->>'name'), (payload->>'address')
      ORDER BY id ASC
    ) as rn
  FROM submissions
)
DELETE FROM submissions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

COMMIT;

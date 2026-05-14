-- 003 — add 'scraper' role for automated park data import
--
-- The scraper role is used by the Seattle Parks crawler to submit new parks
-- to the moderation queue without being rate-limited. It sits between regular
-- users and moderators in privilege level.

BEGIN;

-- Add scraper to allowed roles in the users table.
-- We must drop and recreate the constraint since CHECK constraints can't be altered directly.
ALTER TABLE users
    DROP CONSTRAINT users_role_check;

ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'moderator', 'admin', 'scraper'));

COMMIT;

-- 004 — add features missing from initial seed: off-leash dog area,
--        American football field, multi-use court.

BEGIN;

INSERT INTO features (slug, name, kind, category) VALUES
    ('dog-off-leash-area', 'Off-leash dog area', 'facility',  'recreation'),
    ('football-field',     'Football field',     'facility',  'field sports'),
    ('multi-use-court',    'Multi-use court',    'facility',  'ball sports')
ON CONFLICT (slug) DO NOTHING;

COMMIT;

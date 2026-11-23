-- ============================================
-- MIGRATION: a phase can be removed from one company (e.g. it showed in "Waiting for you" by mistake).
-- skipped_phases lists the stage ids removed for that company. The company itself stays.
-- ============================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS skipped_phases TEXT[] DEFAULT '{}';

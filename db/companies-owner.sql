-- ============================================
-- MIGRATION: remember who registered each company, so a staff member sees only their own companies in
-- Company Directory / Renewal Companies (an admin sees all). The column is filled by the database from the
-- signed-in user. Older companies have no owner and are visible to admins only.
-- (The workflow stages still read company names so the hand-over between stages keeps working.)
-- ============================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS companies_created_by_idx ON companies (created_by);

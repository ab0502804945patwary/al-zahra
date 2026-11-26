-- ============================================
-- MIGRATION: who works on a company in a workflow phase ("Assigned")
-- Only an admin sets it. It hides nothing: everyone with the phase still sees the company and the assigned photos.
-- Safe to run more than once. Run it again if rls-lockdown.sql is ever re-run (that file drops all policies).
-- ============================================
CREATE TABLE IF NOT EXISTS stage_assignments (
  company_id TEXT NOT NULL REFERENCES companies(company_id) ON UPDATE CASCADE ON DELETE CASCADE,
  stage INT NOT NULL,
  user_ids TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, stage)
);
ALTER TABLE stage_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stage_assignments_select ON stage_assignments;
CREATE POLICY stage_assignments_select ON stage_assignments FOR SELECT
  USING (get_user_role() = 'admin' OR user_has_stage(stage));

DROP POLICY IF EXISTS stage_assignments_admin ON stage_assignments;
CREATE POLICY stage_assignments_admin ON stage_assignments FOR ALL
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

NOTIFY pgrst, 'reload schema';

-- ============================================
-- MIGRATION: "Others Service" license type
-- The admin ticks the phases a company needs and picks the staff for each one.
-- companies.phase_staff = { "<stage id>": ["<staff auth user id>", ...] }
-- Records of such a company in a phase are visible and editable only for the picked staff (admins: always).
-- Safe to run more than once. Run it again if rls-lockdown.sql is ever re-run (that file drops all policies).
-- ============================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phase_staff JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION phase_staff_allowed(cid TEXT, stage INT) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(get_user_role() = 'admin', false) OR NOT EXISTS (
    SELECT 1 FROM companies c
    WHERE c.company_id = cid
      AND c.entity_type = 'Others Service'
      AND c.phase_staff <> '{}'::jsonb
      AND NOT COALESCE((c.phase_staff -> stage::text) ? auth.uid()::text, false)
  )
$$;

-- RESTRICTIVE: applies on top of the existing "staff of this phase" rules, it never opens anything new
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('stage1_mother_company', 1), ('stage2_activity_list', 2), ('stage3_foreign_company', 3), ('stage4_misa_license', 4),
    ('stage5_commercial_registration', 5), ('stage6_other_websites', 6), ('stage7_file_ready', 7), ('stage8_name_clearance', 8),
    ('stage9_bd_company', 9), ('stage10_foreign_mother', 10), ('stage11_foreign_subsidiary_2', 11)
  ) AS v(t, n) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.t || '_phase_staff', r.t);
    EXECUTE format('CREATE POLICY %I ON %I AS RESTRICTIVE FOR ALL USING (phase_staff_allowed(company_id, %s)) WITH CHECK (phase_staff_allowed(company_id, %s))', r.t || '_phase_staff', r.t, r.n, r.n);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

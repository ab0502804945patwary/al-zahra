-- ============================================
-- MIGRATION: lock down row level security
-- Removes the open "allow_all_*" policies. Rules now:
--   admin  : read, add, change everything
--   staff  : read companies; read/add/change only the stages they are assigned to
--   delete : nobody directly. Deletes go through /api/delete (master password, service key)
-- ============================================
DO $$
DECLARE r record; t text;
BEGIN
  FOR r IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename <> 'app_settings' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;

  -- companies
  CREATE POLICY companies_admin_select ON companies FOR SELECT USING (get_user_role() = 'admin');
  CREATE POLICY companies_admin_insert ON companies FOR INSERT WITH CHECK (get_user_role() = 'admin');
  CREATE POLICY companies_admin_update ON companies FOR UPDATE USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
  CREATE POLICY companies_staff_select ON companies FOR SELECT USING (get_user_role() IS NOT NULL);

  -- employees (staff see only their own row; colleague names are read on the server)
  CREATE POLICY employees_admin_select ON employees FOR SELECT USING (get_user_role() = 'admin');
  CREATE POLICY employees_admin_insert ON employees FOR INSERT WITH CHECK (get_user_role() = 'admin');
  CREATE POLICY employees_admin_update ON employees FOR UPDATE USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
  CREATE POLICY employees_self_select ON employees FOR SELECT USING (user_id = auth.uid());

  -- stage tables
  FOREACH t IN ARRAY ARRAY['stage1_mother_company','stage2_activity_list','stage3_foreign_company','stage4_misa_license','stage5_commercial_registration','stage6_other_websites','stage7_file_ready','stage8_name_clearance','stage9_bd_company'] LOOP
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (get_user_role() = ''admin'')', t || '_admin_select', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (get_user_role() = ''admin'')', t || '_admin_insert', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (get_user_role() = ''admin'') WITH CHECK (get_user_role() = ''admin'')', t || '_admin_update', t);
  END LOOP;
  CREATE POLICY stage1_staff_select ON stage1_mother_company FOR SELECT USING (user_has_stage(1));
  CREATE POLICY stage1_staff_insert ON stage1_mother_company FOR INSERT WITH CHECK (user_has_stage(1));
  CREATE POLICY stage1_staff_update ON stage1_mother_company FOR UPDATE USING (user_has_stage(1)) WITH CHECK (user_has_stage(1));
  CREATE POLICY stage2_staff_select ON stage2_activity_list FOR SELECT USING (user_has_stage(2));
  CREATE POLICY stage2_staff_insert ON stage2_activity_list FOR INSERT WITH CHECK (user_has_stage(2));
  CREATE POLICY stage2_staff_update ON stage2_activity_list FOR UPDATE USING (user_has_stage(2)) WITH CHECK (user_has_stage(2));
  CREATE POLICY stage3_staff_select ON stage3_foreign_company FOR SELECT USING (user_has_stage(3));
  CREATE POLICY stage3_staff_insert ON stage3_foreign_company FOR INSERT WITH CHECK (user_has_stage(3));
  CREATE POLICY stage3_staff_update ON stage3_foreign_company FOR UPDATE USING (user_has_stage(3)) WITH CHECK (user_has_stage(3));
  CREATE POLICY stage4_staff_select ON stage4_misa_license FOR SELECT USING (user_has_stage(4));
  CREATE POLICY stage4_staff_insert ON stage4_misa_license FOR INSERT WITH CHECK (user_has_stage(4));
  CREATE POLICY stage4_staff_update ON stage4_misa_license FOR UPDATE USING (user_has_stage(4)) WITH CHECK (user_has_stage(4));
  CREATE POLICY stage5_staff_select ON stage5_commercial_registration FOR SELECT USING (user_has_stage(5));
  CREATE POLICY stage5_staff_insert ON stage5_commercial_registration FOR INSERT WITH CHECK (user_has_stage(5));
  CREATE POLICY stage5_staff_update ON stage5_commercial_registration FOR UPDATE USING (user_has_stage(5)) WITH CHECK (user_has_stage(5));
  CREATE POLICY stage6_staff_select ON stage6_other_websites FOR SELECT USING (user_has_stage(6));
  CREATE POLICY stage6_staff_insert ON stage6_other_websites FOR INSERT WITH CHECK (user_has_stage(6));
  CREATE POLICY stage6_staff_update ON stage6_other_websites FOR UPDATE USING (user_has_stage(6)) WITH CHECK (user_has_stage(6));
  CREATE POLICY stage7_staff_select ON stage7_file_ready FOR SELECT USING (user_has_stage(7));
  CREATE POLICY stage7_staff_insert ON stage7_file_ready FOR INSERT WITH CHECK (user_has_stage(7));
  CREATE POLICY stage7_staff_update ON stage7_file_ready FOR UPDATE USING (user_has_stage(7)) WITH CHECK (user_has_stage(7));
  CREATE POLICY stage8_staff_select ON stage8_name_clearance FOR SELECT USING (user_has_stage(8));
  CREATE POLICY stage8_staff_insert ON stage8_name_clearance FOR INSERT WITH CHECK (user_has_stage(8));
  CREATE POLICY stage8_staff_update ON stage8_name_clearance FOR UPDATE USING (user_has_stage(8)) WITH CHECK (user_has_stage(8));
  CREATE POLICY stage9_staff_select ON stage9_bd_company FOR SELECT USING (user_has_stage(9));
  CREATE POLICY stage9_staff_insert ON stage9_bd_company FOR INSERT WITH CHECK (user_has_stage(9));
  CREATE POLICY stage9_staff_update ON stage9_bd_company FOR UPDATE USING (user_has_stage(9)) WITH CHECK (user_has_stage(9));
END $$;

-- Deleting a staff member must not be blocked by records that point to them
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT conrelid::regclass::text AS t, conname FROM pg_constraint
           WHERE contype = 'f' AND connamespace = 'public'::regnamespace AND confrelid = 'employees'::regclass AND conrelid <> 'employees'::regclass LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.t, r.conname);
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL', r.t, r.conname);
  END LOOP;
END $$;

-- Indexes for the lookups the app does on every page
CREATE INDEX IF NOT EXISTS idx_stage1_company ON stage1_mother_company(company_id);
CREATE INDEX IF NOT EXISTS idx_stage2_company ON stage2_activity_list(company_id);
CREATE INDEX IF NOT EXISTS idx_stage3_company ON stage3_foreign_company(company_id);
CREATE INDEX IF NOT EXISTS idx_stage4_company ON stage4_misa_license(company_id);
CREATE INDEX IF NOT EXISTS idx_stage5_company ON stage5_commercial_registration(company_id);
CREATE INDEX IF NOT EXISTS idx_stage6_company ON stage6_other_websites(company_id);
CREATE INDEX IF NOT EXISTS idx_stage7_company ON stage7_file_ready(company_id);
CREATE INDEX IF NOT EXISTS idx_stage8_company ON stage8_name_clearance(company_id);
CREATE INDEX IF NOT EXISTS idx_stage9_company ON stage9_bd_company(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_created ON companies(created_at);
NOTIFY pgrst, 'reload schema';

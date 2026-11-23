-- ============================================
-- MIGRATION: two new workflow phases (standard record: company link, foreign company name, country,
-- registration no, dates, payment, status).
--   Stage 10  Foreign Mother Company            (menu: right after Bangladesh Company Name)
--   Stage 11  2 Foreign Subsidiary Company      (menu: right after 1 Foreign Subsidiary Company = stage 3)
-- Same staff rules as every stage: staff only their assigned phase, the submission date is fixed, completed = locked.
-- ============================================

CREATE TABLE IF NOT EXISTS stage10_foreign_mother (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT REFERENCES companies(company_id) ON DELETE CASCADE,
  foreign_company_name TEXT,
  country TEXT,
  registration_no TEXT,
  client_name TEXT,
  client_phone TEXT,
  category TEXT,
  priority TEXT,
  current_stage TEXT,
  submit_date DATE,
  target_date DATE,
  complete_date DATE,
  payment_status TEXT,
  remarks TEXT,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  drive_link TEXT,
  overdue_status TEXT,
  days_taken INTEGER,
  status TEXT,
  completion_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stage10_foreign_mother_company ON stage10_foreign_mother(company_id);
ALTER TABLE stage10_foreign_mother ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stage10_foreign_mother_admin_select ON stage10_foreign_mother;
DROP POLICY IF EXISTS stage10_foreign_mother_admin_insert ON stage10_foreign_mother;
DROP POLICY IF EXISTS stage10_foreign_mother_admin_update ON stage10_foreign_mother;
DROP POLICY IF EXISTS stage10_foreign_mother_staff_select ON stage10_foreign_mother;
DROP POLICY IF EXISTS stage10_foreign_mother_staff_insert ON stage10_foreign_mother;
DROP POLICY IF EXISTS stage10_foreign_mother_staff_update ON stage10_foreign_mother;
CREATE POLICY stage10_foreign_mother_admin_select ON stage10_foreign_mother FOR SELECT USING (user_has_module('dashboard'));
CREATE POLICY stage10_foreign_mother_admin_insert ON stage10_foreign_mother FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY stage10_foreign_mother_admin_update ON stage10_foreign_mother FOR UPDATE USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY stage10_foreign_mother_staff_select ON stage10_foreign_mother FOR SELECT USING (user_has_stage(10));
CREATE POLICY stage10_foreign_mother_staff_insert ON stage10_foreign_mother FOR INSERT WITH CHECK (user_has_stage(10));
CREATE POLICY stage10_foreign_mother_staff_update ON stage10_foreign_mother FOR UPDATE USING (user_has_stage(10)) WITH CHECK (user_has_stage(10));
DROP TRIGGER IF EXISTS guard_stage10_foreign_mother ON stage10_foreign_mother;
CREATE TRIGGER guard_stage10_foreign_mother BEFORE INSERT OR UPDATE ON stage10_foreign_mother FOR EACH ROW EXECUTE FUNCTION guard_staff_entry();
CREATE TABLE IF NOT EXISTS stage11_foreign_subsidiary_2 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT REFERENCES companies(company_id) ON DELETE CASCADE,
  foreign_company_name TEXT,
  country TEXT,
  registration_no TEXT,
  client_name TEXT,
  client_phone TEXT,
  category TEXT,
  priority TEXT,
  current_stage TEXT,
  submit_date DATE,
  target_date DATE,
  complete_date DATE,
  payment_status TEXT,
  remarks TEXT,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  drive_link TEXT,
  overdue_status TEXT,
  days_taken INTEGER,
  status TEXT,
  completion_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stage11_foreign_subsidiary_2_company ON stage11_foreign_subsidiary_2(company_id);
ALTER TABLE stage11_foreign_subsidiary_2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stage11_foreign_subsidiary_2_admin_select ON stage11_foreign_subsidiary_2;
DROP POLICY IF EXISTS stage11_foreign_subsidiary_2_admin_insert ON stage11_foreign_subsidiary_2;
DROP POLICY IF EXISTS stage11_foreign_subsidiary_2_admin_update ON stage11_foreign_subsidiary_2;
DROP POLICY IF EXISTS stage11_foreign_subsidiary_2_staff_select ON stage11_foreign_subsidiary_2;
DROP POLICY IF EXISTS stage11_foreign_subsidiary_2_staff_insert ON stage11_foreign_subsidiary_2;
DROP POLICY IF EXISTS stage11_foreign_subsidiary_2_staff_update ON stage11_foreign_subsidiary_2;
CREATE POLICY stage11_foreign_subsidiary_2_admin_select ON stage11_foreign_subsidiary_2 FOR SELECT USING (user_has_module('dashboard'));
CREATE POLICY stage11_foreign_subsidiary_2_admin_insert ON stage11_foreign_subsidiary_2 FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY stage11_foreign_subsidiary_2_admin_update ON stage11_foreign_subsidiary_2 FOR UPDATE USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY stage11_foreign_subsidiary_2_staff_select ON stage11_foreign_subsidiary_2 FOR SELECT USING (user_has_stage(11));
CREATE POLICY stage11_foreign_subsidiary_2_staff_insert ON stage11_foreign_subsidiary_2 FOR INSERT WITH CHECK (user_has_stage(11));
CREATE POLICY stage11_foreign_subsidiary_2_staff_update ON stage11_foreign_subsidiary_2 FOR UPDATE USING (user_has_stage(11)) WITH CHECK (user_has_stage(11));
DROP TRIGGER IF EXISTS guard_stage11_foreign_subsidiary_2 ON stage11_foreign_subsidiary_2;
CREATE TRIGGER guard_stage11_foreign_subsidiary_2 BEFORE INSERT OR UPDATE ON stage11_foreign_subsidiary_2 FOR EACH ROW EXECUTE FUNCTION guard_staff_entry();
NOTIFY pgrst, 'reload schema';

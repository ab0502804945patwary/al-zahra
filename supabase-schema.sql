-- ============================================
-- AL ZAHRA ERP - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  assigned_stage INTEGER, -- NULL means all stages (admin)
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPANIES TABLE (Master Data)
-- ============================================
CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT UNIQUE NOT NULL, -- e.g., AZC801
  country_of_origin TEXT,
  company_name TEXT NOT NULL,
  entity_type TEXT,
  
  -- Registration & Legal
  cr_number TEXT,
  cr_issue_date DATE,
  cr_expire_date DATE,
  misa_license_no TEXT,
  misa_issue_date DATE,
  misa_expire_date DATE,
  tin_number TEXT,
  vat_number TEXT,
  chamber_registration_no TEXT,
  gosi_qiwa_status TEXT,
  
  -- Contact & Location
  official_email TEXT,
  whatsapp_number TEXT,
  national_address TEXT,
  
  -- Key Personnel
  ceo_gm_name TEXT,
  iqama_no TEXT,
  shareholders_name TEXT,
  shareholder_phone TEXT,
  
  -- Banking
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT,
  iban_swift TEXT,
  
  -- Admin
  file_portal_login TEXT,
  account_status TEXT DEFAULT 'Active',
  assigned_office TEXT,
  drive_link TEXT,
  remarks TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAGE 1: MOTHER COMPANY
-- ============================================
CREATE TABLE stage1_mother_company (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT REFERENCES companies(company_id) ON DELETE CASCADE,
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
  employee_id UUID REFERENCES employees(id),
  drive_link TEXT,
  -- Auto-calculated
  overdue_status TEXT,
  days_taken INTEGER,
  status TEXT, -- Green, Yellow, Red
  completion_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAGE 2: ACTIVITY LIST
-- ============================================
CREATE TABLE stage2_activity_list (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT REFERENCES companies(company_id) ON DELETE CASCADE,
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
  employee_id UUID REFERENCES employees(id),
  drive_link TEXT,
  overdue_status TEXT,
  days_taken INTEGER,
  status TEXT,
  completion_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAGE 3: FOREIGN COMPANY (USA + Canada)
-- ============================================
CREATE TABLE stage3_foreign_company (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT REFERENCES companies(company_id) ON DELETE CASCADE,
  client_name TEXT,
  client_phone TEXT,
  category TEXT,
  priority TEXT,
  current_stage TEXT,
  
  -- USA
  usa_type TEXT,
  usa_submit_date DATE,
  usa_target_date DATE,
  usa_complete_date DATE,
  usa_overdue_status TEXT,
  usa_days_taken INTEGER,
  usa_status TEXT,
  usa_completion_percent INTEGER,
  usa_payment_status TEXT,
  
  -- Canada
  canada_type TEXT,
  canada_submit_date DATE,
  canada_target_date DATE,
  canada_complete_date DATE,
  canada_overdue_status TEXT,
  canada_days_taken INTEGER,
  canada_status TEXT,
  canada_completion_percent INTEGER,
  canada_payment_status TEXT,
  
  remarks TEXT,
  employee_id UUID REFERENCES employees(id),
  drive_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAGE 4: MISA LICENSE
-- ============================================
CREATE TABLE stage4_misa_license (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT REFERENCES companies(company_id) ON DELETE CASCADE,
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
  employee_id UUID REFERENCES employees(id),
  drive_link TEXT,
  overdue_status TEXT,
  days_taken INTEGER,
  status TEXT,
  completion_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAGE 5: COMMERCIAL REGISTRATION
-- ============================================
CREATE TABLE stage5_commercial_registration (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT REFERENCES companies(company_id) ON DELETE CASCADE,
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
  employee_id UUID REFERENCES employees(id),
  drive_link TEXT,
  overdue_status TEXT,
  days_taken INTEGER,
  status TEXT,
  completion_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAGE 6: OTHER WEBSITES
-- ============================================
CREATE TABLE stage6_other_websites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT REFERENCES companies(company_id) ON DELETE CASCADE,
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
  employee_id UUID REFERENCES employees(id),
  drive_link TEXT,
  overdue_status TEXT,
  days_taken INTEGER,
  status TEXT,
  completion_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAGE 7: FILE READY / FINAL STAGE
-- ============================================
CREATE TABLE stage7_file_ready (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT REFERENCES companies(company_id) ON DELETE CASCADE,
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
  employee_id UUID REFERENCES employees(id),
  drive_link TEXT,
  overdue_status TEXT,
  days_taken INTEGER,
  status TEXT,
  completion_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAGE 8: NAME CLEARANCE
-- ============================================
CREATE TABLE stage8_name_clearance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT REFERENCES companies(company_id) ON DELETE CASCADE,
  entity_type TEXT,
  company_name_english TEXT,
  arabic_name TEXT,
  name_clearance_number TEXT,
  submit_date DATE,
  approval_date DATE,
  expire_date DATE,
  remaining_days INTEGER,
  status TEXT DEFAULT 'Active',
  cr_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage1_mother_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage2_activity_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage3_foreign_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage4_misa_license ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage5_commercial_registration ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage6_other_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage7_file_ready ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage8_name_clearance ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function: get current user stage
CREATE OR REPLACE FUNCTION get_user_stage()
RETURNS INTEGER AS $$
  SELECT assigned_stage FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- COMPANIES: Admin full access, Employees read-only
CREATE POLICY "admin_all_companies" ON companies FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "employee_read_companies" ON companies FOR SELECT USING (get_user_role() = 'employee');

-- EMPLOYEES: Admin full access, Employee read own
CREATE POLICY "admin_all_employees" ON employees FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "employee_read_own" ON employees FOR SELECT USING (user_id = auth.uid());

-- STAGE 1: Admin all, Stage 1 employee all
CREATE POLICY "admin_stage1" ON stage1_mother_company FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "emp_stage1" ON stage1_mother_company FOR ALL USING (get_user_stage() = 1);

-- STAGE 2
CREATE POLICY "admin_stage2" ON stage2_activity_list FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "emp_stage2" ON stage2_activity_list FOR ALL USING (get_user_stage() = 2);

-- STAGE 3
CREATE POLICY "admin_stage3" ON stage3_foreign_company FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "emp_stage3" ON stage3_foreign_company FOR ALL USING (get_user_stage() = 3);

-- STAGE 4
CREATE POLICY "admin_stage4" ON stage4_misa_license FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "emp_stage4" ON stage4_misa_license FOR ALL USING (get_user_stage() = 4);

-- STAGE 5
CREATE POLICY "admin_stage5" ON stage5_commercial_registration FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "emp_stage5" ON stage5_commercial_registration FOR ALL USING (get_user_stage() = 5);

-- STAGE 6
CREATE POLICY "admin_stage6" ON stage6_other_websites FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "emp_stage6" ON stage6_other_websites FOR ALL USING (get_user_stage() = 6);

-- STAGE 7
CREATE POLICY "admin_stage7" ON stage7_file_ready FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "emp_stage7" ON stage7_file_ready FOR ALL USING (get_user_stage() = 7);

-- STAGE 8
CREATE POLICY "admin_stage8" ON stage8_name_clearance FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "emp_stage8" ON stage8_name_clearance FOR ALL USING (get_user_stage() = 8);

-- ============================================
-- SAMPLE DATA
-- ============================================
-- (demo seed companies AZC801/AZC802 removed: all data is entered by the team)


-- ============================================
-- MIGRATION: Add avatar_url to employees
-- ============================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================
-- MIGRATION: Company service type
-- 'a2z'     = A2Z handles the full setup (stage-by-stage handoff)
-- 'renewal' = existing company, renewal only (no handoff chain)
-- ============================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'a2z';

-- MIGRATION: Account handler name on companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee TEXT;

-- MIGRATION: Client contact stored once on the company (stages read it from here)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- MIGRATION: staff can be assigned one or more stages
ALTER TABLE employees ADD COLUMN IF NOT EXISTS assigned_stages INTEGER[] DEFAULT '{}';
UPDATE employees SET assigned_stages = ARRAY[assigned_stage] WHERE assigned_stage IS NOT NULL AND (assigned_stages IS NULL OR assigned_stages = '{}');
CREATE OR REPLACE FUNCTION user_has_stage(n INTEGER) RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT n = ANY(assigned_stages) OR assigned_stage = n FROM employees WHERE user_id = auth.uid() LIMIT 1), false);
$$ LANGUAGE SQL SECURITY DEFINER;
-- emp_stageN policies now use: FOR ALL USING (user_has_stage(N))

-- ============================================
-- MIGRATION: app settings (hashed master password used to confirm deletes)
-- Server-only: RLS is on and there are no policies, so only the service role can use it.
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- MIGRATION: province / state of the company
ALTER TABLE companies ADD COLUMN IF NOT EXISTS province TEXT;
-- ============================================
-- STAGE 9: BANGLADESH COMPANY NAME (RJSC registry + workflow)
-- ============================================
CREATE TABLE IF NOT EXISTS stage9_bd_company (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id TEXT REFERENCES companies(company_id) ON DELETE SET NULL,
  bd_company_name TEXT,
  country TEXT DEFAULT 'Bangladesh',
  rjsc_reg_no TEXT,
  issue_no TEXT,
  incorporation_date DATE,
  auditor_firm TEXT,
  rjsc_return_due_date DATE,
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
  employee_id UUID REFERENCES employees(id),
  drive_link TEXT,
  overdue_status TEXT,
  days_taken INTEGER,
  status TEXT,
  completion_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE stage9_bd_company ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_stage9" ON stage9_bd_company;
DROP POLICY IF EXISTS "emp_stage9" ON stage9_bd_company;
CREATE POLICY "admin_stage9" ON stage9_bd_company FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "emp_stage9" ON stage9_bd_company FOR ALL USING (user_has_stage(9));
NOTIFY pgrst, 'reload schema';
-- ============================================
-- MIGRATION: submission date is automatic for staff (today) and fixed; once a record is completed, staff cannot edit it.
-- Admins and server tools (service role) are not restricted.
-- ============================================
CREATE OR REPLACE FUNCTION guard_staff_entry() RETURNS trigger AS $$
DECLARE r text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  r := get_user_role();
  IF r = 'admin' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.submit_date := (now() AT TIME ZONE 'Asia/Riyadh')::date;
    RETURN NEW;
  END IF;
  IF OLD.complete_date IS NOT NULL THEN
    RAISE EXCEPTION 'This record is completed and locked. Only an admin can change it.';
  END IF;
  NEW.submit_date := OLD.submit_date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS guard_stage1 ON stage1_mother_company;
CREATE TRIGGER guard_stage1 BEFORE INSERT OR UPDATE ON stage1_mother_company FOR EACH ROW EXECUTE FUNCTION guard_staff_entry();
DROP TRIGGER IF EXISTS guard_stage2 ON stage2_activity_list;
CREATE TRIGGER guard_stage2 BEFORE INSERT OR UPDATE ON stage2_activity_list FOR EACH ROW EXECUTE FUNCTION guard_staff_entry();
DROP TRIGGER IF EXISTS guard_stage4 ON stage4_misa_license;
CREATE TRIGGER guard_stage4 BEFORE INSERT OR UPDATE ON stage4_misa_license FOR EACH ROW EXECUTE FUNCTION guard_staff_entry();
DROP TRIGGER IF EXISTS guard_stage5 ON stage5_commercial_registration;
CREATE TRIGGER guard_stage5 BEFORE INSERT OR UPDATE ON stage5_commercial_registration FOR EACH ROW EXECUTE FUNCTION guard_staff_entry();
DROP TRIGGER IF EXISTS guard_stage6 ON stage6_other_websites;
CREATE TRIGGER guard_stage6 BEFORE INSERT OR UPDATE ON stage6_other_websites FOR EACH ROW EXECUTE FUNCTION guard_staff_entry();
DROP TRIGGER IF EXISTS guard_stage7 ON stage7_file_ready;
CREATE TRIGGER guard_stage7 BEFORE INSERT OR UPDATE ON stage7_file_ready FOR EACH ROW EXECUTE FUNCTION guard_staff_entry();
DROP TRIGGER IF EXISTS guard_stage9 ON stage9_bd_company;
CREATE TRIGGER guard_stage9 BEFORE INSERT OR UPDATE ON stage9_bd_company FOR EACH ROW EXECUTE FUNCTION guard_staff_entry();

-- NOTE: later migrations live in db/ (run in this order after the file above):
--   db/rls-lockdown.sql      removes open policies, staff/admin/delete rules, indexes
--   db/stage3-8-guard.sql    staff lock + auto submission date for Stage 3 and Stage 8

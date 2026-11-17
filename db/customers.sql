-- ============================================
-- MIGRATION: customers (individual / corporate / VIP / guest clients)
-- Admin only: read, add, change. No direct delete.
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_code TEXT UNIQUE NOT NULL,          -- e.g. CUS0010907
  customer_type TEXT NOT NULL DEFAULT 'Individual', -- Individual, Corporate, VIP, Guest Customer
  profile_picture TEXT,                        -- link to a photo
  given_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  father_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  nid_number TEXT,
  birth_certificate_no TEXT,
  iqama_number TEXT,
  -- contact
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  -- platform
  platform_name TEXT,
  platform_username TEXT,
  platform_registered_on DATE,
  platform_notes TEXT,
  -- passport and documents
  passport_number TEXT,
  passport_issue_date DATE,
  passport_expiry_date DATE,
  passport_issue_country TEXT,
  documents_link TEXT,
  -- status and assignment
  status TEXT NOT NULL DEFAULT 'Active',       -- Active, Inactive, Blocked
  agent TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customers_admin_select ON customers;
DROP POLICY IF EXISTS customers_admin_insert ON customers;
DROP POLICY IF EXISTS customers_admin_update ON customers;
CREATE POLICY customers_admin_select ON customers FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY customers_admin_insert ON customers FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY customers_admin_update ON customers FOR UPDATE USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers (given_name, surname);

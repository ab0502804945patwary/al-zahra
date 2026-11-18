-- ============================================
-- MIGRATION: agents (from "Agent Collection Report": Agent ID, Company Name, Agent Name,
-- Mobile No., Address/Location, Agent Category, Remarks). Admin only, no direct delete.
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_code TEXT UNIQUE NOT NULL,   -- AGT0001
  company_name TEXT,
  agent_name TEXT NOT NULL,
  mobile TEXT,
  address TEXT,
  category TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agents_admin_select ON agents;
DROP POLICY IF EXISTS agents_admin_insert ON agents;
DROP POLICY IF EXISTS agents_admin_update ON agents;
CREATE POLICY agents_admin_select ON agents FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY agents_admin_insert ON agents FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY agents_admin_update ON agents FOR UPDATE USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

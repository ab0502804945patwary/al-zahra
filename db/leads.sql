-- ============================================
-- MIGRATION: leads (people who ask about a service, before they become customers/companies)
-- Anyone with the "leads" module (and admins) can read, add and change. Delete only through
-- /api/delete (master password), like everything else.
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_name TEXT NOT NULL,
  mobile TEXT,
  country TEXT,
  company_name TEXT,
  service_required TEXT,
  source TEXT,                                  -- Website, Facebook, Referral, Google Ads, ...
  assigned_to TEXT,                             -- staff member name
  status TEXT NOT NULL DEFAULT 'New',           -- New, Contacted, Interested, Quotation, Negotiation, Payment, Completed, Lost
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_followup_idx ON leads (follow_up_date);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leads_select ON leads;
DROP POLICY IF EXISTS leads_insert ON leads;
DROP POLICY IF EXISTS leads_update ON leads;
CREATE POLICY leads_select ON leads FOR SELECT USING (user_has_module('leads'));
CREATE POLICY leads_insert ON leads FOR INSERT WITH CHECK (user_has_module('leads'));
CREATE POLICY leads_update ON leads FOR UPDATE USING (user_has_module('leads')) WITH CHECK (user_has_module('leads'));

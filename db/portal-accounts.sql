-- ============================================
-- MIGRATION: portal accounts (user name / password per government portal) on the Stage 6 record.
-- Protected by the existing Stage 6 row-level rules: only admins and the Stage 6 staff can read or change them.
-- Shape: [{"portal":"QIWA","username":"...","password":"...","note":""}]
-- ============================================
ALTER TABLE stage6_other_websites ADD COLUMN IF NOT EXISTS portal_accounts JSONB NOT NULL DEFAULT '[]'::jsonb;

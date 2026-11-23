-- ============================================
-- MIGRATION: login details of the foreign company (email, user name, password) on
-- "1 Foreign Subsidiary Company" and "2 Foreign Subsidiary Company".
-- The password is stored as plain text on purpose (the team needs to read it back).
-- Only admins and the staff of that phase can read it (the phase's row-level rules).
-- ============================================
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS account_email TEXT;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS account_username TEXT;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS account_password TEXT;
ALTER TABLE stage11_foreign_subsidiary_2 ADD COLUMN IF NOT EXISTS account_email TEXT;
ALTER TABLE stage11_foreign_subsidiary_2 ADD COLUMN IF NOT EXISTS account_username TEXT;
ALTER TABLE stage11_foreign_subsidiary_2 ADD COLUMN IF NOT EXISTS account_password TEXT;
NOTIFY pgrst, 'reload schema';

-- MISA Investment License: two portal logins (email + password, user name + password)
ALTER TABLE stage4_misa_license
  ADD COLUMN IF NOT EXISTS misa_email TEXT, ADD COLUMN IF NOT EXISTS misa_email_password TEXT,
  ADD COLUMN IF NOT EXISTS misa_username TEXT, ADD COLUMN IF NOT EXISTS misa_username_password TEXT;

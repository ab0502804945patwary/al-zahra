-- MIGRATION: city of the lead (picked from the country's city list, or typed)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;

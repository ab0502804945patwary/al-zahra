-- 1 Foreign Subsidiary Company: which bank the payment was made through
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS payment_bank TEXT;

-- 2 Foreign Subsidiary Company: which bank the payment was made through
ALTER TABLE stage11_foreign_subsidiary_2 ADD COLUMN IF NOT EXISTS payment_bank TEXT;

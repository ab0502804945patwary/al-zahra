-- Foreign Mother Company: which bank the payment was made through
ALTER TABLE stage10_foreign_mother ADD COLUMN IF NOT EXISTS payment_bank TEXT;

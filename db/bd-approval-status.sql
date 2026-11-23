-- MIGRATION: Bangladesh Company Name (stage 9) gets an approval status next to the company name: Pending / Approved.
ALTER TABLE stage9_bd_company ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'Pending';
UPDATE stage9_bd_company SET approval_status = 'Pending' WHERE approval_status IS NULL;
NOTIFY pgrst, 'reload schema';

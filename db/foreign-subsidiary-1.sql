-- ============================================
-- MIGRATION: "1 Foreign Subsidiary Company" (stage 3) gets the same form as "2 Foreign Subsidiary Company".
--   * standard columns are added (submit / target / complete date, payment, status, days, %)
--   * existing records: the USA dates and status are COPIED into the standard columns (nothing is deleted;
--     the old usa_* / canada_* columns stay in the database but are no longer shown)
--   * City is added to Foreign Mother, 1 and 2 Foreign Subsidiary
--   * staff rules now use the standard columns (submission date fixed, completed = locked)
-- ============================================
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS foreign_company_name TEXT;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS registration_no TEXT;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS submit_date DATE;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS complete_date DATE;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS overdue_status TEXT;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS days_taken INTEGER;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS completion_percent INTEGER;

UPDATE stage3_foreign_company SET
  submit_date = COALESCE(submit_date, usa_submit_date),
  target_date = COALESCE(target_date, usa_target_date),
  complete_date = COALESCE(complete_date, usa_complete_date),
  payment_status = COALESCE(payment_status, usa_payment_status),
  overdue_status = COALESCE(overdue_status, usa_overdue_status),
  days_taken = COALESCE(days_taken, usa_days_taken),
  status = COALESCE(status, usa_status),
  completion_percent = COALESCE(completion_percent, usa_completion_percent);

ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE stage10_foreign_mother ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE stage11_foreign_subsidiary_2 ADD COLUMN IF NOT EXISTS city TEXT;

DROP TRIGGER IF EXISTS guard_stage3 ON stage3_foreign_company;
CREATE TRIGGER guard_stage3 BEFORE INSERT OR UPDATE ON stage3_foreign_company FOR EACH ROW EXECUTE FUNCTION guard_staff_entry();
NOTIFY pgrst, 'reload schema';

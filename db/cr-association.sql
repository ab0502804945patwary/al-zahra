-- ============================================
-- MIGRATION: CR Association Status moves to Commercial Registration (stage 5).
-- Pending / Complete. When it becomes Complete, cr_status_date keeps that day, and the Company Name Clearance
-- countdown (remaining days) of the same company stops on that day.
-- ============================================
ALTER TABLE stage5_commercial_registration ADD COLUMN IF NOT EXISTS cr_status TEXT;
ALTER TABLE stage5_commercial_registration ADD COLUMN IF NOT EXISTS cr_status_date DATE;
NOTIFY pgrst, 'reload schema';

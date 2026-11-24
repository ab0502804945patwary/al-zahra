-- Parent Entity Verification (stage 1): two mandatory tick boxes (Audit Report, Incorporation Update)
ALTER TABLE stage1_mother_company ADD COLUMN IF NOT EXISTS audit_report_done BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS incorporation_update_done BOOLEAN DEFAULT false;
-- they were first added to the Bangladesh phase by mistake
ALTER TABLE stage9_bd_company DROP COLUMN IF EXISTS audit_report_done, DROP COLUMN IF EXISTS incorporation_update_done;

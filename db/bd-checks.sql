-- Bangladesh Company Name phase: two mandatory tick boxes (Audit Report, Incorporation Update)
ALTER TABLE stage9_bd_company ADD COLUMN IF NOT EXISTS audit_report_done BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS incorporation_update_done BOOLEAN DEFAULT false;

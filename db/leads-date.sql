-- MIGRATION: the date of the lead (when the person asked). Defaults to today; older leads take the day they were created.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_date DATE;
UPDATE leads SET lead_date = created_at::date WHERE lead_date IS NULL;
ALTER TABLE leads ALTER COLUMN lead_date SET DEFAULT CURRENT_DATE;

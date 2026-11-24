-- Invoices and expenses remember who created them, so each person's dashboard can show their own accounts summary.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();

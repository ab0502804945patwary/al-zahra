-- ============================================
-- MIGRATION: expenses (number, date, category, account, method, amount in SAR, reference,
-- attachments, notes, status). Admin only. Numbers look like EXP1911260001 =
-- EXP + date (DDMMYY) + 4-digit sequence for that day. No direct deletes.
-- Attachments live in the private storage bucket "expense-files".
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expense_no TEXT UNIQUE NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  account TEXT,                                    -- no longer used
  payment_method TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'SAR',
  reference_no TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',          -- Pending, Approved, Rejected
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{path, name, size}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE expenses ALTER COLUMN account DROP NOT NULL;
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses (expense_date DESC);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS expenses_admin_select ON expenses;
DROP POLICY IF EXISTS expenses_admin_update ON expenses;
CREATE POLICY expenses_admin_select ON expenses FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY expenses_admin_update ON expenses FOR UPDATE USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

CREATE OR REPLACE FUNCTION create_expense(p JSONB) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d DATE; prefix TEXT; n INT; new_id UUID;
BEGIN
  IF get_user_role() IS DISTINCT FROM 'admin' THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF COALESCE(NULLIF(p->>'category', ''), '') = '' THEN RAISE EXCEPTION 'Select a category'; END IF;
  IF COALESCE(NULLIF(p->>'payment_method', ''), '') = '' THEN RAISE EXCEPTION 'Select a payment method'; END IF;
  IF COALESCE((p->>'amount')::NUMERIC, 0) <= 0 THEN RAISE EXCEPTION 'Enter the amount'; END IF;
  IF jsonb_array_length(COALESCE(p->'attachments', '[]'::jsonb)) = 0 THEN RAISE EXCEPTION 'Attach at least one file (bill or receipt)'; END IF;

  d := COALESCE(NULLIF(p->>'expense_date', '')::DATE, CURRENT_DATE);
  prefix := 'EXP' || TO_CHAR(d, 'DDMMYY');
  PERFORM pg_advisory_xact_lock(7002);
  SELECT COALESCE(MAX(RIGHT(expense_no, 4)::INT), 0) + 1 INTO n FROM expenses WHERE expense_no LIKE prefix || '%';
  INSERT INTO expenses (expense_no, expense_date, category, payment_method, amount, reference_no, notes, attachments)
  VALUES (prefix || LPAD(n::TEXT, 4, '0'), d, BTRIM(p->>'category'), p->>'payment_method',
          (p->>'amount')::NUMERIC, NULLIF(p->>'reference_no', ''), NULLIF(p->>'notes', ''), COALESCE(p->'attachments', '[]'::jsonb))
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;

-- Private bucket for the bills and receipts (admin only)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('expense-files', 'expense-files', false, 5242880)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS expense_files_admin_select ON storage.objects;
DROP POLICY IF EXISTS expense_files_admin_insert ON storage.objects;
CREATE POLICY expense_files_admin_select ON storage.objects FOR SELECT USING (bucket_id = 'expense-files' AND get_user_role() = 'admin');
CREATE POLICY expense_files_admin_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'expense-files' AND get_user_role() = 'admin');

-- ============================================
-- MIGRATION: Receive Vouchers (money received from a customer)
-- * Pick a customer: the app shows how much they still owe; pick an invoice: the maximum is that invoice's due.
-- * The amount received is taken off the due automatically (a payment row is added to the invoice, or spread over the
--   customer's oldest unpaid invoices when no invoice is chosen).
-- * "Received By" says which staff member took the money. Status Pending = recorded but not counted yet (e.g. a cheque).
-- Same access as Invoices (module "invoices"); files go to the private bucket "receive-files".
-- ============================================
CREATE TABLE IF NOT EXISTS receive_vouchers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  voucher_no TEXT UNIQUE NOT NULL,                 -- RCV231126001
  receive_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES customers(id),
  invoice_id UUID REFERENCES invoices(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  account_type TEXT NOT NULL,                      -- Cash, Bank Transfer, bKash, Nagad, Cheque, Other
  account_name TEXT,
  status TEXT NOT NULL DEFAULT 'Completed',        -- Completed, Pending
  reference_no TEXT,
  received_by TEXT,
  notes TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS receive_vouchers_customer_idx ON receive_vouchers (customer_id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES receive_vouchers(id);
CREATE INDEX IF NOT EXISTS payments_voucher_idx ON payments (voucher_id);

ALTER TABLE receive_vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS receive_vouchers_select ON receive_vouchers;
CREATE POLICY receive_vouchers_select ON receive_vouchers FOR SELECT USING (user_has_module('invoices'));

-- spread a voucher over its invoice (or the customer's oldest unpaid invoices)
CREATE OR REPLACE FUNCTION apply_receive(v_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v receive_vouchers%ROWTYPE; remaining NUMERIC; r RECORD; due NUMERIC; take NUMERIC;
BEGIN
  SELECT * INTO v FROM receive_vouchers WHERE id = v_id;
  remaining := v.amount;
  FOR r IN
    SELECT i.id, i.total FROM invoices i
    WHERE i.status = 'Active'
      AND ((v.invoice_id IS NOT NULL AND i.id = v.invoice_id) OR (v.invoice_id IS NULL AND i.customer_id = v.customer_id))
    ORDER BY i.invoice_date, i.created_at
    FOR UPDATE
  LOOP
    EXIT WHEN remaining <= 0;
    due := r.total - COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = r.id), 0);
    IF due > 0 THEN
      take := LEAST(due, remaining);
      INSERT INTO payments (invoice_id, paid_on, amount, method, reference, note, voucher_id)
      VALUES (r.id, v.receive_date, take, v.account_type, v.reference_no, 'Voucher ' || v.voucher_no, v.id);
      remaining := remaining - take;
    END IF;
  END LOOP;
  IF remaining > 0 THEN RAISE EXCEPTION 'The amount is more than what is due (BDT % too much)', remaining; END IF;
END $$;

CREATE OR REPLACE FUNCTION create_receive(p JSONB) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d DATE; prefix TEXT; n INT; new_id UUID; amt NUMERIC; inv invoices%ROWTYPE; cust UUID; st TEXT;
BEGIN
  IF NOT user_has_module('invoices') THEN RAISE EXCEPTION 'You do not have access to this'; END IF;
  amt := COALESCE(NULLIF(p->>'amount', '')::NUMERIC, 0);
  IF amt <= 0 THEN RAISE EXCEPTION 'Enter the amount'; END IF;
  IF COALESCE(NULLIF(p->>'account_type', ''), '') = '' THEN RAISE EXCEPTION 'Select the account type'; END IF;
  IF jsonb_array_length(COALESCE(p->'attachments', '[]'::jsonb)) = 0 THEN RAISE EXCEPTION 'Attach at least one file (receipt or slip)'; END IF;
  st := COALESCE(NULLIF(p->>'status', ''), 'Completed');
  IF st NOT IN ('Completed', 'Pending') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  cust := NULLIF(p->>'customer_id', '')::UUID;

  IF NULLIF(p->>'invoice_id', '') IS NOT NULL THEN
    SELECT * INTO inv FROM invoices WHERE id = (p->>'invoice_id')::UUID;
    IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found'; END IF;
    IF inv.status = 'Cancelled' THEN RAISE EXCEPTION 'This invoice is cancelled'; END IF;
    cust := inv.customer_id;
  END IF;
  IF cust IS NULL THEN RAISE EXCEPTION 'Select a customer or an invoice'; END IF;

  d := COALESCE(NULLIF(p->>'receive_date', '')::DATE, CURRENT_DATE);
  prefix := 'RCV' || TO_CHAR(d, 'DDMMYY');
  PERFORM pg_advisory_xact_lock(7003);
  SELECT COALESCE(MAX(RIGHT(voucher_no, 3)::INT), 0) + 1 INTO n FROM receive_vouchers WHERE voucher_no LIKE prefix || '%';
  INSERT INTO receive_vouchers (voucher_no, receive_date, customer_id, invoice_id, amount, account_type, account_name, status, reference_no, received_by, notes, attachments)
  VALUES (prefix || LPAD(n::TEXT, 3, '0'), d, cust, NULLIF(p->>'invoice_id', '')::UUID, amt, p->>'account_type', NULLIF(p->>'account_name', ''),
          st, NULLIF(p->>'reference_no', ''), NULLIF(p->>'received_by', ''), NULLIF(p->>'notes', ''), COALESCE(p->'attachments', '[]'::jsonb))
  RETURNING id INTO new_id;
  IF st = 'Completed' THEN PERFORM apply_receive(new_id); END IF;   -- rejects an amount above the due
  RETURN new_id;
END $$;

-- a Pending voucher (cheque cleared, transfer confirmed) becomes Completed and is taken off the due
CREATE OR REPLACE FUNCTION complete_receive(p_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v receive_vouchers%ROWTYPE;
BEGIN
  IF NOT user_has_module('invoices') THEN RAISE EXCEPTION 'You do not have access to this'; END IF;
  SELECT * INTO v FROM receive_vouchers WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Voucher not found'; END IF;
  IF v.status = 'Completed' THEN RETURN; END IF;
  PERFORM apply_receive(p_id);
  UPDATE receive_vouchers SET status = 'Completed' WHERE id = p_id;
END $$;

-- private bucket for the receipts / slips
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('receive-files', 'receive-files', false, 5242880)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS receive_files_select ON storage.objects;
DROP POLICY IF EXISTS receive_files_insert ON storage.objects;
CREATE POLICY receive_files_select ON storage.objects FOR SELECT USING (bucket_id = 'receive-files' AND user_has_module('invoices'));
CREATE POLICY receive_files_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receive-files' AND user_has_module('invoices'));

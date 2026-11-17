-- ============================================
-- MIGRATION: services catalogue, invoices, invoice items, payments (BDT, no VAT)
-- Admin only. Invoices and payments are created through the functions below so that
-- numbering, totals and over-payment checks happen in the database, atomically.
-- No direct deletes (cancel an invoice instead).
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_no TEXT UNIQUE NOT NULL,             -- INV-000001
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,                          -- copied at creation so old invoices never change
  customer_phone TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Active',       -- Active, Cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  paid_on DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method TEXT,
  reference TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS payments_invoice_idx ON payments (invoice_id);
CREATE INDEX IF NOT EXISTS invoices_customer_idx ON invoices (customer_id);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS services_admin_select ON services;
DROP POLICY IF EXISTS services_admin_insert ON services;
DROP POLICY IF EXISTS services_admin_update ON services;
DROP POLICY IF EXISTS invoices_admin_select ON invoices;
DROP POLICY IF EXISTS invoices_admin_update ON invoices;
DROP POLICY IF EXISTS invoice_items_admin_select ON invoice_items;
DROP POLICY IF EXISTS payments_admin_select ON payments;
CREATE POLICY services_admin_select ON services FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY services_admin_insert ON services FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY services_admin_update ON services FOR UPDATE USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY invoices_admin_select ON invoices FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY invoices_admin_update ON invoices FOR UPDATE USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY invoice_items_admin_select ON invoice_items FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY payments_admin_select ON payments FOR SELECT USING (get_user_role() = 'admin');

-- Create an invoice (with its items and an optional first payment) in one step
CREATE OR REPLACE FUNCTION create_invoice(p JSONB) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv_id UUID; n INT; no TEXT; item JSONB; sub NUMERIC := 0; disc NUMERIC; tot NUMERIC; pay NUMERIC; lt NUMERIC;
BEGIN
  IF get_user_role() IS DISTINCT FROM 'admin' THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF jsonb_array_length(COALESCE(p->'items', '[]'::jsonb)) = 0 THEN RAISE EXCEPTION 'Add at least one service'; END IF;
  IF (p->>'customer_id') IS NULL THEN RAISE EXCEPTION 'Select a customer'; END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p->'items') LOOP
    sub := sub + ROUND((item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC, 2);
  END LOOP;
  disc := COALESCE(NULLIF(p->>'discount', '')::NUMERIC, 0);
  IF disc < 0 OR disc > sub THEN RAISE EXCEPTION 'Invalid discount'; END IF;
  tot := sub - disc;
  pay := COALESCE(NULLIF(p->>'initial_payment', '')::NUMERIC, 0);
  IF pay < 0 OR pay > tot THEN RAISE EXCEPTION 'Payment cannot be more than the total'; END IF;

  PERFORM pg_advisory_xact_lock(7001);
  SELECT COALESCE(MAX(REGEXP_REPLACE(invoice_no, '\D', '', 'g')::INT), 0) + 1 INTO n FROM invoices;
  no := 'INV-' || LPAD(n::TEXT, 6, '0');

  INSERT INTO invoices (invoice_no, customer_id, customer_name, customer_phone, invoice_date, subtotal, discount, total, notes)
  VALUES (no, (p->>'customer_id')::UUID, p->>'customer_name', p->>'customer_phone',
          COALESCE(NULLIF(p->>'invoice_date', '')::DATE, CURRENT_DATE), sub, disc, tot, NULLIF(p->>'notes', ''))
  RETURNING id INTO inv_id;

  FOR item IN SELECT * FROM jsonb_array_elements(p->'items') LOOP
    lt := ROUND((item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC, 2);
    INSERT INTO invoice_items (invoice_id, service_id, description, quantity, unit_price, line_total)
    VALUES (inv_id, NULLIF(item->>'service_id', '')::UUID, item->>'description',
            (item->>'quantity')::NUMERIC, (item->>'unit_price')::NUMERIC, lt);
  END LOOP;

  IF pay > 0 THEN
    INSERT INTO payments (invoice_id, paid_on, amount, method, reference)
    VALUES (inv_id, COALESCE(NULLIF(p->>'invoice_date', '')::DATE, CURRENT_DATE), pay, NULLIF(p->>'method', ''), NULLIF(p->>'reference', ''));
  END IF;
  RETURN inv_id;
END $$;

-- Add a payment to an invoice (rejects over-payment and cancelled invoices)
CREATE OR REPLACE FUNCTION add_payment(p_invoice UUID, p_amount NUMERIC, p_method TEXT, p_reference TEXT, p_paid_on DATE, p_note TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv invoices%ROWTYPE; paid NUMERIC;
BEGIN
  IF get_user_role() IS DISTINCT FROM 'admin' THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO inv FROM invoices WHERE id = p_invoice FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  IF inv.status = 'Cancelled' THEN RAISE EXCEPTION 'This invoice is cancelled'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Enter an amount'; END IF;
  SELECT COALESCE(SUM(amount), 0) INTO paid FROM payments WHERE invoice_id = p_invoice;
  IF paid + p_amount > inv.total THEN RAISE EXCEPTION 'Payment is more than the amount due (%)', inv.total - paid; END IF;
  INSERT INTO payments (invoice_id, paid_on, amount, method, reference, note)
  VALUES (p_invoice, COALESCE(p_paid_on, CURRENT_DATE), p_amount, NULLIF(p_method, ''), NULLIF(p_reference, ''), NULLIF(p_note, ''));
END $$;

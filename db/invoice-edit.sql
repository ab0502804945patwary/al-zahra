-- ============================================
-- MIGRATION: edit an invoice (customer, date, services, discount, notes).
-- Payments already received stay as they are; the new total can never be less than what was paid.
-- Cancelled invoices cannot be edited.
-- ============================================
CREATE OR REPLACE FUNCTION update_invoice(p_invoice UUID, p JSONB) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv invoices%ROWTYPE; item JSONB; sub NUMERIC := 0; disc NUMERIC; tot NUMERIC; paid NUMERIC;
BEGIN
  IF NOT user_has_module('invoices') THEN RAISE EXCEPTION 'You do not have access to this'; END IF;
  SELECT * INTO inv FROM invoices WHERE id = p_invoice FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  IF inv.status = 'Cancelled' THEN RAISE EXCEPTION 'A cancelled invoice cannot be edited'; END IF;
  IF jsonb_array_length(COALESCE(p->'items', '[]'::jsonb)) = 0 THEN RAISE EXCEPTION 'Add at least one service'; END IF;
  IF (p->>'customer_id') IS NULL THEN RAISE EXCEPTION 'Select a customer'; END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p->'items') LOOP
    sub := sub + ROUND((item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC, 2);
  END LOOP;
  disc := COALESCE(NULLIF(p->>'discount', '')::NUMERIC, 0);
  IF disc < 0 OR disc > sub THEN RAISE EXCEPTION 'Invalid discount'; END IF;
  tot := sub - disc;
  SELECT COALESCE(SUM(amount), 0) INTO paid FROM payments WHERE invoice_id = p_invoice;
  IF tot < paid THEN RAISE EXCEPTION 'The new total (%) is less than the % already received', tot, paid; END IF;

  UPDATE invoices SET
    customer_id = (p->>'customer_id')::UUID, customer_name = p->>'customer_name', customer_phone = p->>'customer_phone',
    invoice_date = COALESCE(NULLIF(p->>'invoice_date', '')::DATE, invoice_date),
    subtotal = sub, discount = disc, total = tot, notes = NULLIF(p->>'notes', '')
  WHERE id = p_invoice;

  DELETE FROM invoice_items WHERE invoice_id = p_invoice;
  FOR item IN SELECT * FROM jsonb_array_elements(p->'items') LOOP
    INSERT INTO invoice_items (invoice_id, service_id, description, quantity, unit_price, line_total)
    VALUES (p_invoice, NULLIF(item->>'service_id', '')::UUID, item->>'description', (item->>'quantity')::NUMERIC,
            (item->>'unit_price')::NUMERIC, ROUND((item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC, 2));
  END LOOP;
END $$;

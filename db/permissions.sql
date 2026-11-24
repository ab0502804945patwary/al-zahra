-- Special permissions (off by default). An admin ticks them per staff member in Team & Access Control;
-- they are stored as keys in employees.modules and user_has_module(key) is true for admins and for staff who have the key.
--   perm_invoice_edit, perm_invoice_cancel, perm_expense_approve, perm_lead_delete, edit_stage_<n>

-- invoices: cancel (and only the status changes for non-admins)
CREATE OR REPLACE FUNCTION guard_invoice_cancel() RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NULL OR COALESCE(get_user_role(), '') = 'admin' OR current_setting('app.invoice_edit', true) = '1' THEN RETURN NEW; END IF;
  IF NEW.status = 'Cancelled' AND OLD.status IS DISTINCT FROM 'Cancelled' AND NOT user_has_module('perm_invoice_cancel') THEN
    RAISE EXCEPTION 'You do not have permission to cancel an invoice';
  END IF;
  IF NEW.total IS DISTINCT FROM OLD.total OR NEW.subtotal IS DISTINCT FROM OLD.subtotal OR NEW.discount IS DISTINCT FROM OLD.discount
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id OR NEW.invoice_date IS DISTINCT FROM OLD.invoice_date OR NEW.invoice_no IS DISTINCT FROM OLD.invoice_no THEN
    RAISE EXCEPTION 'Invoice details can only be changed through Edit invoice';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS invoices_admin_update ON invoices;
CREATE POLICY invoices_admin_update ON invoices FOR UPDATE
  USING (get_user_role() = 'admin' OR user_has_module('perm_invoice_cancel'))
  WITH CHECK (get_user_role() = 'admin' OR user_has_module('perm_invoice_cancel'));

-- expenses: approve / reject
CREATE OR REPLACE FUNCTION guard_expense_status() RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND auth.uid() IS NOT NULL AND NOT user_has_module('perm_expense_approve') THEN
    RAISE EXCEPTION 'You do not have permission to approve or reject an expense';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- workflow phases: editing an existing entry needs edit_stage_<n> (adding stays with the assigned phase)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    (1,'stage1_mother_company','stage1_staff_update'),(2,'stage2_activity_list','stage2_staff_update'),
    (3,'stage3_foreign_company','stage3_staff_update'),(4,'stage4_misa_license','stage4_staff_update'),
    (5,'stage5_commercial_registration','stage5_staff_update'),(6,'stage6_other_websites','stage6_staff_update'),
    (7,'stage7_file_ready','stage7_staff_update'),(8,'stage8_name_clearance','stage8_staff_update'),
    (9,'stage9_bd_company','stage9_staff_update'),(10,'stage10_foreign_mother','stage10_foreign_mother_staff_update'),
    (11,'stage11_foreign_subsidiary_2','stage11_foreign_subsidiary_2_staff_update')
  ) AS t(n, tbl, pol) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.pol, r.tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (user_has_stage(%s) AND user_has_module(%L)) WITH CHECK (user_has_stage(%s) AND user_has_module(%L))',
      r.pol, r.tbl, r.n, 'edit_stage_' || r.n, r.n, 'edit_stage_' || r.n);
  END LOOP;
END $$;

-- invoice edit: update_invoice now checks perm_invoice_edit instead of the admin role
CREATE OR REPLACE FUNCTION public.update_invoice(p_invoice uuid, p jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE inv invoices%ROWTYPE; item JSONB; sub NUMERIC := 0; disc NUMERIC; tot NUMERIC; paid NUMERIC;
BEGIN
  IF NOT user_has_module('invoices') THEN RAISE EXCEPTION 'You do not have access to this'; END IF;
  IF NOT user_has_module('perm_invoice_edit') THEN RAISE EXCEPTION 'You do not have permission to edit an invoice'; END IF;
  PERFORM set_config('app.invoice_edit', '1', true);
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
END $function$;

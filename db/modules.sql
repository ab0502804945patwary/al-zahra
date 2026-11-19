-- ============================================
-- MIGRATION: assignable modules (Customers, Invoices, Expenses, Reports, ...) for staff.
-- employees.modules holds the keys an admin ticked in Team & Access Control:
--   dashboard, companies, renewals, customers, agents, services, expenses, reports, invoices
-- Workflow phases stay in employees.assigned_stages. Admins always have everything.
-- ============================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS modules TEXT[] DEFAULT '{}';

CREATE OR REPLACE FUNCTION user_has_module(m TEXT) RETURNS BOOLEAN AS $$
  SELECT COALESCE((
    SELECT role = 'admin' OR m = ANY(COALESCE(modules, '{}'))
    FROM employees WHERE user_id = auth.uid() AND COALESCE(is_active, true) LIMIT 1
  ), false);
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS customers_admin_select ON customers;
CREATE POLICY customers_admin_select ON customers FOR SELECT USING (user_has_module('customers'));
DROP POLICY IF EXISTS customers_admin_insert ON customers;
CREATE POLICY customers_admin_insert ON customers FOR INSERT WITH CHECK (user_has_module('customers'));
DROP POLICY IF EXISTS customers_admin_update ON customers;
CREATE POLICY customers_admin_update ON customers FOR UPDATE USING (user_has_module('customers')) WITH CHECK (user_has_module('customers'));
DROP POLICY IF EXISTS agents_admin_select ON agents;
CREATE POLICY agents_admin_select ON agents FOR SELECT USING (user_has_module('agents'));
DROP POLICY IF EXISTS agents_admin_insert ON agents;
CREATE POLICY agents_admin_insert ON agents FOR INSERT WITH CHECK (user_has_module('agents'));
DROP POLICY IF EXISTS agents_admin_update ON agents;
CREATE POLICY agents_admin_update ON agents FOR UPDATE USING (user_has_module('agents')) WITH CHECK (user_has_module('agents'));
DROP POLICY IF EXISTS services_admin_select ON services;
CREATE POLICY services_admin_select ON services FOR SELECT USING (user_has_module('services'));
DROP POLICY IF EXISTS services_admin_insert ON services;
CREATE POLICY services_admin_insert ON services FOR INSERT WITH CHECK (user_has_module('services'));
DROP POLICY IF EXISTS services_admin_update ON services;
CREATE POLICY services_admin_update ON services FOR UPDATE USING (user_has_module('services')) WITH CHECK (user_has_module('services'));
DROP POLICY IF EXISTS expenses_admin_select ON expenses;
CREATE POLICY expenses_admin_select ON expenses FOR SELECT USING (user_has_module('expenses') OR user_has_module('reports'));
DROP POLICY IF EXISTS expenses_admin_update ON expenses;
CREATE POLICY expenses_admin_update ON expenses FOR UPDATE USING (user_has_module('expenses')) WITH CHECK (user_has_module('expenses'));
DROP POLICY IF EXISTS invoices_admin_select ON invoices;
CREATE POLICY invoices_admin_select ON invoices FOR SELECT USING (user_has_module('invoices') OR user_has_module('reports'));
DROP POLICY IF EXISTS invoices_admin_update ON invoices;
CREATE POLICY invoices_admin_update ON invoices FOR UPDATE USING (user_has_module('invoices')) WITH CHECK (user_has_module('invoices'));
DROP POLICY IF EXISTS invoice_items_admin_select ON invoice_items;
CREATE POLICY invoice_items_admin_select ON invoice_items FOR SELECT USING (user_has_module('invoices') OR user_has_module('reports'));
DROP POLICY IF EXISTS payments_admin_select ON payments;
CREATE POLICY payments_admin_select ON payments FOR SELECT USING (user_has_module('invoices') OR user_has_module('reports'));
DROP POLICY IF EXISTS companies_admin_insert ON companies;
CREATE POLICY companies_admin_insert ON companies FOR INSERT WITH CHECK (user_has_module('companies') OR user_has_module('renewals'));
DROP POLICY IF EXISTS companies_admin_update ON companies;
CREATE POLICY companies_admin_update ON companies FOR UPDATE USING (user_has_module('companies') OR user_has_module('renewals')) WITH CHECK (user_has_module('companies') OR user_has_module('renewals'));
DROP POLICY IF EXISTS stage1_mother_company_admin_select ON stage1_mother_company;
CREATE POLICY stage1_mother_company_admin_select ON stage1_mother_company FOR SELECT USING (user_has_module('dashboard'));
DROP POLICY IF EXISTS stage2_activity_list_admin_select ON stage2_activity_list;
CREATE POLICY stage2_activity_list_admin_select ON stage2_activity_list FOR SELECT USING (user_has_module('dashboard'));
DROP POLICY IF EXISTS stage3_foreign_company_admin_select ON stage3_foreign_company;
CREATE POLICY stage3_foreign_company_admin_select ON stage3_foreign_company FOR SELECT USING (user_has_module('dashboard'));
DROP POLICY IF EXISTS stage4_misa_license_admin_select ON stage4_misa_license;
CREATE POLICY stage4_misa_license_admin_select ON stage4_misa_license FOR SELECT USING (user_has_module('dashboard'));
DROP POLICY IF EXISTS stage5_commercial_registration_admin_select ON stage5_commercial_registration;
CREATE POLICY stage5_commercial_registration_admin_select ON stage5_commercial_registration FOR SELECT USING (user_has_module('dashboard'));
DROP POLICY IF EXISTS stage6_other_websites_admin_select ON stage6_other_websites;
CREATE POLICY stage6_other_websites_admin_select ON stage6_other_websites FOR SELECT USING (user_has_module('dashboard'));
DROP POLICY IF EXISTS stage7_file_ready_admin_select ON stage7_file_ready;
CREATE POLICY stage7_file_ready_admin_select ON stage7_file_ready FOR SELECT USING (user_has_module('dashboard'));
DROP POLICY IF EXISTS stage8_name_clearance_admin_select ON stage8_name_clearance;
CREATE POLICY stage8_name_clearance_admin_select ON stage8_name_clearance FOR SELECT USING (user_has_module('dashboard'));
DROP POLICY IF EXISTS stage9_bd_company_admin_select ON stage9_bd_company;
CREATE POLICY stage9_bd_company_admin_select ON stage9_bd_company FOR SELECT USING (user_has_module('dashboard'));
DROP POLICY IF EXISTS expense_files_admin_insert ON storage.objects;
CREATE POLICY expense_files_admin_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'expense-files' AND user_has_module('expenses'));
DROP POLICY IF EXISTS expense_files_admin_select ON storage.objects;
CREATE POLICY expense_files_admin_select ON storage.objects FOR SELECT USING (bucket_id = 'expense-files' AND (user_has_module('expenses') OR user_has_module('reports')));

CREATE OR REPLACE FUNCTION public.create_invoice(p jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inv_id UUID; n INT; no TEXT; item JSONB; sub NUMERIC := 0; disc NUMERIC; tot NUMERIC; pay NUMERIC; lt NUMERIC;
BEGIN
  IF NOT user_has_module('invoices') THEN RAISE EXCEPTION 'You do not have access to this'; END IF;
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
END $function$;

CREATE OR REPLACE FUNCTION public.add_payment(p_invoice uuid, p_amount numeric, p_method text, p_reference text, p_paid_on date, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE inv invoices%ROWTYPE; paid NUMERIC;
BEGIN
  IF NOT user_has_module('invoices') THEN RAISE EXCEPTION 'You do not have access to this'; END IF;
  SELECT * INTO inv FROM invoices WHERE id = p_invoice FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  IF inv.status = 'Cancelled' THEN RAISE EXCEPTION 'This invoice is cancelled'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Enter an amount'; END IF;
  SELECT COALESCE(SUM(amount), 0) INTO paid FROM payments WHERE invoice_id = p_invoice;
  IF paid + p_amount > inv.total THEN RAISE EXCEPTION 'Payment is more than the amount due (%)', inv.total - paid; END IF;
  INSERT INTO payments (invoice_id, paid_on, amount, method, reference, note)
  VALUES (p_invoice, COALESCE(p_paid_on, CURRENT_DATE), p_amount, NULLIF(p_method, ''), NULLIF(p_reference, ''), NULLIF(p_note, ''));
END $function$;

CREATE OR REPLACE FUNCTION public.create_expense(p jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE d DATE; prefix TEXT; n INT; new_id UUID;
BEGIN
  IF NOT user_has_module('expenses') THEN RAISE EXCEPTION 'You do not have access to this'; END IF;
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
END $function$;

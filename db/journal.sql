-- ============================================
-- MIGRATION: Journal entries (double entry) and Employee Settlement (staff hand over cash to the office)
-- * Chart of accounts (seeded below).
-- * Journal entries with debit / credit lines; an entry is only saved when total debit = total credit.
-- * Entry type "Employee Settlement": cash that a staff member collected from customers (Receive Vouchers with
--   Account Type = Cash, Completed, "Received By" = that person) minus what they have already handed over is their
--   PENDING RECEIVABLE. A settlement debits Cash in Hand / Bank and credits Employee Receivable for that person.
-- Access: module "journal" (admins always). Entries are created through create_journal() only; no direct delete.
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,                        -- Asset, Liability, Equity, Income, Expense
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO accounts (code, name, type) VALUES
  ('1001', 'Cash in Hand', 'Asset'),
  ('1002', 'Bank Account', 'Asset'),
  ('1003', 'Mobile Wallet (bKash / Nagad)', 'Asset'),
  ('1100', 'Accounts Receivable - Customers', 'Asset'),
  ('1200', 'Employee Receivable', 'Asset'),
  ('2000', 'Accounts Payable', 'Liability'),
  ('3000', 'Owner Capital', 'Equity'),
  ('4000', 'Service Income', 'Income'),
  ('5000', 'General Expense', 'Expense'),
  ('5100', 'Salary Expense', 'Expense'),
  ('5200', 'Commission Expense', 'Expense'),
  ('5300', 'Donation Expense', 'Expense'),
  ('5400', 'Office Rent Expense', 'Expense')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  voucher_no TEXT UNIQUE NOT NULL,           -- JV2211260001 or STL2211260001
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Posted',     -- Posted, Draft
  reference_no TEXT,
  description TEXT NOT NULL,
  employee_name TEXT,
  total NUMERIC(12,2) NOT NULL,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS journal_lines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  debit NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  employee_name TEXT,
  memo TEXT,
  CHECK (NOT (debit > 0 AND credit > 0))
);
CREATE INDEX IF NOT EXISTS journal_lines_entry_idx ON journal_lines (entry_id);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS accounts_select ON accounts;
DROP POLICY IF EXISTS journal_entries_select ON journal_entries;
DROP POLICY IF EXISTS journal_lines_select ON journal_lines;
CREATE POLICY accounts_select ON accounts FOR SELECT USING (user_has_module('journal'));
CREATE POLICY journal_entries_select ON journal_entries FOR SELECT USING (user_has_module('journal'));
CREATE POLICY journal_lines_select ON journal_lines FOR SELECT USING (user_has_module('journal'));

-- cash each staff member collected, handed over so far, and still holds
CREATE OR REPLACE FUNCTION employee_cash_balances() RETURNS TABLE (employee_name TEXT, collected NUMERIC, settled NUMERIC, pending NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT user_has_module('journal') THEN RAISE EXCEPTION 'You do not have access to this'; END IF;
  RETURN QUERY
  SELECT e.name::TEXT,
         COALESCE(c.s, 0)::NUMERIC,
         COALESCE(s.s, 0)::NUMERIC,
         (COALESCE(c.s, 0) - COALESCE(s.s, 0))::NUMERIC
  FROM employees e
  LEFT JOIN (SELECT received_by, SUM(amount) s FROM receive_vouchers WHERE status = 'Completed' AND account_type = 'Cash' GROUP BY received_by) c ON c.received_by = e.name
  LEFT JOIN (SELECT l.employee_name, SUM(l.credit) s FROM journal_lines l
             JOIN journal_entries j ON j.id = l.entry_id AND j.status = 'Posted' AND j.entry_type = 'Employee Settlement'
             JOIN accounts a ON a.id = l.account_id AND a.name = 'Employee Receivable'
             GROUP BY l.employee_name) s ON s.employee_name = e.name
  WHERE COALESCE(e.is_active, true)
  ORDER BY e.name;
END $$;

CREATE OR REPLACE FUNCTION create_journal(p JSONB) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d DATE; typ TEXT; st TEXT; prefix TEXT; n INT; new_id UUID; ln JSONB; deb NUMERIC := 0; cre NUMERIC := 0; emp TEXT; settle NUMERIC := 0; pend NUMERIC; acct accounts%ROWTYPE; nlines INT := 0;
BEGIN
  IF NOT user_has_module('journal') THEN RAISE EXCEPTION 'You do not have access to this'; END IF;
  typ := COALESCE(NULLIF(p->>'entry_type', ''), '');
  IF typ NOT IN ('Adjustment', 'Commission Settlement', 'Donation Entry', 'Employee Settlement', 'Expense', 'Transfer', 'Opening Balance', 'General') THEN RAISE EXCEPTION 'Select the entry type'; END IF;
  st := COALESCE(NULLIF(p->>'status', ''), 'Posted');
  IF st NOT IN ('Posted', 'Draft') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  IF COALESCE(NULLIF(BTRIM(p->>'description'), ''), '') = '' THEN RAISE EXCEPTION 'Enter the description'; END IF;
  IF jsonb_array_length(COALESCE(p->'lines', '[]'::jsonb)) < 2 THEN RAISE EXCEPTION 'Add at least two lines (a debit and a credit)'; END IF;
  emp := NULLIF(BTRIM(COALESCE(p->>'employee_name', '')), '');

  FOR ln IN SELECT * FROM jsonb_array_elements(p->'lines') LOOP
    SELECT * INTO acct FROM accounts WHERE id = NULLIF(ln->>'account_id', '')::UUID;
    IF NOT FOUND THEN RAISE EXCEPTION 'Every line needs an account'; END IF;
    IF COALESCE((ln->>'debit')::NUMERIC, 0) > 0 AND COALESCE((ln->>'credit')::NUMERIC, 0) > 0 THEN RAISE EXCEPTION 'A line cannot have both debit and credit'; END IF;
    deb := deb + COALESCE((ln->>'debit')::NUMERIC, 0);
    cre := cre + COALESCE((ln->>'credit')::NUMERIC, 0);
    IF typ = 'Employee Settlement' AND acct.name = 'Employee Receivable' THEN settle := settle + COALESCE((ln->>'credit')::NUMERIC, 0); END IF;
    nlines := nlines + 1;
  END LOOP;
  IF ROUND(deb, 2) <> ROUND(cre, 2) THEN RAISE EXCEPTION 'Not balanced: debit % and credit %', deb, cre; END IF;
  IF deb <= 0 THEN RAISE EXCEPTION 'Enter an amount'; END IF;

  IF typ = 'Employee Settlement' THEN
    IF emp IS NULL THEN RAISE EXCEPTION 'Select the employee'; END IF;
    IF settle <= 0 THEN RAISE EXCEPTION 'An employee settlement must credit Employee Receivable'; END IF;
    IF st = 'Posted' THEN
      SELECT b.pending INTO pend FROM employee_cash_balances() b WHERE b.employee_name = emp;
      IF COALESCE(pend, 0) < settle THEN RAISE EXCEPTION '% hands over % but only % is pending', emp, settle, COALESCE(pend, 0); END IF;
    END IF;
  END IF;

  d := COALESCE(NULLIF(p->>'entry_date', '')::DATE, CURRENT_DATE);
  prefix := CASE WHEN typ = 'Employee Settlement' THEN 'STL' ELSE 'JV' END || TO_CHAR(d, 'DDMMYY');
  PERFORM pg_advisory_xact_lock(7004);
  SELECT COALESCE(MAX(RIGHT(voucher_no, 4)::INT), 0) + 1 INTO n FROM journal_entries WHERE voucher_no LIKE prefix || '%';
  INSERT INTO journal_entries (voucher_no, entry_date, entry_type, status, reference_no, description, employee_name, total)
  VALUES (prefix || LPAD(n::TEXT, 4, '0'), d, typ, st, NULLIF(p->>'reference_no', ''), BTRIM(p->>'description'), emp, deb)
  RETURNING id INTO new_id;
  FOR ln IN SELECT * FROM jsonb_array_elements(p->'lines') LOOP
    SELECT * INTO acct FROM accounts WHERE id = (ln->>'account_id')::UUID;
    INSERT INTO journal_lines (entry_id, account_id, debit, credit, employee_name, memo)
    VALUES (new_id, acct.id, COALESCE((ln->>'debit')::NUMERIC, 0), COALESCE((ln->>'credit')::NUMERIC, 0),
            CASE WHEN typ = 'Employee Settlement' AND acct.name = 'Employee Receivable' THEN emp ELSE NULL END, NULLIF(ln->>'memo', ''));
  END LOOP;
  RETURN new_id;
END $$;

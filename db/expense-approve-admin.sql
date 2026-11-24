-- Anyone with the Expenses module can add an expense (it starts as Pending). Only an admin can change its status (Approve / Reject).
CREATE OR REPLACE FUNCTION guard_expense_status() RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND auth.uid() IS NOT NULL AND COALESCE(get_user_role(), '') <> 'admin' THEN
    RAISE EXCEPTION 'Only an admin can approve or reject an expense';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS guard_expense_status ON expenses;
CREATE TRIGGER guard_expense_status BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION guard_expense_status();

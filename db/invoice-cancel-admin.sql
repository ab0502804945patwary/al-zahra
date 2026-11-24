-- Only an admin can cancel an invoice (staff with the Invoices module can still create and edit them).
CREATE OR REPLACE FUNCTION guard_invoice_cancel() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'Cancelled' AND OLD.status IS DISTINCT FROM 'Cancelled' AND auth.uid() IS NOT NULL AND COALESCE(get_user_role(), '') <> 'admin' THEN
    RAISE EXCEPTION 'Only an admin can cancel an invoice';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS guard_invoice_cancel ON invoices;
CREATE TRIGGER guard_invoice_cancel BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION guard_invoice_cancel();

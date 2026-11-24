-- Leads: a staff member sees and edits only the leads they created; an admin sees all. Only an admin can delete a lead.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();

-- older leads: owner = the staff member the lead is assigned to (matched by name); the rest stay admin only
UPDATE leads l SET created_by = e.user_id FROM employees e WHERE l.created_by IS NULL AND e.name = l.assigned_to AND e.user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION guard_lead_owner() RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN NEW.created_by := auth.uid();
  ELSIF NEW.created_by IS DISTINCT FROM OLD.created_by AND COALESCE(get_user_role(), '') <> 'admin' THEN NEW.created_by := OLD.created_by; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS guard_lead_owner ON leads;
CREATE TRIGGER guard_lead_owner BEFORE INSERT OR UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION guard_lead_owner();

DROP POLICY IF EXISTS leads_select ON leads;
DROP POLICY IF EXISTS leads_update ON leads;
CREATE POLICY leads_select ON leads FOR SELECT USING (user_has_module('leads') AND (get_user_role() = 'admin' OR created_by = auth.uid()));
CREATE POLICY leads_update ON leads FOR UPDATE USING (user_has_module('leads') AND (get_user_role() = 'admin' OR created_by = auth.uid())) WITH CHECK (user_has_module('leads') AND (get_user_role() = 'admin' OR created_by = auth.uid()));

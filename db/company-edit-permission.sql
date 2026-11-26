-- ============================================
-- MIGRATION: let the admin allow chosen staff to edit companies
--   perm_company_edit  + module "companies" -> may edit Company Register companies (including those that finished the workflow)
--   perm_renewal_edit  + module "renewals"  -> may edit Renewal Companies
-- Taking the tick away stops it at once. Active/Inactive and "Registered by" stay admin only; delete is unchanged.
-- Safe to run more than once. Run it again if rls-lockdown.sql, modules.sql or companies-admin-only.sql is re-run.
-- ============================================
DROP POLICY IF EXISTS companies_admin_update ON companies;
CREATE POLICY companies_admin_update ON companies FOR UPDATE
  USING (
    get_user_role() = 'admin'
    OR ((service_type IS DISTINCT FROM 'renewal' OR workflow_completed_at IS NOT NULL) AND user_has_module('companies') AND user_has_module('perm_company_edit'))
    OR (service_type = 'renewal' AND user_has_module('renewals') AND user_has_module('perm_renewal_edit'))
  )
  WITH CHECK (
    get_user_role() = 'admin'
    OR ((service_type IS DISTINCT FROM 'renewal' OR workflow_completed_at IS NOT NULL) AND user_has_module('companies') AND user_has_module('perm_company_edit'))
    OR (service_type = 'renewal' AND user_has_module('renewals') AND user_has_module('perm_renewal_edit'))
  );

CREATE OR REPLACE FUNCTION guard_company_admin_fields() RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND COALESCE(get_user_role(), '') <> 'admin' AND (
       NEW.created_by IS DISTINCT FROM OLD.created_by
    OR COALESCE(NULLIF(NEW.account_status, ''), 'Active') IS DISTINCT FROM COALESCE(NULLIF(OLD.account_status, ''), 'Active')
  ) THEN
    RAISE EXCEPTION 'Only an admin can change the Status or "Registered by" of a company';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS guard_company_admin_fields ON companies;
CREATE TRIGGER guard_company_admin_fields BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION guard_company_admin_fields();

NOTIFY pgrst, 'reload schema';

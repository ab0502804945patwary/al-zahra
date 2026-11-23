-- ============================================
-- MIGRATION: the approved Bangladesh company name becomes the company's name everywhere.
--   * Bangladesh Company Name record set to Approved  -> companies.company_name = that name; the name before is kept in
--     original_company_name and shown small under the new name.
--   * set back to Pending (or the record is deleted)   -> the earlier name comes back.
-- Runs inside the database, so it works whoever (admin or the phase's staff) presses Approved.
-- ============================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS original_company_name TEXT;

CREATE OR REPLACE FUNCTION sync_bd_company_name() RETURNS trigger AS $$
DECLARE cid TEXT; nm TEXT; ok BOOLEAN;
BEGIN
  IF TG_OP = 'DELETE' THEN
    cid := OLD.company_id; ok := false; nm := NULL;
  ELSE
    cid := NEW.company_id; nm := NULLIF(BTRIM(COALESCE(NEW.bd_company_name, '')), '');
    ok := (NEW.approval_status = 'Approved' AND nm IS NOT NULL);
  END IF;
  IF cid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  IF ok THEN
    UPDATE companies SET original_company_name = COALESCE(original_company_name, company_name), company_name = nm WHERE company_id = cid;
  ELSE
    -- back to the earlier name (only when this company had been renamed by an approval)
    UPDATE companies SET company_name = original_company_name, original_company_name = NULL
     WHERE company_id = cid AND original_company_name IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM stage9_bd_company s WHERE s.company_id = cid AND s.approval_status = 'Approved' AND COALESCE(BTRIM(s.bd_company_name), '') <> '' AND (TG_OP = 'INSERT' OR s.id <> COALESCE(OLD.id, NEW.id)));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_bd_name ON stage9_bd_company;
CREATE TRIGGER sync_bd_name AFTER INSERT OR UPDATE OR DELETE ON stage9_bd_company FOR EACH ROW EXECUTE FUNCTION sync_bd_company_name();
NOTIFY pgrst, 'reload schema';

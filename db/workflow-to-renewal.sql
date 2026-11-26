-- When the Final Legal Dossier (stage 7) gets a Completion Date, the company moves to Renewal Companies.
-- Clearing that date (admins only) or deleting the record brings it back to the workflow.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS workflow_completed_at DATE;

CREATE OR REPLACE FUNCTION guard_final_completion() RETURNS trigger AS $$
BEGIN
  IF OLD.complete_date IS NOT NULL AND NEW.complete_date IS NULL AND auth.uid() IS NOT NULL AND COALESCE(get_user_role(), '') <> 'admin' THEN
    RAISE EXCEPTION 'Only an admin can remove the Completion Date of a finished file';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS guard_final_completion ON stage7_file_ready;
CREATE TRIGGER guard_final_completion BEFORE UPDATE ON stage7_file_ready FOR EACH ROW EXECUTE FUNCTION guard_final_completion();

CREATE OR REPLACE FUNCTION sync_company_renewal() RETURNS trigger AS $$
DECLARE cid TEXT; done DATE;
BEGIN
  IF TG_OP = 'DELETE' THEN cid := OLD.company_id; ELSE cid := NEW.company_id; END IF;
  IF cid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  SELECT MAX(complete_date) INTO done FROM stage7_file_ready WHERE company_id = cid;

  IF done IS NOT NULL THEN
    UPDATE companies c SET
      service_type = 'renewal',
      workflow_completed_at = done,
      -- the Renewal form has its own fields: fill the empty ones from what the workflow already collected
      ceo_gm_name = COALESCE(NULLIF(c.ceo_gm_name, ''), NULLIF(c.admin_name, '')),
      iqama_no = COALESCE(NULLIF(c.iqama_no, ''), NULLIF(c.admin_iqama_no, '')),
      shareholders_name = COALESCE(NULLIF(c.shareholders_name, ''), NULLIF(c.shareholders -> 0 ->> 'name', '')),
      shareholder_phone = COALESCE(NULLIF(c.shareholder_phone, ''), NULLIF(c.shareholders -> 0 ->> 'phone', '')),
      rjsc_reg_no = COALESCE(NULLIF(c.rjsc_reg_no, ''), (SELECT s.rjsc_reg_no FROM stage9_bd_company s WHERE s.company_id = cid AND NULLIF(s.rjsc_reg_no, '') IS NOT NULL ORDER BY s.created_at DESC LIMIT 1)),
      rjsc_incorporation_date = COALESCE(c.rjsc_incorporation_date, (SELECT s.incorporation_date FROM stage9_bd_company s WHERE s.company_id = cid AND s.incorporation_date IS NOT NULL ORDER BY s.created_at DESC LIMIT 1)),
      rjsc_issue_no = COALESCE(NULLIF(c.rjsc_issue_no, ''), (SELECT s.issue_no FROM stage9_bd_company s WHERE s.company_id = cid AND NULLIF(s.issue_no, '') IS NOT NULL ORDER BY s.created_at DESC LIMIT 1)),
      updated_at = NOW()
    WHERE c.company_id = cid AND (c.service_type IS DISTINCT FROM 'renewal' OR c.workflow_completed_at IS NOT NULL);
  ELSE
    -- only companies this rule moved are moved back; companies registered as renewal stay as they are
    UPDATE companies SET service_type = 'a2z', workflow_completed_at = NULL, updated_at = NOW()
    WHERE company_id = cid AND workflow_completed_at IS NOT NULL;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS sync_company_renewal ON stage7_file_ready;
CREATE TRIGGER sync_company_renewal AFTER INSERT OR UPDATE OR DELETE ON stage7_file_ready FOR EACH ROW EXECUTE FUNCTION sync_company_renewal();

-- files that were already finished before this rule
UPDATE stage7_file_ready SET complete_date = complete_date WHERE complete_date IS NOT NULL;

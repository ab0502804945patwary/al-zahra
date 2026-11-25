-- Parent Entity Verification: Submission Date = the day the company reached this phase (set by the app, locked in the form).
-- 1) stage 9 remembers the day its name was Approved (Service License companies reach Parent on that day)
ALTER TABLE stage9_bd_company ADD COLUMN IF NOT EXISTS approved_at DATE;
UPDATE stage9_bd_company SET approved_at = (COALESCE(updated_at, created_at) AT TIME ZONE 'Asia/Riyadh')::date WHERE approval_status = 'Approved' AND approved_at IS NULL;
CREATE OR REPLACE FUNCTION stamp_bd_approved_at() RETURNS trigger AS $$
BEGIN
  IF NEW.approval_status = 'Approved' THEN
    IF NEW.approved_at IS NULL THEN NEW.approved_at := (now() AT TIME ZONE 'Asia/Riyadh')::date; END IF;
  ELSE
    NEW.approved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS stamp_bd_approved_at ON stage9_bd_company;
CREATE TRIGGER stamp_bd_approved_at BEFORE INSERT OR UPDATE ON stage9_bd_company FOR EACH ROW EXECUTE FUNCTION stamp_bd_approved_at();

-- 2) staff may save the date the app worked out for a new Parent record (never a future date); other phases still get today
CREATE OR REPLACE FUNCTION guard_staff_entry() RETURNS trigger AS $$
DECLARE r text; today date := (now() AT TIME ZONE 'Asia/Riyadh')::date;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  r := get_user_role();
  IF r = 'admin' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'stage1_mother_company' AND NEW.submit_date IS NOT NULL AND NEW.submit_date <= today THEN
      RETURN NEW;
    END IF;
    NEW.submit_date := today;
    RETURN NEW;
  END IF;
  IF OLD.complete_date IS NOT NULL THEN
    RAISE EXCEPTION 'This record is completed and locked. Only an admin can change it.';
  END IF;
  NEW.submit_date := OLD.submit_date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

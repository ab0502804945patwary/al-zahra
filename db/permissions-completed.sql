-- A staff member with the "Can edit phase ..." permission (edit_stage_<n>) may also change a completed / approved record.
-- Without it a completed record stays locked for staff (admins always can). The Submission Date is still never changed by staff.
CREATE OR REPLACE FUNCTION guard_staff_entry() RETURNS trigger AS $$
DECLARE r text; today date := (now() AT TIME ZONE 'Asia/Riyadh')::date; n text := substring(TG_TABLE_NAME from '^stage(\d+)_');
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
  IF OLD.complete_date IS NOT NULL AND NOT user_has_module('edit_stage_' || n) THEN
    RAISE EXCEPTION 'This record is completed and locked. Only an admin can change it.';
  END IF;
  NEW.submit_date := OLD.submit_date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION guard_staff_stage8() RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NULL OR get_user_role() = 'admin' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.submit_date := (now() AT TIME ZONE 'Asia/Riyadh')::date;
    RETURN NEW;
  END IF;
  IF OLD.approval_date IS NOT NULL AND NOT user_has_module('edit_stage_8') THEN
    RAISE EXCEPTION 'This record is approved and locked. Only an admin can change it.';
  END IF;
  NEW.submit_date := OLD.submit_date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

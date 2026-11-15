-- Stage 3 (Foreign Entity) and Stage 8 (Trade Name Clearance): same staff rules as the other stages.
CREATE OR REPLACE FUNCTION guard_staff_stage3() RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NULL OR get_user_role() = 'admin' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.usa_complete_date IS NOT NULL THEN
    RAISE EXCEPTION 'This record is completed and locked. Only an admin can change it.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION guard_staff_stage8() RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NULL OR get_user_role() = 'admin' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.submit_date := (now() AT TIME ZONE 'Asia/Riyadh')::date;
    RETURN NEW;
  END IF;
  IF OLD.approval_date IS NOT NULL THEN
    RAISE EXCEPTION 'This record is approved and locked. Only an admin can change it.';
  END IF;
  NEW.submit_date := OLD.submit_date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS guard_stage3 ON stage3_foreign_company;
CREATE TRIGGER guard_stage3 BEFORE INSERT OR UPDATE ON stage3_foreign_company FOR EACH ROW EXECUTE FUNCTION guard_staff_stage3();
DROP TRIGGER IF EXISTS guard_stage8 ON stage8_name_clearance;
CREATE TRIGGER guard_stage8 BEFORE INSERT OR UPDATE ON stage8_name_clearance FOR EACH ROW EXECUTE FUNCTION guard_staff_stage8();

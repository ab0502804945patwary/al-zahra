-- Bangladesh Company Name phase: a record can be added while the work is still at Document Collection (no name yet).
-- The name is needed only to mark it Approved.
CREATE OR REPLACE FUNCTION stamp_bd_approved_at() RETURNS trigger AS $$
BEGIN
  IF NEW.approval_status = 'Approved' THEN
    IF COALESCE(BTRIM(NEW.bd_company_name), '') = '' THEN
      RAISE EXCEPTION 'Add the Bangladesh company name before it is approved';
    END IF;
    IF NEW.approved_at IS NULL THEN NEW.approved_at := (now() AT TIME ZONE 'Asia/Riyadh')::date; END IF;
  ELSE
    NEW.approved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

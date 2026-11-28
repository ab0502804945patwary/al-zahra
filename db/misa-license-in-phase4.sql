-- MISA Investment License phase: its staff may save the license number and dates to the company profile.
-- Only these three columns; a blank value keeps what is already saved. Safe to run more than once.
CREATE OR REPLACE FUNCTION public.set_company_misa_license(p_company_id TEXT, p_no TEXT, p_issue DATE, p_expire DATE)
RETURNS VOID AS $$
BEGIN
  IF NOT COALESCE(get_user_role() = 'admin' OR user_has_stage(4), false) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  UPDATE companies SET
    misa_license_no = COALESCE(NULLIF(p_no, ''), misa_license_no),
    misa_issue_date = COALESCE(p_issue, misa_issue_date),
    misa_expire_date = COALESCE(p_expire, misa_expire_date),
    updated_at = NOW()
  WHERE company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.set_company_misa_license(TEXT, TEXT, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_company_misa_license(TEXT, TEXT, DATE, DATE) TO authenticated;

NOTIFY pgrst, 'reload schema';

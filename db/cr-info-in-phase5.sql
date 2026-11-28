-- Commercial Registration phase: its staff may save the CR details and Saudi audit information to the company profile.
-- Only these columns; a blank value keeps what is already saved. Safe to run more than once.
CREATE OR REPLACE FUNCTION public.set_company_cr_info(p_company_id TEXT, p JSONB)
RETURNS VOID AS $$
BEGIN
  IF NOT COALESCE(get_user_role() = 'admin' OR user_has_stage(5), false) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  UPDATE companies SET
    cr_number = COALESCE(NULLIF(p->>'cr_number', ''), cr_number),
    cr_issue_date = COALESCE(NULLIF(p->>'cr_issue_date', '')::DATE, cr_issue_date),
    cr_expire_date = COALESCE(NULLIF(p->>'cr_expire_date', '')::DATE, cr_expire_date),
    sa_last_audit_date = COALESCE(NULLIF(p->>'sa_last_audit_date', '')::DATE, sa_last_audit_date),
    sa_audit_status = COALESCE(NULLIF(p->>'sa_audit_status', ''), sa_audit_status),
    sa_next_audit_due = COALESCE(NULLIF(p->>'sa_next_audit_due', '')::DATE, sa_next_audit_due),
    sa_financial_year = COALESCE(NULLIF(p->>'sa_financial_year', ''), sa_financial_year),
    updated_at = NOW()
  WHERE company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.set_company_cr_info(TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_company_cr_info(TEXT, JSONB) TO authenticated;

NOTIFY pgrst, 'reload schema';

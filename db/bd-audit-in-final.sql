-- Final Legal Dossier & Issuance: Bangladesh audit information is saved to the company profile too.
CREATE OR REPLACE FUNCTION public.update_company_statutory(p_company_id text, p jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (get_user_role() = 'admin' OR user_has_stage(7)) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE companies SET
    cr_number = CASE WHEN p ? 'cr_number' THEN NULLIF(p->>'cr_number', '') ELSE cr_number END,
    cr_issue_date = CASE WHEN p ? 'cr_issue_date' THEN NULLIF(p->>'cr_issue_date', '')::DATE ELSE cr_issue_date END,
    cr_expire_date = CASE WHEN p ? 'cr_expire_date' THEN NULLIF(p->>'cr_expire_date', '')::DATE ELSE cr_expire_date END,
    misa_license_no = CASE WHEN p ? 'misa_license_no' THEN NULLIF(p->>'misa_license_no', '') ELSE misa_license_no END,
    misa_issue_date = CASE WHEN p ? 'misa_issue_date' THEN NULLIF(p->>'misa_issue_date', '')::DATE ELSE misa_issue_date END,
    misa_expire_date = CASE WHEN p ? 'misa_expire_date' THEN NULLIF(p->>'misa_expire_date', '')::DATE ELSE misa_expire_date END,
    tin_number = CASE WHEN p ? 'tin_number' THEN NULLIF(p->>'tin_number', '') ELSE tin_number END,
    vat_number = CASE WHEN p ? 'vat_number' THEN NULLIF(p->>'vat_number', '') ELSE vat_number END,
    chamber_registration_no = CASE WHEN p ? 'chamber_registration_no' THEN NULLIF(p->>'chamber_registration_no', '') ELSE chamber_registration_no END,
    gosi_qiwa_status = CASE WHEN p ? 'gosi_qiwa_status' THEN NULLIF(p->>'gosi_qiwa_status', '') ELSE gosi_qiwa_status END,
    sa_last_audit_date = CASE WHEN p ? 'sa_last_audit_date' THEN NULLIF(p->>'sa_last_audit_date', '')::DATE ELSE sa_last_audit_date END,
    sa_audit_status = CASE WHEN p ? 'sa_audit_status' THEN NULLIF(p->>'sa_audit_status', '') ELSE sa_audit_status END,
    sa_next_audit_due = CASE WHEN p ? 'sa_next_audit_due' THEN NULLIF(p->>'sa_next_audit_due', '')::DATE ELSE sa_next_audit_due END,
    sa_financial_year = CASE WHEN p ? 'sa_financial_year' THEN NULLIF(p->>'sa_financial_year', '') ELSE sa_financial_year END,
    sa_auditor = CASE WHEN p ? 'sa_auditor' THEN NULLIF(p->>'sa_auditor', '') ELSE sa_auditor END,
    sa_audit_notes = CASE WHEN p ? 'sa_audit_notes' THEN NULLIF(p->>'sa_audit_notes', '') ELSE sa_audit_notes END,
    sa_audit_files = CASE WHEN p ? 'sa_audit_files' AND jsonb_typeof(p->'sa_audit_files') = 'array' THEN p->'sa_audit_files' ELSE sa_audit_files END,
    bd_last_audit_date = CASE WHEN p ? 'bd_last_audit_date' THEN NULLIF(p->>'bd_last_audit_date', '')::DATE ELSE bd_last_audit_date END,
    bd_audit_status = CASE WHEN p ? 'bd_audit_status' THEN NULLIF(p->>'bd_audit_status', '') ELSE bd_audit_status END,
    bd_next_audit_due = CASE WHEN p ? 'bd_next_audit_due' THEN NULLIF(p->>'bd_next_audit_due', '')::DATE ELSE bd_next_audit_due END,
    bd_financial_year = CASE WHEN p ? 'bd_financial_year' THEN NULLIF(p->>'bd_financial_year', '') ELSE bd_financial_year END,
    bd_audit_notes = CASE WHEN p ? 'bd_audit_notes' THEN NULLIF(p->>'bd_audit_notes', '') ELSE bd_audit_notes END,
    updated_at = NOW()
  WHERE company_id = p_company_id;
END $function$;

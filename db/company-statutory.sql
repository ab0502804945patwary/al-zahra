-- ============================================
-- MIGRATION: statutory identifiers (CR, MISA, TIN, VAT, Chamber, GOSI/Qiwa) are filled in
-- at the end of the process (Final Dossier & Filing, Stage 7). The staff member who works on
-- Stage 7 may update ONLY these columns of a company; everything else on companies stays admin-only.
-- ============================================
CREATE OR REPLACE FUNCTION update_company_statutory(p_company_id TEXT, p JSONB) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    updated_at = NOW()
  WHERE company_id = p_company_id;
END $$;

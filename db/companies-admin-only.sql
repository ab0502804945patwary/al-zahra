-- ============================================
-- MIGRATION: only an admin can change or delete an existing company.
-- Staff with the Company Directory / Renewal Companies module can still REGISTER a new company (insert).
-- Delete already goes through /api/delete (admins only for companies). The Stage 7 staff keep the
-- limited update_company_statutory() function for the CR/MISA/TIN/VAT/Chamber/GOSI numbers only.
-- ============================================
DROP POLICY IF EXISTS companies_admin_update ON companies;
CREATE POLICY companies_admin_update ON companies FOR UPDATE USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

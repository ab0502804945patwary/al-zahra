-- ============================================
-- MIGRATION: the next company ID (AZC801, AZC802, ...) is worked out by the database itself,
-- from ALL companies, so two people registering at the same time (or a screen that is a few
-- minutes old) no longer try to use the same ID ("duplicate key ... companies_company_id_key").
-- ============================================
CREATE OR REPLACE FUNCTION next_company_id() RETURNS TEXT
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 'AZC' || (GREATEST(800, COALESCE(MAX(NULLIF(REGEXP_REPLACE(company_id, '\D', '', 'g'), '')::INT) FILTER (WHERE company_id ~* '^AZC\s*\d+$'), 800)) + 1)::TEXT
  FROM companies;
$$;

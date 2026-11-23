-- ============================================
-- MIGRATION: Customer Information & Document Checklist (from the client's paper form)
--   02 Shareholders / partners (up to 5)      -> companies.shareholders (list)
--   03 Main administrator information         -> admin_* columns (separate from the older CEO / GM fields)
--   04 Internal document verification + files -> companies.doc_checks, companies.company_documents
-- Passports and ID copies are private: files go to the private bucket "company-docs" and are opened with a short-lived link.
-- ============================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS shareholders JSONB DEFAULT '[]'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS admin_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS admin_iqama_no TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS admin_iqama_expiry DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS admin_mobile TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS admin_email TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS admin_access_setup TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS doc_checks JSONB DEFAULT '{}'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_documents JSONB DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company-docs', 'company-docs', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS company_docs_insert ON storage.objects;
CREATE POLICY company_docs_insert ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-docs' AND (user_has_module('companies') OR user_has_module('renewals')));
DROP POLICY IF EXISTS company_docs_select ON storage.objects;
CREATE POLICY company_docs_select ON storage.objects FOR SELECT
  USING (bucket_id = 'company-docs' AND (user_has_module('companies') OR user_has_module('renewals')));
-- removing a wrongly uploaded file
DROP POLICY IF EXISTS company_docs_delete ON storage.objects;
CREATE POLICY company_docs_delete ON storage.objects FOR DELETE
  USING (bucket_id = 'company-docs' AND (user_has_module('companies') OR user_has_module('renewals')));

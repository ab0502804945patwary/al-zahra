-- Electronic dossier: files uploaded straight into Cloudflare R2 (replaces the Google Drive link).
-- Each record keeps a list: [{ key, name, size, type, added_at }]
ALTER TABLE stage1_mother_company ADD COLUMN IF NOT EXISTS dossier_files JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE stage2_activity_list ADD COLUMN IF NOT EXISTS dossier_files JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE stage3_foreign_company ADD COLUMN IF NOT EXISTS dossier_files JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE stage4_misa_license ADD COLUMN IF NOT EXISTS dossier_files JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE stage5_commercial_registration ADD COLUMN IF NOT EXISTS dossier_files JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE stage6_other_websites ADD COLUMN IF NOT EXISTS dossier_files JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE stage7_file_ready ADD COLUMN IF NOT EXISTS dossier_files JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE stage9_bd_company ADD COLUMN IF NOT EXISTS dossier_files JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE stage10_foreign_mother ADD COLUMN IF NOT EXISTS dossier_files JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE stage11_foreign_subsidiary_2 ADD COLUMN IF NOT EXISTS dossier_files JSONB NOT NULL DEFAULT '[]'::jsonb;

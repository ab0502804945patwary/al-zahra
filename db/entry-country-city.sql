-- Country and City on the workflow records (replace Priority Tier). Entered once in Parent Entity Verification (stage 1);
-- Activity, MISA, CR, Portals and Final Dossier show the same values.
ALTER TABLE stage1_mother_company ADD COLUMN IF NOT EXISTS country TEXT, ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE stage2_activity_list ADD COLUMN IF NOT EXISTS country TEXT, ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE stage4_misa_license ADD COLUMN IF NOT EXISTS country TEXT, ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE stage5_commercial_registration ADD COLUMN IF NOT EXISTS country TEXT, ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE stage6_other_websites ADD COLUMN IF NOT EXISTS country TEXT, ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE stage7_file_ready ADD COLUMN IF NOT EXISTS country TEXT, ADD COLUMN IF NOT EXISTS city TEXT;

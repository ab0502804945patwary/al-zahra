-- Deleting a company must also delete its Bangladesh Company (stage 9) records (they were left behind with company_id NULL).
DO $$
DECLARE cn text;
BEGIN
  SELECT conname INTO cn FROM pg_constraint WHERE conrelid = 'public.stage9_bd_company'::regclass AND confrelid = 'public.companies'::regclass AND contype = 'f';
  IF cn IS NOT NULL THEN EXECUTE format('ALTER TABLE public.stage9_bd_company DROP CONSTRAINT %I', cn); END IF;
  ALTER TABLE public.stage9_bd_company ADD CONSTRAINT stage9_bd_company_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id) ON DELETE CASCADE;
END $$;
-- clean up Bangladesh records already orphaned by earlier deletes
DELETE FROM public.stage9_bd_company WHERE company_id IS NULL;

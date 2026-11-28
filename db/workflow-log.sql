-- ============================================
-- MIGRATION: Workflow log - who did what on every workflow record, from now on.
-- Written only by the database (triggers); only an admin can read it; nobody can change it.
-- A problem while logging never stops the record from being saved. Safe to run more than once.
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_log (
  id BIGSERIAL PRIMARY KEY,
  stage TEXT NOT NULL,
  company_id TEXT NOT NULL,
  action TEXT NOT NULL,      -- started / completed / reopened / status / files / updated / deleted
  detail TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workflow_log_company_idx ON workflow_log (company_id, created_at DESC);

ALTER TABLE workflow_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workflow_log_admin_read ON workflow_log;
CREATE POLICY workflow_log_admin_read ON workflow_log FOR SELECT USING (get_user_role() = 'admin');

-- one line per person per company and phase, for the photos on the dashboard
CREATE OR REPLACE VIEW workflow_actors WITH (security_invoker = true) AS
  SELECT company_id, stage, user_id, max(created_at) AS last_at FROM workflow_log WHERE user_id IS NOT NULL GROUP BY company_id, stage, user_id;

CREATE OR REPLACE FUNCTION log_workflow_change() RETURNS trigger AS $$
DECLARE
  n JSONB; o JSONB; act TEXT; info TEXT;
  done_new TEXT; done_old TEXT; files_new INT; files_old INT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;   -- scripts and migrations are not people
  n := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  o := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  IF COALESCE(n->>'company_id', o->>'company_id') IS NULL THEN RETURN NULL; END IF;
  done_new := COALESCE(n->>'complete_date', n->>'approval_date');
  done_old := COALESCE(o->>'complete_date', o->>'approval_date');
  files_new := CASE WHEN jsonb_typeof(n->'dossier_files') = 'array' THEN jsonb_array_length(n->'dossier_files') ELSE 0 END;
  files_old := CASE WHEN jsonb_typeof(o->'dossier_files') = 'array' THEN jsonb_array_length(o->'dossier_files') ELSE 0 END;

  IF TG_OP = 'DELETE' THEN act := 'deleted';
  ELSIF TG_OP = 'INSERT' THEN act := CASE WHEN done_new IS NOT NULL THEN 'completed' ELSE 'started' END;
  ELSIF done_new IS NOT NULL AND done_old IS NULL THEN act := 'completed';
  ELSIF done_new IS NULL AND done_old IS NOT NULL THEN act := 'reopened';
  ELSIF n->>'current_stage' IS DISTINCT FROM o->>'current_stage' THEN act := 'status'; info := n->>'current_stage';
  ELSIF files_new <> files_old THEN act := 'files'; info := files_old || ' → ' || files_new;
  -- numbers the app recalculates by itself are not a change made by a person
  ELSIF (n - ARRAY['days_taken','status','completion_percent','overdue_status','remaining_days','updated_at'])
      = (o - ARRAY['days_taken','status','completion_percent','overdue_status','remaining_days','updated_at']) THEN RETURN NULL;
  ELSE act := 'updated';
  END IF;

  INSERT INTO workflow_log (stage, company_id, action, detail, user_id)
  VALUES (TG_ARGV[0], COALESCE(n->>'company_id', o->>'company_id'), act, info, auth.uid());
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'workflow log failed: %', SQLERRM;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
DECLARE t TEXT[];
BEGIN
  FOREACH t SLICE 1 IN ARRAY ARRAY[
    ['1','stage1_mother_company'], ['2','stage2_activity_list'], ['3','stage3_foreign_company'], ['4','stage4_misa_license'],
    ['5','stage5_commercial_registration'], ['6','stage6_other_websites'], ['7','stage7_file_ready'], ['8','stage8_name_clearance'],
    ['9','stage9_bd_company'], ['10','stage10_foreign_mother'], ['11','stage11_foreign_subsidiary_2']]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS workflow_log_trg ON %I', t[2]);
    EXECUTE format('CREATE TRIGGER workflow_log_trg AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION log_workflow_change(%L)', t[2], t[1]);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

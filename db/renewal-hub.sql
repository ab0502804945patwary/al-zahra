-- ============================================
-- MIGRATION: Renewal & Audit Hub (Renewal Companies page)
--   renewal_service_state : workflow status and audit stage per company and service
--   renewal_logs          : permanent history of reminders and completed (+1 Yr) renewals
--   complete_renewal()    : moves one expiry date forward by a year and writes the history, in one step
-- Staff reach only the companies they registered (all of them with perm_renewal_edit); +1 Yr also needs the companies edit rule.
-- Safe to run more than once.
-- ============================================
CREATE OR REPLACE FUNCTION renewal_can_see(p_company UUID) RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'admin' OR (
    user_has_module('renewals') AND EXISTS (
      SELECT 1 FROM companies c WHERE c.id = p_company AND c.service_type = 'renewal'
        AND (c.created_by = auth.uid() OR user_has_module('perm_renewal_edit'))
    )
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE TABLE IF NOT EXISTS renewal_service_state (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('misa', 'cr', 'bd', 'sa')),
  workflow TEXT NOT NULL DEFAULT 'Pending / Due',
  stage TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, service)
);

CREATE TABLE IF NOT EXISTS renewal_logs (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('notified', 'completed')),
  service TEXT,          -- completed: misa / cr / bd / sa
  services TEXT,         -- notified: the services named in the reminder
  channel TEXT,
  language TEXT,
  prev_due DATE,
  new_due DATE,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS renewal_logs_company_idx ON renewal_logs (company_id);
CREATE INDEX IF NOT EXISTS renewal_logs_created_idx ON renewal_logs (created_at DESC);

ALTER TABLE renewal_service_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE renewal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS renewal_state_access ON renewal_service_state;
CREATE POLICY renewal_state_access ON renewal_service_state FOR ALL
  USING (renewal_can_see(company_id)) WITH CHECK (renewal_can_see(company_id));

-- history can be read and added, never changed or removed
DROP POLICY IF EXISTS renewal_logs_select ON renewal_logs;
CREATE POLICY renewal_logs_select ON renewal_logs FOR SELECT USING (renewal_can_see(company_id));
DROP POLICY IF EXISTS renewal_logs_insert ON renewal_logs;
CREATE POLICY renewal_logs_insert ON renewal_logs FOR INSERT
  WITH CHECK (kind = 'notified' AND renewal_can_see(company_id) AND created_by = auth.uid());

-- Runs with the owner's rights so it can write the "completed" history, therefore it checks the caller itself:
-- admin, or staff with the Renewal Companies edit permission (renewal companies only)
CREATE OR REPLACE FUNCTION complete_renewal(p_company UUID, p_service TEXT, p_field TEXT, p_prev DATE) RETURNS DATE AS $$
DECLARE
  v_new DATE := (p_prev + INTERVAL '1 year')::DATE;
  v_rows INT;
BEGIN
  IF NOT COALESCE(
       get_user_role() = 'admin'
       OR (user_has_module('renewals') AND user_has_module('perm_renewal_edit')
           AND EXISTS (SELECT 1 FROM companies c WHERE c.id = p_company AND c.service_type = 'renewal'))
     , false) THEN
    RAISE EXCEPTION 'You do not have permission to complete this renewal';
  END IF;
  IF NOT COALESCE((p_service = 'misa' AND p_field = 'misa_expire_date')
       OR (p_service = 'cr' AND p_field = 'cr_expire_date')
       OR (p_service = 'bd' AND p_field IN ('bd_next_audit_due', 'rjsc_annual_return_due'))
       OR (p_service = 'sa' AND p_field = 'sa_next_audit_due'), false) THEN
    RAISE EXCEPTION 'Unknown renewal service';
  END IF;
  -- the old date must still match, so a double click or a second user cannot add two years
  EXECUTE format('UPDATE companies SET %I = $1 WHERE id = $2 AND %I = $3', p_field, p_field) USING v_new, p_company, p_prev;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'Date was not changed. It may already be updated';
  END IF;
  INSERT INTO renewal_logs (company_id, kind, service, prev_due, new_due) VALUES (p_company, 'completed', p_service, p_prev, v_new);
  INSERT INTO renewal_service_state (company_id, service, workflow) VALUES (p_company, p_service, 'Completed (+1 Yr)')
    ON CONFLICT (company_id, service) DO UPDATE SET workflow = 'Completed (+1 Yr)', stage = NULL, updated_at = now();
  RETURN v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION complete_renewal(UUID, TEXT, TEXT, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION complete_renewal(UUID, TEXT, TEXT, DATE) TO authenticated;

NOTIFY pgrst, 'reload schema';

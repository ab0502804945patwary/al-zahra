-- ============================================
-- MIGRATION: every agent belongs to the person who created it.
-- Staff see and edit only their own agents. An admin sees every agent (and who created it).
-- Older agents have no owner: admins only. The next agent ID comes from the database so two
-- people adding agents at the same time never get the same code.
-- ============================================
ALTER TABLE agents ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS agents_created_by_idx ON agents (created_by);

DROP POLICY IF EXISTS agents_admin_select ON agents;
DROP POLICY IF EXISTS agents_admin_insert ON agents;
DROP POLICY IF EXISTS agents_admin_update ON agents;
CREATE POLICY agents_admin_select ON agents FOR SELECT
  USING (get_user_role() = 'admin' OR (user_has_module('agents') AND created_by = auth.uid()));
CREATE POLICY agents_admin_insert ON agents FOR INSERT
  WITH CHECK (get_user_role() = 'admin' OR (user_has_module('agents') AND created_by = auth.uid()));
CREATE POLICY agents_admin_update ON agents FOR UPDATE
  USING (get_user_role() = 'admin' OR (user_has_module('agents') AND created_by = auth.uid()))
  WITH CHECK (get_user_role() = 'admin' OR (user_has_module('agents') AND created_by = auth.uid()));

CREATE OR REPLACE FUNCTION next_agent_code() RETURNS TEXT
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 'AGT' || LPAD((COALESCE(MAX(NULLIF(REGEXP_REPLACE(agent_code, '\D', '', 'g'), '')::INT) FILTER (WHERE agent_code ~* '^AGT\s*\d+$'), 0) + 1)::TEXT, 4, '0')
  FROM agents;
$$;

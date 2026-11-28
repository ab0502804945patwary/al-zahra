import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccessStage } from '@/lib/access'
import { phaseStaffAllows } from '@/lib/stageRules'

export interface Person { name: string; avatar: string | null }
/** worked: seen in the log; assigned: given to this company; access: may work in the phase */
export interface CellPeople { ids: string[]; kind: 'worked' | 'assigned' | 'access' }
export interface WorkflowPeople { people: Record<string, Person>; cells: Record<string, Record<number, CellPeople>>; phaseStaff: Record<number, string[]> }

/** Admin only: who is behind every company and phase that has work. */
export async function loadWorkflowPeople(companies: any[], stageMap: Record<string, Record<number, unknown>>): Promise<WorkflowPeople> {
  const db = await createClient()
  const service = await createServiceClient()

  // the log is read in pages: one request returns at most 1000 rows
  const worked: { company_id: string; stage: string; user_id: string }[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('workflow_actors').select('company_id, stage, user_id').order('last_at', { ascending: false }).range(from, from + 999)
    if (error || !data?.length) break
    worked.push(...(data as typeof worked))
    if (data.length < 1000) break
  }
  const [{ data: staff }, { data: asg }] = await Promise.all([
    service.from('employees').select('user_id, name, avatar_url, role, assigned_stage, assigned_stages, is_active'),
    service.from('stage_assignments').select('company_id, stage, user_ids'),
  ])

  const people: Record<string, Person> = {}
  for (const e of (staff as any[]) || []) if (e.user_id) people[e.user_id] = { name: e.name, avatar: e.avatar_url || null }
  const team = ((staff as any[]) || []).filter(e => e.user_id && e.role !== 'admin' && e.is_active !== false)

  const key = (c: string, s: string | number) => `${c}:${s}`
  const workedBy = new Map<string, string[]>()
  for (const w of worked) workedBy.set(key(w.company_id, w.stage), [...(workedBy.get(key(w.company_id, w.stage)) || []), w.user_id])
  const assigned = new Map<string, string[]>(((asg as any[]) || []).map(a => [key(a.company_id, a.stage), a.user_ids || []]))

  const cells: WorkflowPeople['cells'] = {}
  for (const c of companies) {
    for (const stage of Object.keys(stageMap[c.company_id] || {}).map(Number)) {
      const known = (ids: string[] | undefined) => (ids || []).filter(id => people[id])
      let cell: CellPeople = { kind: 'worked', ids: known(workedBy.get(key(c.company_id, stage))) }
      if (!cell.ids.length) cell = { kind: 'assigned', ids: known(assigned.get(key(c.company_id, stage))) }
      if (!cell.ids.length) cell = { kind: 'access', ids: team.filter(e => canAccessStage(e, stage) && phaseStaffAllows(c, String(stage), e.user_id)).map(e => e.user_id) }
      if (cell.ids.length) (cells[c.company_id] ||= {})[stage] = cell
    }
  }
  // who may work in each phase, shown under the phase name
  const phaseStaff: Record<number, string[]> = {}
  for (let stage = 1; stage <= 11; stage++) phaseStaff[stage] = team.filter(e => canAccessStage(e, stage)).map(e => e.user_id)

  return { people, cells, phaseStaff }
}

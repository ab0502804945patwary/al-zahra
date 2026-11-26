import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { STAGE_CONFIG, MENU_ORDER, phaseOf } from '@/lib/stageData'
import { stagesOf } from '@/lib/access'
import { isEligibleForStage, eligibilityColumns, phaseStaffAllows, OTHERS_SERVICE, type StageEntriesMap } from '@/lib/stageRules'

export interface AppNotification {
  key: string
  stage: number
  stageLabel: string
  company_id: string
  company_name: string
  message: string
  href: string
}

const stageIds = () => MENU_ORDER.filter(id => STAGE_CONFIG[id])

/** Loads every company and every stage's entries once (service key, read-only). */
async function loadWorkData() {
  const ids = stageIds()
  const lookup = await createServiceClient()
  const [cRes, oRes, aRes, ...sRes] = await Promise.all([
    lookup.from('companies').select('company_id, company_name, entity_type, service_type, account_status, selected_phases, skipped_phases'),
    // asked separately: this column only exists after db/others-service.sql
    lookup.from('companies').select('company_id, phase_staff').eq('entity_type', OTHERS_SERVICE),
    lookup.from('stage_assignments').select('company_id, stage, user_ids'),
    ...ids.map(sid => lookup.from(STAGE_CONFIG[sid].table).select(eligibilityColumns(sid))),
  ])
  const all: StageEntriesMap = {}
  ids.forEach((sid, k) => { all[sid] = (sRes[k].data as any[]) || [] })
  const staffOf = new Map<string, any>(((oRes.data as any[]) || []).map(o => [o.company_id, o.phase_staff]))
  const companies = ((cRes.data as any[]) || []).map(c => (staffOf.has(c.company_id) ? { ...c, phase_staff: staffOf.get(c.company_id) } : c))
  const assigned = new Map<string, string[]>(((aRes.data as any[]) || []).map(a => [`${a.stage}:${a.company_id}`, a.user_ids || []]))
  return { companies, all, assigned }
}

/**
 * A company is "waiting" for a stage when it is eligible for that stage but has no entry there yet.
 * `myStages` null = admin (every stage, every company).
 */
function buildFor({ companies, all, assigned }: Awaited<ReturnType<typeof loadWorkData>>, myStages: number[] | null, userId: string): AppNotification[] {
  const out: AppNotification[] = []
  for (const sid of stageIds()) {
    const n = Number(sid)
    if (myStages !== null && !myStages.includes(n)) continue
    for (const c of companies) {
      // Renewal-only companies are not part of the stage-to-stage relay
      if (c.service_type === 'renewal') continue
      if (c.account_status === 'Inactive') continue // paused client
      const started = (all[sid] || []).some(e => e.company_id === c.company_id)
      if (started) continue
      if (!isEligibleForStage(sid, c, all)) continue
      if (myStages !== null && !phaseStaffAllows(c, sid, userId)) continue
      // somebody is assigned: only they are notified (admins still see everything)
      const who = assigned.get(`${sid}:${c.company_id}`)
      if (myStages !== null && who?.length && !who.includes(userId)) continue
      out.push({
        key: `${sid}:${c.company_id}`,
        stage: n,
        stageLabel: STAGE_CONFIG[sid].label,
        company_id: c.company_id,
        company_name: c.company_name,
        message: `${c.company_id} ${c.company_name} is ready for Phase ${phaseOf(n)}`,
        href: `/dashboard/stage/${sid}`,
      })
    }
  }
  return out
}

/** Is this company in the "Waiting for you" list of a phase (ready for it, no record yet)? */
export async function isWaitingInStage(stageId: string, companyId: string) {
  const { companies, all } = await loadWorkData()
  const c = companies.find(x => x.company_id === companyId)
  return !!c && c.service_type !== 'renewal' && isEligibleForStage(stageId, c, all)
}

/** Work waiting for the signed-in user. Staff see only their own stages; admin sees every stage. */
export async function getNotifications(): Promise<AppNotification[]> {
  if (!isSupabaseConfigured) return []
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const [empRes, work] = await Promise.all([
    supabase.from('employees').select('role, assigned_stage, assigned_stages').eq('user_id', user.id).single(),
    loadWorkData(),
  ])
  return buildFor(work, stagesOf(empRes.data), user.id)
}

/** Work waiting for every active staff member (used to send push notifications). */
export async function getAllStaffNotifications(): Promise<{ userId: string; items: AppNotification[] }[]> {
  if (!isSupabaseConfigured) return []
  const lookup = await createServiceClient()
  const [{ data: staff }, work] = await Promise.all([
    lookup.from('employees').select('user_id, role, assigned_stage, assigned_stages, is_active'),
    loadWorkData(),
  ])
  return (staff || [])
    .filter((e: any) => e.user_id && e.is_active !== false)
    .map((e: any) => ({ userId: e.user_id as string, items: buildFor(work, stagesOf(e), e.user_id) }))
}

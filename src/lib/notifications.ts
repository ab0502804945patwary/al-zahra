import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { STAGE_CONFIG, MENU_ORDER, phaseOf } from '@/lib/stageData'
import { stagesOf } from '@/lib/access'
import { isEligibleForStage, eligibilityColumns, type StageEntriesMap } from '@/lib/stageRules'

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
  const [cRes, ...sRes] = await Promise.all([
    lookup.from('companies').select('company_id, company_name, entity_type, service_type, account_status, selected_phases, skipped_phases'),
    ...ids.map(sid => lookup.from(STAGE_CONFIG[sid].table).select(eligibilityColumns(sid))),
  ])
  const all: StageEntriesMap = {}
  ids.forEach((sid, k) => { all[sid] = (sRes[k].data as any[]) || [] })
  return { companies: (cRes.data as any[]) || [], all }
}

/**
 * A company is "waiting" for a stage when it is eligible for that stage but has no entry there yet.
 * `myStages` null = admin (every stage).
 */
function buildFor(companies: any[], all: StageEntriesMap, myStages: number[] | null): AppNotification[] {
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
  return buildFor(work.companies, work.all, stagesOf(empRes.data))
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
    .map((e: any) => ({ userId: e.user_id as string, items: buildFor(work.companies, work.all, stagesOf(e)) }))
}

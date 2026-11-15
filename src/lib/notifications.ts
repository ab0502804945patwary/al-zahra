import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { STAGE_CONFIG, FALLBACK_STAGE_ENTRIES } from '@/lib/stageData'
import { INITIAL_EMPLOYEES } from '@/lib/employeeData'
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

const FALLBACK_COMPANIES = [
  { company_id: 'AZC801', company_name: 'Steel Com', entity_type: 'Trading License' },
  { company_id: 'AZC802', company_name: 'al tamayyuz sharikat taj Trading', entity_type: 'Trading License' },
]

/**
 * A company is "waiting" for a stage when it is eligible for that stage but has no entry there yet.
 * Staff see only their own stage; admin sees every stage.
 */
export async function getNotifications(): Promise<AppNotification[]> {
  const cookieStore = await cookies()
  const demo = cookieStore.get('demo_session')?.value

  let myStages: number[] | null = null // null = admin (all stages)
  let companies: any[] = FALLBACK_COMPANIES
  const all: StageEntriesMap = {}
  const ids = Object.keys(STAGE_CONFIG)

  if (demo) {
    if (demo !== 'admin') {
      const emp = INITIAL_EMPLOYEES.find(e => e.id === demo || e.email === demo) || INITIAL_EMPLOYEES[0]
      myStages = stagesOf(emp)
    }
    for (const sid of ids) all[sid] = FALLBACK_STAGE_ENTRIES[sid] || []
  } else if (isSupabaseConfigured) {
    const supabase = await createClient()
    const lookup = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const [empRes, cRes, ...sRes] = await Promise.all([
      supabase.from('employees').select('role, assigned_stage, assigned_stages').eq('user_id', user.id).single(),
      supabase.from('companies').select('company_id, company_name, entity_type, service_type'),
      ...ids.map(sid => lookup.from(STAGE_CONFIG[sid].table).select(eligibilityColumns(sid))),
    ])
    myStages = stagesOf(empRes.data)
    if (cRes.data?.length) companies = cRes.data
    ids.forEach((sid, k) => { all[sid] = (sRes[k].data as any[]) || [] })
  } else {
    return []
  }

  const out: AppNotification[] = []
  for (const sid of ids) {
    const n = Number(sid)
    if (n === 8) continue
    if (myStages !== null && !myStages.includes(n)) continue
    for (const c of companies) {
      // Renewal-only companies are not part of the stage-to-stage relay
      if (c.service_type === 'renewal') continue
      const started = (all[sid] || []).some(e => e.company_id === c.company_id)
      if (started) continue
      if (!isEligibleForStage(sid, c, all)) continue
      out.push({
        key: `${sid}:${c.company_id}`,
        stage: n,
        stageLabel: STAGE_CONFIG[sid].label,
        company_id: c.company_id,
        company_name: c.company_name,
        message: `${c.company_id} ${c.company_name} is ready for Stage ${n}`,
        href: `/dashboard/stage/${sid}`,
      })
    }
  }
  return out
}

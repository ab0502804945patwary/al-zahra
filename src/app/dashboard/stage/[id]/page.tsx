import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import StageTable from '@/components/stage/StageTable'
import StageHeader from '@/components/stage/StageHeader'
import StatusGuide from '@/components/ui/StatusGuide'
import { enrichTiming } from '@/lib/utils'
import { STAGE_CONFIG } from '@/lib/stageData'
import { getSessionInfo } from '@/lib/session'
import { canAccessStage } from '@/lib/access'
import { isEligibleForStage, eligibilityColumns, ELIGIBILITY_HINT, type StageEntriesMap } from '@/lib/stageRules'

export const dynamic = 'force-dynamic'

export default async function StagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const config = STAGE_CONFIG[id]
  if (!config) notFound()
  if (!isSupabaseConfigured) redirect('/login')

  let entries: any[] = []
  let companies: any[] = []
  let employees: any[] = []

  const { supabase, user, employee: me } = await getSessionInfo()
  if (!user) redirect('/login')
  const lookup = await createServiceClient()

  // Staff may only open the stages they are assigned to (admins: all stages)
  if (!canAccessStage(me, Number(id))) redirect('/dashboard')
  const canEdit = true

  const gated = ['2', '3', '4', '5', '6', '7'].includes(id)
  const upstream = gated ? ['1', '2', '3', '4', '5', '6'].filter(sid => Number(sid) < Number(id)) : []
  const dbEntries: Record<string, any[]> = {}

  try {
    const entriesQuery = supabase
      .from(config.table)
      .select(config.isNameClearance
        ? '*, companies(company_name, country_of_origin)'
        : '*, companies(company_name, country_of_origin), employees(name)')
      .order('created_at', { ascending: false })

    const [eRes, cRes, empRes, ...upRes] = await Promise.all([
      entriesQuery,
      supabase.from('companies').select('company_id, company_name, country_of_origin, entity_type, service_type, client_name, client_phone').order('company_id'),
      supabase.from('employees').select('id, name, assigned_stage, assigned_stages'),
      ...upstream.map(sid => lookup.from(STAGE_CONFIG[sid].table).select(eligibilityColumns(sid, ['priority', 'category']))),
    ])
    entries = (eRes.data || []).map((e: any) => (config.isNameClearance ? e : enrichTiming(e)))
    companies = cRes.data || []
    employees = empRes.data || []
    upstream.forEach((sid, k) => { dbEntries[sid] = (upRes[k]?.data as any[]) || [] })
  } catch (e) {
    console.error('Error fetching stage data:', e)
  }

  // Eligibility: which companies may enter this stage (stages 2-7)
  const allEntries: StageEntriesMap = {}
  for (const sid of upstream) allEntries[sid] = dbEntries[sid] || []
  // Details entered in Stage 1 (priority, category) carry over to the later stages
  if (id !== '1') {
    const s1 = (dbEntries['1'] || []) as any[]
    companies = companies.map(c => {
      const e = s1.find(x => x.company_id === c.company_id)
      return e ? { ...c, stage1_priority: e.priority, stage1_category: e.category } : c
    })
  }
  const eligibleCompanies = gated
    ? companies.filter(c => isEligibleForStage(id, c, allEntries))
    : companies
  const eligibilityHint = gated ? ELIGIBILITY_HINT[id] : undefined

  const stats = {
    total: entries.length,
    green: entries.filter(e => (e.status || e.usa_status) === 'Green').length,
    yellow: entries.filter(e => (e.status || e.usa_status) === 'Yellow').length,
    red: entries.filter(e => (e.status || e.usa_status) === 'Red').length,
    completed: entries.filter(e => e.overdue_status === 'Completed').length,
    pending: entries.filter(e => e.overdue_status === 'Pending').length,
  }

  return (
    <div className="space-y-6 w-full max-w-[2000px] mx-auto">
      <StageHeader
        stageId={id}
        config={config}
        stats={stats}
        companies={companies}
        employees={employees}
        eligibleIds={eligibleCompanies.filter(c => !entries.some(e => e.company_id === c.company_id)).map(c => c.company_id)}
        eligibilityHint={eligibilityHint}
        canEdit={canEdit}
      />
      <StageTable
        stageId={id}
        entries={entries}
        companies={companies}
        employees={employees}
        isUSACanada={config.hasUSACanada}
        isNameClearance={config.isNameClearance}
        canEdit={canEdit}
      />
      {!config.isNameClearance && <StatusGuide />}
    </div>
  )
}

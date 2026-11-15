import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import StageTable from '@/components/stage/StageTable'
import StageHeader from '@/components/stage/StageHeader'
import { STAGE_CONFIG, FALLBACK_STAGE_ENTRIES } from '@/lib/stageData'
import { canAccessStage } from '@/lib/access'
import { INITIAL_EMPLOYEES } from '@/lib/employeeData'
import { isEligibleForStage, eligibilityColumns, ELIGIBILITY_HINT, type StageEntriesMap } from '@/lib/stageRules'

export const dynamic = 'force-dynamic'

const FALLBACK_COMPANIES = [
  { company_id: 'AZC801', company_name: 'Steel Com', country_of_origin: 'Afghanistan', entity_type: 'Trading License' },
  { company_id: 'AZC802', company_name: 'al tamayyuz sharikat taj Trading', country_of_origin: 'Bangladesh', entity_type: 'Trading License' }
]

const FALLBACK_EMPLOYEES = [
  { id: 'e1', name: 'Shahariar Hossain Rakib', assigned_stage: 1 },
  { id: 'e2', name: 'Abdul Kaium', assigned_stage: 2 },
  { id: 'e3', name: 'Arju Hossain', assigned_stage: 3 },
  { id: 'e4', name: 'Md Miraj', assigned_stage: 4 },
  { id: 'e5', name: 'Md Ishak', assigned_stage: 5 },
  { id: 'e6', name: 'Md Azad', assigned_stage: 6 }
]

export default async function StagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const config = STAGE_CONFIG[id]
  if (!config) notFound()

  const cookieStore = await cookies()
  const isDemo = Boolean(cookieStore.get('demo_session')?.value)

  let entries: any[] = []
  let companies: any[] = []
  let employees: any[] = []

  // Staff may only open the stages they are assigned to (admins: all stages)
  const demoId = cookieStore.get('demo_session')?.value
  let me: any = { role: 'admin' }
  if (demoId && demoId !== 'admin') {
    me = INITIAL_EMPLOYEES.find(e => e.id === demoId || e.email === demoId) || INITIAL_EMPLOYEES[0]
  } else if (!demoId && isSupabaseConfigured) {
    try {
      const sb = await createClient()
      const { data: { user } } = await sb.auth.getUser()
      const { data } = await sb.from('employees').select('role, assigned_stage, assigned_stages').eq('user_id', user?.id ?? '').single()
      me = data || null
    } catch { me = null }
  }
  if (!canAccessStage(me, Number(id))) redirect('/dashboard')
  const canEdit = true

  const gated = ['2', '3', '4', '5', '6', '7'].includes(id)
  const upstream = gated ? ['1', '2', '3', '4', '5', '6'].filter(sid => Number(sid) < Number(id)) : []
  const dbEntries: Record<string, any[]> = {}

  if (!isDemo && isSupabaseConfigured) {
    const supabase = await createClient()
    const lookup = await createServiceClient()
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
        supabase.from('employees').select('id, name, assigned_stage'),
        ...upstream.map(sid => lookup.from(STAGE_CONFIG[sid].table).select(eligibilityColumns(sid, ['priority', 'category']))),
      ])
      if (eRes.data && eRes.data.length > 0) entries = eRes.data
      if (cRes.data && cRes.data.length > 0) companies = cRes.data
      if (empRes.data && empRes.data.length > 0) employees = empRes.data
      upstream.forEach((sid, k) => { if (upRes[k]?.data?.length) dbEntries[sid] = upRes[k].data as any[] })
    } catch (e) {
      console.error('Error fetching stage data:', e)
    }
  }

  // Use fallback if empty
  if (entries.length === 0 && FALLBACK_STAGE_ENTRIES[id]) {
    entries = FALLBACK_STAGE_ENTRIES[id]
  }
  if (companies.length === 0) companies = FALLBACK_COMPANIES
  if (employees.length === 0) employees = FALLBACK_EMPLOYEES

  // Eligibility: which companies may enter this stage (stages 4-7 only)
  const allEntries: StageEntriesMap = {}
  for (const sid of upstream) {
    allEntries[sid] = dbEntries[sid] || FALLBACK_STAGE_ENTRIES[sid] || []
  }
  // Details entered in Stage 1 (priority, category) carry over to the later stages
  if (id !== '1') {
    const s1 = (dbEntries['1'] || FALLBACK_STAGE_ENTRIES['1'] || []) as any[]
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
    </div>
  )
}

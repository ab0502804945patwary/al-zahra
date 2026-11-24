import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import StageTable from '@/components/stage/StageTable'
import StageHeader from '@/components/stage/StageHeader'
import StatusGuide from '@/components/ui/StatusGuide'
import { enrichTiming, enrichExpiry } from '@/lib/utils'
import { STAGE_CONFIG } from '@/lib/stageData'
import { getSessionInfo } from '@/lib/session'
import { canAccessStage, canDo } from '@/lib/access'
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
  // editing an existing entry needs the per-phase permission (admin always)
  const canEditRows = canDo(me, `edit_stage_${id}`)
  const isAdmin = me?.role === 'admin'

  const gated = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'].includes(id)
  const upstream = !gated || id === '9' || id === '8' ? [] : id === '10' || id === '3' || id === '11' ? ['9'] : id === '1' ? ['9', '10', '3', '11'] : id === '4' ? ['1', '2', '3', '8', '9', '10', '11'] : ['1', '2', '3', '4', '5', '6'].filter(sid => Number(sid) < Number(id))
  const dbEntries: Record<string, any[]> = {}

  try {
    const entriesQuery = supabase
      .from(config.table)
      .select(config.isNameClearance
        ? '*, companies(company_name, original_company_name, country_of_origin)'
        : '*, companies(company_name, original_company_name, country_of_origin)')
      .order('created_at', { ascending: false })

    const [eRes, cRes, empRes, crRes, ...upRes] = await Promise.all([
      entriesQuery,
      supabase.from('companies').select('id, company_id, company_name, country_of_origin, entity_type, service_type, client_name, client_phone, cr_number, cr_issue_date, cr_expire_date, misa_license_no, misa_issue_date, misa_expire_date, tin_number, vat_number, chamber_registration_no, gosi_qiwa_status, account_status, selected_phases, skipped_phases').order('company_id'),
      // colleague names are read on the server: staff may only read their own staff row
      lookup.from('employees').select('id, name, assigned_stage, assigned_stages'),
      // CR Association (stage 5): when it is Complete the Company Name Clearance countdown stops on that day
      config.isNameClearance ? lookup.from('stage5_commercial_registration').select('company_id, cr_status, cr_status_date, complete_date') : Promise.resolve({ data: [] as any[] }),
      ...upstream.map(sid => lookup.from(STAGE_CONFIG[sid].table).select(eligibilityColumns(sid, ['priority', 'category']))),
    ])
    companies = cRes.data || []
    employees = empRes.data || []
    const nameOf = new Map<string, string>(employees.map((x: any) => [x.id, x.name]))
    const stoppedOn = new Map<string, string>()
    for (const r of (crRes.data as any[]) || []) if (r.cr_status === 'Complete') stoppedOn.set(r.company_id, r.cr_status_date || r.complete_date)
    entries = (eRes.data || []).map((e: any) => {
      const withName = { ...e, employees: e.employee_id && nameOf.get(e.employee_id) ? { name: nameOf.get(e.employee_id) } : null }
      return config.isNameClearance ? enrichExpiry(withName, stoppedOn.get(e.company_id) || null) : enrichTiming(withName)
    })
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
      return e ? { ...c, stage1_priority: e.priority, stage1_category: e.category, stage1_country: e.country, stage1_city: e.city } : c
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
        eligibleIds={eligibleCompanies.filter(c => c.account_status !== 'Inactive' && !entries.some(e => e.company_id === c.company_id)).map(c => c.company_id)}
        eligibilityHint={eligibilityHint}
        canEdit={canEdit}
        isAdmin={isAdmin}
      />
      <StageTable
        stageId={id}
        entries={entries}
        companies={companies}
        employees={employees}
        isUSACanada={config.hasUSACanada}
        isNameClearance={config.isNameClearance}
        canEdit={canEditRows}
        isAdmin={isAdmin}
      />
      {!config.isNameClearance && <StatusGuide />}
    </div>
  )
}

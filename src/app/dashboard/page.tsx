import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import MasterMatrixDashboard from '@/components/dashboard/MasterMatrixDashboard'
import { Company } from '@/lib/types'
import ExpiryAlerts from '@/components/dashboard/ExpiryAlerts'
import StageSummaryTable from '@/components/dashboard/StageSummaryTable'
import { STAGE_CONFIG, FALLBACK_STAGE_ENTRIES } from '@/lib/stageData'

export const dynamic = 'force-dynamic'

const FALLBACK_COMPANIES: Company[] = [
  {
    id: '1',
    company_id: 'AZC801',
    country_of_origin: 'Afghanistan',
    company_name: 'Steel Com',
    entity_type: 'Trading License',
    cr_number: 'CR-801-4432',
    misa_license_no: 'MISA-2026-801',
    account_status: 'Active',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    company_id: 'AZC802',
    country_of_origin: 'Bangladesh',
    company_name: 'al tamayyuz sharikat taj Trading',
    entity_type: 'Trading License',
    ceo_gm_name: 'Belayet Hossain',
    account_status: 'Active',
    created_at: '2026-01-01T00:00:00.000Z',
  },
]

export default async function DashboardPage() {
  let companies: Company[] = FALLBACK_COMPANIES
  const kpiStats = { totalCompanies: 2, compliant: 0, overdue: 0, expiring: 0 }
  let stageRows: Record<string, any[]> = { ...FALLBACK_STAGE_ENTRIES }

  const cookieStore = await cookies()
  const isDemo = Boolean(cookieStore.get('demo_session')?.value)

  if (!isDemo && isSupabaseConfigured) {
    const supabase = await createClient()
    try {
      const ids = Object.keys(STAGE_CONFIG)
      const [cRes, ...sRes] = await Promise.all([
        supabase.from('companies').select('*').order('company_id'),
        ...ids.map(sid => supabase.from(STAGE_CONFIG[sid].table).select('status, usa_status, canada_status, remaining_days, completion_percent, usa_completion_percent')),
      ])
      if (cRes.data && cRes.data.length > 0) {
        companies = cRes.data
        kpiStats.totalCompanies = cRes.data.length
      }
      stageRows = {}
      ids.forEach((sid, k) => { stageRows[sid] = (sRes[k].data as any[]) || [] })
    } catch {}
  }

  for (const rows of Object.values(stageRows)) {
    for (const r of rows) {
      const st = [r.status, r.usa_status, r.canada_status]
      kpiStats.compliant += st.filter(x => x === 'Green' || x === 'Active').length
      kpiStats.overdue += st.filter(x => x === 'Red' || x === 'Expired').length
      if (r.remaining_days != null && r.remaining_days >= 0 && r.remaining_days <= 40) kpiStats.expiring += 1
    }
  }

  const summary = Object.entries(STAGE_CONFIG)
    .filter(([, c]) => !c.isNameClearance)
    .map(([sid, c]) => {
      const rows = stageRows[sid] || []
      const st = (r: any) => r.status || r.usa_status
      const pct = rows.map(r => r.completion_percent ?? r.usa_completion_percent).filter((x: any) => typeof x === 'number')
      return {
        id: sid,
        label: `Stage ${Number(sid)}: ${c.label}`,
        employee: c.employee,
        total: rows.length,
        green: rows.filter(r => st(r) === 'Green').length,
        yellow: rows.filter(r => st(r) === 'Yellow').length,
        red: rows.filter(r => st(r) === 'Red').length,
        avg: pct.length ? Math.round(pct.reduce((a: number, b: number) => a + b, 0) / pct.length) : null,
      }
    })

  return (
    <div className="space-y-6">
      <MasterMatrixDashboard initialCompanies={companies} kpiStats={kpiStats} />
      <ExpiryAlerts companies={companies} />
      <StageSummaryTable rows={summary} />
    </div>
  )
}

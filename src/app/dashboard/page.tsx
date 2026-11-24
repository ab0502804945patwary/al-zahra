import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import MasterMatrixDashboard from '@/components/dashboard/MasterMatrixDashboard'
import { Company } from '@/lib/types'
import AccountsSummary from '@/components/dashboard/AccountsSummary'
import StageSummaryTable from '@/components/dashboard/StageSummaryTable'
import { STAGE_CONFIG, MENU_ORDER, phaseOf } from '@/lib/stageData'
import { enrichTiming, enrichExpiry } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Staff do not get the dashboard: send them to their own stage
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'dashboard')) redirect(homeFor(employee))

  const isAdmin = employee?.role === 'admin'
  let companies: Company[] = []
  let invoices: any[] = []
  let expenses: any[] = []
  const kpiStats = { totalCompanies: 0, compliant: 0, overdue: 0, expiring: 0 }
  const stageRows: Record<string, any[]> = {}

  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    try {
      // admin: everything; staff: only the invoices and expenses they created themselves
      let invQ = supabase.from('invoices').select('id, invoice_no, customer_id, customer_name, total, status, payments(amount, paid_on)')
      let expQ = supabase.from('expenses').select('expense_date, amount, status')
      if (!isAdmin) { invQ = invQ.eq('created_by', user?.id ?? ''); expQ = expQ.eq('created_by', user?.id ?? '') }
      const inv = await invQ
      invoices = (inv.data as any[]) || []
      const exp = await expQ
      expenses = (exp.data as any[]) || []
    } catch {}
    try {
      const ids = MENU_ORDER.filter(id => STAGE_CONFIG[id])
      const [cRes, ...sRes] = await Promise.all([
        supabase.from('companies').select('*').order('company_id'),
        ...ids.map(sid => supabase.from(STAGE_CONFIG[sid].table).select('*')),
      ])
      companies = (cRes.data as Company[]) || []
      if (!isAdmin) {
        // staff see only the companies they registered, and only the stage work of those companies
        companies = companies.filter((c: any) => c.created_by === user?.id)
        const mine = new Set(companies.map(c => c.company_id))
        ids.forEach((sid, k) => { sRes[k].data = ((sRes[k].data as any[]) || []).filter(r => mine.has(r.company_id)) })
      }
      kpiStats.totalCompanies = companies.length
      // companies whose CR Association is Complete: their Company Name Clearance countdown stays on that day
      const crIndex = ids.indexOf('5')
      const stoppedOn = new Map<string, string>()
      for (const r of ((crIndex >= 0 ? sRes[crIndex].data : []) as any[]) || []) if (r.cr_status === 'Complete') stoppedOn.set(r.company_id, r.cr_status_date || r.complete_date)
      ids.forEach((sid, k) => { stageRows[sid] = ((sRes[k].data as any[]) || []).map(r => (STAGE_CONFIG[sid].isNameClearance ? enrichExpiry(r, stoppedOn.get(r.company_id) || null) : enrichTiming(r))) })
    } catch {}
  }

  // Real per-company stage status for the matrix
  const stageMap: Record<string, Record<number, any>> = {}
  for (const [sid, rows] of Object.entries(stageRows)) {
    for (const r of rows) {
      if (!r.company_id) continue
      const n = Number(sid)
      let status: string, label: string, days: number | undefined
      if (n === 8) {
        status = r.status === 'Active' ? 'Green' : r.status === 'Warning' ? 'Yellow' : 'Red'
        label = r.status === 'Expired' ? 'Expired' : `${r.remaining_days ?? '-'}d Left`
      } else {
        const st = r.status
        status = st === 'Green' || st === 'Yellow' || st === 'Red' ? st : 'Pending'
        const done = r.complete_date
        label = done ? 'Complete' : (r.current_stage || 'In Progress')
        days = r.days_taken ?? undefined
      }
      ;(stageMap[r.company_id] ||= {})[n] = { status, label, days }
    }
  }

  for (const rows of Object.values(stageRows)) {
    for (const r of rows) {
      const st = [r.status]
      kpiStats.compliant += st.filter(x => x === 'Green' || x === 'Active').length
      kpiStats.overdue += st.filter(x => x === 'Red' || x === 'Expired').length
      if (r.remaining_days != null && r.remaining_days >= 0 && r.remaining_days <= 40 && !r.expiry_stopped) kpiStats.expiring += 1
    }
  }

  const summary = MENU_ORDER.map(sid => [sid, STAGE_CONFIG[sid]] as const)
    .map(([sid, c]) => {
      const rows = stageRows[sid] || []
      if (c.isNameClearance) {
        // Company Name Clearance has its own validity statuses: Active = green, Warning = yellow, Urgent/Expired = red
        return {
          id: sid,
          label: `Phase ${phaseOf(sid)}: ${c.label}`,
          employee: c.employee,
          total: rows.length,
          green: rows.filter(r => r.status === 'Active').length,
          yellow: rows.filter(r => r.status === 'Warning').length,
          red: rows.filter(r => r.status === 'Urgent' || r.status === 'Expired').length,
          avg: null as number | null,
        }
      }
      const st = (r: any) => r.status
      const pct = rows.map(r => r.completion_percent).filter((x: any) => typeof x === 'number')
      return {
        id: sid,
        label: `Phase ${phaseOf(sid)}: ${c.label}`,
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
      {(isAdmin || canAccessModule(employee, 'invoices') || canAccessModule(employee, 'expenses')) && <AccountsSummary invoices={invoices} expenses={expenses} />}
      <MasterMatrixDashboard initialCompanies={companies} kpiStats={kpiStats} stageMap={stageMap} />
      <StageSummaryTable rows={summary} />
    </div>
  )
}

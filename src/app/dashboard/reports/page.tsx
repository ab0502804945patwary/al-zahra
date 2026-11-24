import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import ReportsClient from '@/components/reports/ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'reports')) redirect(homeFor(employee))
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = employee?.role === 'admin'
  const uid = user?.id ?? '00000000-0000-0000-0000-000000000000'
  // admin: everything; staff: only the invoices, expenses and companies they created themselves
  const mine = (q: any): any => (isAdmin ? q : q.eq('created_by', uid))
  const [inv, exp, cus, com, agt] = await Promise.all([
    mine(supabase.from('invoices').select('id, invoice_no, customer_id, customer_name, invoice_date, total, status, payments(amount, paid_on)')),
    mine(supabase.from('expenses').select('id, expense_no, expense_date, category, payment_method, amount, status')),
    supabase.from('customers').select('id, created_at, customer_type, status'),
    mine(supabase.from('companies').select('id, company_id, company_name, service_type, created_at, cr_expire_date, misa_expire_date, rjsc_annual_return_due, bd_next_audit_due, sa_next_audit_due')),
    supabase.from('agents').select('id, category'),
  ])
  return (
    <ReportsClient
      invoices={(inv.data as any[]) || []}
      expenses={(exp.data as any[]) || []}
      customers={(cus.data as any[]) || []}
      companies={(com.data as any[]) || []}
      agents={(agt.data as any[]) || []}
    />
  )
}

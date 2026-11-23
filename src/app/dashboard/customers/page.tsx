import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import CustomersClient from '@/components/customers/CustomersClient'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'customers')) redirect(homeFor(employee))
  const supabase = await createClient()
  const [cRes, eRes, aRes, iRes] = await Promise.all([
    supabase.from('customers').select('*').order('created_at', { ascending: false }),
    supabase.from('employees').select('name').eq('is_active', true).order('name'),
    supabase.from('agents').select('agent_name, company_name').order('agent_name'),
    supabase.from('invoices').select('customer_id, total, status, payments(amount)'),
  ])
  // what each customer still owes (needs the Invoices module to read; otherwise nothing is shown)
  const dues: Record<string, number> = {}
  for (const i of (iRes.data as any[]) || []) {
    if (i.status === 'Cancelled' || !i.customer_id) continue
    const paid = (i.payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0)
    dues[i.customer_id] = (dues[i.customer_id] || 0) + Number(i.total) - paid
  }
  return <CustomersClient dues={dues} customers={(cRes.data as any[]) || []} staffNames={((eRes.data as any[]) || []).map(e => e.name)} agentNames={((aRes.data as any[]) || []).map(a => (a.company_name ? `${a.agent_name} (${a.company_name})` : a.agent_name))} />
}

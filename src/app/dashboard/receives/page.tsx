import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import ReceivesClient from '@/components/receives/ReceivesClient'

export const dynamic = 'force-dynamic'

export default async function ReceivesPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'invoices')) redirect(homeFor(employee))
  const supabase = await createClient()
  const names = await createServiceClient()
  const [v, c, i, e] = await Promise.all([
    supabase.from('receive_vouchers').select('*, customers(given_name, surname, phone), invoices(invoice_no)').order('created_at', { ascending: false }),
    supabase.from('customers').select('id, customer_code, given_name, surname, phone').order('given_name'),
    supabase.from('invoices').select('id, invoice_no, customer_id, customer_name, customer_phone, invoice_date, total, payments(amount)').eq('status', 'Active').order('invoice_date'),
    names.from('employees').select('name').eq('is_active', true).order('name'),
  ])
  return (
    <ReceivesClient
      vouchers={(v.data as any[]) || []}
      customers={(c.data as any[]) || []}
      invoices={(i.data as any[]) || []}
      staffNames={((e.data as any[]) || []).map(x => x.name)}
      me={employee?.name || ''}
    />
  )
}

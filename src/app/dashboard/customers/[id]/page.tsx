import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import CustomerStatement from '@/components/customers/CustomerStatement'

export const dynamic = 'force-dynamic'

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'customers')) redirect(homeFor(employee))
  const supabase = await createClient()
  const [cus, inv] = await Promise.all([
    supabase.from('customers').select('id, customer_code, given_name, surname, phone, email, customer_type, status').eq('id', id).single(),
    supabase.from('invoices').select('id, invoice_no, invoice_date, total, status, payments(id, amount, paid_on, method, reference, receive_vouchers(voucher_no, received_by))').eq('customer_id', id).order('invoice_date', { ascending: false }),
  ])
  if (!cus.data) notFound()
  return <CustomerStatement customer={cus.data as any} invoices={(inv.data as any[]) || []} />
}

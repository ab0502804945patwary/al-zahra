import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { homeFor } from '@/lib/access'
import InvoicesClient from '@/components/invoices/InvoicesClient'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (employee && employee.role !== 'admin') redirect(homeFor(employee))
  const supabase = await createClient()
  const [inv, cus, svc] = await Promise.all([
    supabase.from('invoices').select('id, invoice_no, customer_name, customer_phone, invoice_date, total, status, payments(amount)').order('created_at', { ascending: false }),
    supabase.from('customers').select('id, customer_code, given_name, surname, phone').neq('status', 'Blocked').order('given_name'),
    supabase.from('services').select('id, name, price').eq('is_active', true).order('name'),
  ])
  return (
    <InvoicesClient
      invoices={(inv.data as any[]) || []}
      customers={(cus.data as any[]) || []}
      services={(svc.data as any[]) || []}
    />
  )
}

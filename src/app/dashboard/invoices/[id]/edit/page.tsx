import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import InvoiceEditor from '@/components/invoices/InvoiceEditor'

export const dynamic = 'force-dynamic'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'invoices')) redirect(homeFor(employee))
  const supabase = await createClient()
  const [inv, items, pays, cus, svc] = await Promise.all([
    supabase.from('invoices').select('*').eq('id', id).single(),
    supabase.from('invoice_items').select('*').eq('invoice_id', id).order('id'),
    supabase.from('payments').select('amount').eq('invoice_id', id),
    supabase.from('customers').select('id, customer_code, given_name, surname, phone').order('given_name'),
    supabase.from('services').select('id, name, price').eq('is_active', true).order('name'),
  ])
  if (!inv.data) notFound()
  if ((inv.data as any).status === 'Cancelled') redirect(`/dashboard/invoices/${id}`)
  const paid = ((pays.data as any[]) || []).reduce((s, p) => s + Number(p.amount), 0)
  return <InvoiceEditor invoice={inv.data as any} items={(items.data as any[]) || []} paid={paid} customers={(cus.data as any[]) || []} services={(svc.data as any[]) || []} />
}

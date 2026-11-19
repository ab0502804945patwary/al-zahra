import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import InvoiceView from '@/components/invoices/InvoiceView'

export const dynamic = 'force-dynamic'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'invoices')) redirect(homeFor(employee))
  const supabase = await createClient()
  const [inv, items, pays] = await Promise.all([
    supabase.from('invoices').select('*').eq('id', id).single(),
    supabase.from('invoice_items').select('*').eq('invoice_id', id).order('id'),
    supabase.from('payments').select('*').eq('invoice_id', id).order('created_at'),
  ])
  if (!inv.data) notFound()
  return <InvoiceView invoice={inv.data as any} items={(items.data as any[]) || []} payments={(pays.data as any[]) || []} />
}

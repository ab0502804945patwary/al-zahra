import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessStage, homeFor } from '@/lib/access'
import PortalSheet from '@/components/stage/PortalSheet'

export const dynamic = 'force-dynamic'

export default async function PortalAccountsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!employee) redirect('/login')
  // Only admins and the staff assigned to Portals & Compliance (Stage 6) may open client passwords
  if (!canAccessStage(employee, 6)) redirect(homeFor(employee))
  const supabase = await createClient()
  const { data: entry } = await supabase.from('stage6_other_websites').select('id, company_id, client_name, portal_accounts, created_at').eq('id', id).single()
  if (!entry) notFound()
  const { data: company } = await supabase.from('companies').select('company_id, company_name, client_name, client_phone').eq('company_id', entry.company_id).single()
  return <PortalSheet entry={entry as any} company={company as any} />
}

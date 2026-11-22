import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import LeadForm from '@/components/leads/LeadForm'

export const dynamic = 'force-dynamic'

export default async function NewLeadPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'leads')) redirect(homeFor(employee))
  const supabase = await createClient()
  const names = await createServiceClient()
  const [eRes, sRes] = await Promise.all([
    names.from('employees').select('name').eq('is_active', true).order('name'),
    supabase.from('services').select('name').eq('is_active', true).order('name'),
  ])
  return <LeadForm staffNames={((eRes.data as any[]) || []).map(e => e.name)} serviceNames={((sRes.data as any[]) || []).map(s => s.name)} />
}

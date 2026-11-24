import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import LeadsClient from '@/components/leads/LeadsClient'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'leads')) redirect(homeFor(employee))
  const supabase = await createClient()
  const names = await createServiceClient()
  const [lRes, eRes] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    names.from('employees').select('name, avatar_url').eq('is_active', true).order('name'),
  ])
  return <LeadsClient isAdmin={employee?.role === 'admin'} leads={(lRes.data as any[]) || []} staff={((eRes.data as any[]) || []).map(e => ({ name: e.name as string, avatar: (e.avatar_url as string) || null }))} />
}

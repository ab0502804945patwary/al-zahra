import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import AgentsClient from '@/components/agents/AgentsClient'

export const dynamic = 'force-dynamic'

export default async function AgentsPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'agents')) redirect(homeFor(employee))
  const supabase = await createClient()
  const { data } = await supabase.from('agents').select('*').order('agent_code')
  return <AgentsClient agents={(data as any[]) || []} />
}

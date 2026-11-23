import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import AgentsClient from '@/components/agents/AgentsClient'

export const dynamic = 'force-dynamic'

export default async function AgentsPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee, user } = await getSessionInfo()
  if (!canAccessModule(employee, 'agents')) redirect(homeFor(employee))
  const supabase = await createClient()
  const isAdmin = employee?.role === 'admin'
  // Staff see only the agents they created themselves (the database enforces this too); an admin sees all
  let query = supabase.from('agents').select('*').order('agent_code')
  if (!isAdmin) query = query.eq('created_by', user?.id ?? '00000000-0000-0000-0000-000000000000')
  const { data } = await query
  const owners: Record<string, string> = {}
  if (isAdmin) {
    const { data: staff } = await (await createServiceClient()).from('employees').select('user_id, name')
    for (const e of (staff as any[]) || []) if (e.user_id) owners[e.user_id] = e.name
  }
  return <AgentsClient agents={(data as any[]) || []} isAdmin={isAdmin} owners={owners} />
}

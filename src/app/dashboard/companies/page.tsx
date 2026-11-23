import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import CompaniesClient from '@/components/companies/CompaniesClient'
import { Company } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee, user } = await getSessionInfo()
  if (!canAccessModule(employee, 'companies')) redirect(homeFor(employee))
  const supabase = await createClient()
  const isAdmin = employee?.role === 'admin'
  // Staff see only the companies they registered themselves; an admin sees every company
  let query = supabase.from('companies').select('*').order('company_id')
  if (!isAdmin) query = query.eq('created_by', user?.id ?? '00000000-0000-0000-0000-000000000000')
  const { data } = await query
  // admin: who registered each company
  const owners: Record<string, string> = {}
  const ownerAvatars: Record<string, string> = {}
  if (isAdmin) {
    const { data: staff } = await (await createServiceClient()).from('employees').select('user_id, name, avatar_url')
    for (const e of (staff as any[]) || []) if (e.user_id) { owners[e.user_id] = e.name; if (e.avatar_url) ownerAvatars[e.user_id] = e.avatar_url }
  }
  return <CompaniesClient companies={(data as Company[]) || []} isAdmin={isAdmin} owners={owners} ownerAvatars={ownerAvatars} />
}

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import CompaniesClient from '@/components/companies/CompaniesClient'
import { Company } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function RenewalCompaniesPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'renewals')) redirect(homeFor(employee))
  const supabase = await createClient()
  const { data } = await supabase.from('companies').select('*').order('company_id')
  return <CompaniesClient companies={(data as Company[]) || []} mode="renewal" isAdmin={employee?.role === 'admin'} />
}

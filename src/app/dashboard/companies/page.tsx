import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CompaniesClient from '@/components/companies/CompaniesClient'
import { Company } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const supabase = await createClient()
  const { data } = await supabase.from('companies').select('*').order('company_id')
  return <CompaniesClient companies={(data as Company[]) || []} />
}

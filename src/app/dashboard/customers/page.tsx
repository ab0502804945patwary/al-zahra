import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { homeFor } from '@/lib/access'
import CustomersClient from '@/components/customers/CustomersClient'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (employee && employee.role !== 'admin') redirect(homeFor(employee))
  const supabase = await createClient()
  const [cRes, eRes] = await Promise.all([
    supabase.from('customers').select('*').order('created_at', { ascending: false }),
    supabase.from('employees').select('name').eq('is_active', true).order('name'),
  ])
  return <CustomersClient customers={(cRes.data as any[]) || []} staffNames={((eRes.data as any[]) || []).map(e => e.name)} />
}

import { isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import EmployeesClient from '@/components/employees/EmployeesClient'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { supabase, user, employee: me } = await getSessionInfo()
  if (!user) redirect('/login')
  if (me?.role !== 'admin') redirect('/dashboard')

  const { data: employees } = await supabase.from('employees').select('*').neq('role', 'admin').order('created_at')
  return <EmployeesClient employees={employees || []} />
}

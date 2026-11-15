import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmployeesClient from '@/components/employees/EmployeesClient'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('employees').select('role').eq('user_id', user.id).single()
  if (me?.role !== 'admin') redirect('/dashboard')

  const { data: employees } = await supabase.from('employees').select('*').order('created_at')
  return <EmployeesClient employees={employees || []} />
}

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import DashboardShell from '@/components/layout/DashboardShell'
import { INITIAL_EMPLOYEES } from '@/lib/employeeData'
import { Employee } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const demoCookie = cookieStore.get('demo_session')?.value

  let employee: Employee | null = null

  if (demoCookie) {
    if (demoCookie === 'admin') {
      employee = {
        id: 'demo-admin-id',
        user_id: 'demo-user-id',
        name: 'Admin (Manager)',
        email: 'admin@alzahra.com',
        role: 'admin',
        is_active: true,
        created_at: '2026-01-01T00:00:00.000Z'
      }
    } else {
      // Look up staff member from initial employee directory
      const found = INITIAL_EMPLOYEES.find(e => e.id === demoCookie || e.email === demoCookie)
      if (found) {
        employee = found
      } else {
        // Fallback default staff
        employee = INITIAL_EMPLOYEES[0] // Shahariar Rakib (Stage 1)
      }
    }
  } else if (isSupabaseConfigured) {
    const supabase = await createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) redirect('/login')

      const { data: emp } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .single()
      employee = emp
    } catch {
      redirect('/login')
    }
  } else {
    redirect('/login')
  }

  return (
    <DashboardShell employee={employee}>
      {children}
    </DashboardShell>
  )
}

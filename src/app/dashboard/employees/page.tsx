import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import EmployeesClient from '@/components/employees/EmployeesClient'
import { INITIAL_EMPLOYEES } from '@/lib/employeeData'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('demo_session')?.value === 'admin'

  const supabase = await createClient()

  if (!isDemo) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) redirect('/login')

      const { data: me } = await supabase.from('employees').select('role').eq('user_id', user.id).single()
      if (me?.role !== 'admin') redirect('/dashboard')

      const { data: employees } = await supabase.from('employees').select('*').order('created_at')
      if (employees && employees.length > 0) {
        // Merge with initial data so rich tasks/salary details are enriched
        const merged = employees.map(emp => {
          const match = INITIAL_EMPLOYEES.find(i => i.id === emp.id || i.email === emp.email)
          return match ? { ...match, ...emp } : emp
        })
        return <EmployeesClient employees={merged} />
      }
    } catch {
      redirect('/login')
    }
  }

  return <EmployeesClient employees={INITIAL_EMPLOYEES} />
}

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import StaffProfileClient from '@/components/employees/StaffProfileClient'
import { INITIAL_EMPLOYEES } from '@/lib/employeeData'
import { Employee } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StaffProfilePage({ params }: PageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('demo_session')?.value === 'admin'

  let employee: Employee | null = null

  if (!isDemo && isSupabaseConfigured) {
    const supabase = await createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) redirect('/login')

      const { data: me } = await supabase.from('employees').select('role').eq('user_id', user.id).single()
      if (me?.role !== 'admin') redirect('/dashboard')

      const { data: emp } = await supabase.from('employees').select('*').eq('id', id).single()
      if (emp) {
        const fallbackMatch = INITIAL_EMPLOYEES.find(i => i.id === emp.id || i.email === emp.email)
        employee = fallbackMatch ? { ...fallbackMatch, ...emp } : emp
      }
    } catch {
      redirect('/login')
    }
  }

  // Fallback to rich initial mock employees
  if (!employee) {
    employee = INITIAL_EMPLOYEES.find(e => e.id === id) || null
  }

  // If not found in initial mock list, generate a template profile
  if (!employee) {
    employee = {
      id,
      user_id: `u-${id}`,
      name: 'Operational Staff Member',
      email: `${id}@alzahra.com`,
      role: 'employee',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      salary: {
        salary_type: 'monthly_fixed',
        base_salary: 6000,
        currency: 'SAR',
        housing_allowance: 1500,
        transport_allowance: 500,
        payment_status: 'Paid',
      },
      tasks: [],
      reviews: [],
    }
  }

  return <StaffProfileClient initialEmployee={employee} />
}

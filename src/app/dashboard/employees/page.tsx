import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import EmployeesClient from '@/components/employees/EmployeesClient'
import { Employee } from '@/lib/types'

export const dynamic = 'force-dynamic'

const FALLBACK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    user_id: 'u-1',
    name: 'Shahariar Hossain Rakib',
    email: 'rakib@alzahra.com',
    phone: '+966 50 123 4567',
    role: 'employee',
    assigned_stage: 1,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'emp-2',
    user_id: 'u-2',
    name: 'Abdul Kaium',
    email: 'kaium@alzahra.com',
    phone: '+966 50 234 5678',
    role: 'employee',
    assigned_stage: 2,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'emp-3',
    user_id: 'u-3',
    name: 'Arju Hossain',
    email: 'arju@alzahra.com',
    phone: '+966 50 345 6789',
    role: 'employee',
    assigned_stage: 3,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'emp-4',
    user_id: 'u-4',
    name: 'Md Miraj',
    email: 'miraj@alzahra.com',
    phone: '+966 50 456 7890',
    role: 'employee',
    assigned_stage: 4,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'emp-5',
    user_id: 'u-5',
    name: 'Md Ishak',
    email: 'ishak@alzahra.com',
    phone: '+966 50 567 8901',
    role: 'employee',
    assigned_stage: 5,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'emp-6',
    user_id: 'u-6',
    name: 'Md Azad',
    email: 'azad@alzahra.com',
    phone: '+966 50 678 9012',
    role: 'employee',
    assigned_stage: 6,
    is_active: true,
    created_at: new Date().toISOString()
  }
]

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
        return <EmployeesClient employees={employees} />
      }
    } catch {
      redirect('/login')
    }
  }

  return <EmployeesClient employees={FALLBACK_EMPLOYEES} />
}

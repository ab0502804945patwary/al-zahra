import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('demo_session')?.value === 'admin'

  const supabase = await createClient()
  let employee = null

  if (isDemo) {
    employee = {
      id: 'demo-admin-id',
      user_id: 'demo-user-id',
      name: 'Admin (Manager)',
      email: 'admin@alzahra.com',
      role: 'admin' as const,
      is_active: true,
      created_at: new Date().toISOString()
    }
  } else {
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
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar employee={employee} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar employee={employee} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

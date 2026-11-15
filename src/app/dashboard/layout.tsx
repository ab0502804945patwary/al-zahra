import { isSupabaseConfigured } from '@/lib/supabase/server'
import { getSessionInfo } from '@/lib/session'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { Employee } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) redirect('/login')

  const { supabase, user, employee: emp } = await getSessionInfo()
  if (!user) redirect('/login')

  // Signed in but no staff profile: not allowed in
  if (!emp || emp.is_active === false) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  // salary, tasks, national id etc. never go to the browser from the layout
  const safeEmployee = {
    id: emp.id, user_id: emp.user_id, name: emp.name, email: emp.email, role: emp.role,
    assigned_stage: emp.assigned_stage, assigned_stages: emp.assigned_stages, avatar_url: emp.avatar_url,
    is_active: emp.is_active, created_at: emp.created_at,
  }

  return (
    <DashboardShell employee={safeEmployee as Employee}>
      {children}
    </DashboardShell>
  )
}

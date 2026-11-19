import { isSupabaseConfigured } from '@/lib/supabase/server'
import { getSessionInfo } from '@/lib/session'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { Employee } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) redirect('/login')

  const { employee: emp, status } = await getSessionInfo()

  // Could not check right now (slow network, database busy): show the retry page, never log out
  if (status === 'error') throw new Error('Temporary connection problem')

  // A cookie that no longer matches a real user must be cleared, otherwise /login and /dashboard redirect to each other forever.
  // /api/signout clears only this device.
  if (status === 'anon') redirect('/api/signout')

  // Signed in but no staff profile, or the account was switched off: not allowed in
  if (status === 'no-profile' || !emp || emp.is_active === false) redirect('/api/signout')

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

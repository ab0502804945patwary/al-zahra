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

  return (
    <DashboardShell employee={emp as Employee}>
      {children}
    </DashboardShell>
  )
}

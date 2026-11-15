import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { Employee } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) redirect('/login')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: emp } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', user.id)
    .single()

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

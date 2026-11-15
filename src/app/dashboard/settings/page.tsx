import { isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import SettingsClient from '@/components/settings/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { user, employee: emp } = await getSessionInfo()
  if (!user) redirect('/login')
  if (!emp) redirect('/login')
  return <SettingsClient profile={emp} />
}

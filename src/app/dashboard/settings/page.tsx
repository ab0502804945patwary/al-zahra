import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/settings/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: emp } = await supabase.from('employees').select('name, email, phone, role, avatar_url').eq('user_id', user.id).single()
  if (!emp) redirect('/login')
  return <SettingsClient profile={emp} />
}

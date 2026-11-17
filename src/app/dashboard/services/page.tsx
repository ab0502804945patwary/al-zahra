import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { homeFor } from '@/lib/access'
import ServicesClient from '@/components/services/ServicesClient'

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (employee && employee.role !== 'admin') redirect(homeFor(employee))
  const supabase = await createClient()
  const { data } = await supabase.from('services').select('*').order('name')
  return <ServicesClient services={(data as any[]) || []} />
}

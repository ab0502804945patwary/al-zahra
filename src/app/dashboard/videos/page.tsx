import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import VideosClient from '@/components/videos/VideosClient'

export const dynamic = 'force-dynamic'

export default async function VideosPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'videos')) redirect(homeFor(employee))
  const supabase = await createClient()
  const names = await createServiceClient()
  const [vRes, eRes] = await Promise.all([
    supabase.from('videos').select('*').order('posted_on', { ascending: false }).order('posted_time', { ascending: false }),
    names.from('employees').select('name').eq('is_active', true).order('name'),
  ])
  return <VideosClient videos={(vRes.data as any[]) || []} staffNames={((eRes.data as any[]) || []).map(e => e.name)} meName={employee?.name || ''} />
}

import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import LeadForm from '@/components/leads/LeadForm'

export const dynamic = 'force-dynamic'

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const { id } = await params
  const { view } = await searchParams
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'leads')) redirect(homeFor(employee))
  const supabase = await createClient()
  const names = await createServiceClient()
  const [lead, eRes, sRes, uRes] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).single(),
    names.from('employees').select('name, avatar_url').eq('is_active', true).order('name'),
    supabase.from('services').select('name').eq('is_active', true).order('name'),
    supabase.from('leads').select('source, service_required'),
  ])
  if (!lead.data) notFound()
  const used = (uRes.data as any[]) || []
  const distinct = (k: string) => [...new Set(used.map(r => String(r[k] || '').trim()).filter(Boolean))].sort()
  return (
    <LeadForm
      usedSources={distinct('source')}
      usedServices={distinct('service_required')}
      lead={lead.data as any}
      readOnly={view === '1'}
      staff={((eRes.data as any[]) || []).map(e => ({ name: e.name as string, avatar: (e.avatar_url as string) || null }))}
      serviceNames={((sRes.data as any[]) || []).map(s => s.name)}
    />
  )
}

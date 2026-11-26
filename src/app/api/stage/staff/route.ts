import { NextResponse } from 'next/server'
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, stagesOf } from '@/lib/access'

export const dynamic = 'force-dynamic'

/**
 * GET -> { staff: [{ id, name, stages }] }  (stages null = admin, every phase)
 * Names for the "Others Service" staff pickers on the company form. Admins and company-form users only.
 */
export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  const { user, employee: me } = await getSessionInfo()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  if (!me || me.is_active === false || !(canAccessModule(me, 'companies') || canAccessModule(me, 'renewals'))) {
    return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
  }

  const db = await createServiceClient()
  const { data, error } = await db.from('employees').select('user_id, name, role, assigned_stage, assigned_stages, is_active').order('name')
  if (error) return NextResponse.json({ error: 'Could not load the staff list.' }, { status: 500 })
  const staff = (data || [])
    .filter(e => e.user_id && e.is_active !== false)
    .map(e => ({ id: e.user_id as string, name: e.name as string, stages: stagesOf(e) }))
  return NextResponse.json({ staff }, { headers: { 'Cache-Control': 'no-store' } })
}

import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { adminDb, verifyMasterPassword } from '@/lib/masterPassword'
import { STAGE_CONFIG } from '@/lib/stageData'
import { canAccessStage, canAccessModule } from '@/lib/access'

export const dynamic = 'force-dynamic'

/**
 * The only way to delete anything. Needs a signed-in user, the right permission and the master password.
 * The database has no DELETE policy, so the delete itself runs with the server key after these checks.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { table, id, password } = await request.json().catch(() => ({}))
  const stageEntry = Object.entries(STAGE_CONFIG).find(([, c]) => c.table === table)
  if ((!stageEntry && table !== 'companies' && table !== 'employees' && table !== 'leads' && table !== 'videos') || !id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { data: me } = await supabase.from('employees').select('role, assigned_stage, assigned_stages, modules, is_active').eq('user_id', user.id).single()
  if (!me || me.is_active === false) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
  const isAdmin = me.role === 'admin'
  if (!isAdmin) {
    // staff may only delete inside a stage they are assigned to
    const okStage = !!stageEntry && canAccessStage(me, Number(stageEntry[0]))
    const okLead = table === 'leads' && canAccessModule(me, 'leads')
    const okVideo = table === 'videos' && canAccessModule(me, 'videos')
    if (!okStage && !okLead && !okVideo) return NextResponse.json({ error: 'You cannot delete this.' }, { status: 403 })
  }

  const v = await verifyMasterPassword(String(password || ''), user.id)
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 403 })

  const db = adminDb()
  if (!db) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing.' }, { status: 503 })

  if (table === 'employees') {
    const { data: target } = await db.from('employees').select('user_id').eq('id', id).maybeSingle()
    if (target?.user_id === user.id) return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
    const { error } = await db.from('employees').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (target?.user_id) await db.auth.admin.deleteUser(target.user_id).catch(() => {})
    return NextResponse.json({ ok: true })
  }

  const { error } = await db.from(table).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

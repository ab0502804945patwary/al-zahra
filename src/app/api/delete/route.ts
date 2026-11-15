import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { adminDb, verifyMasterPassword } from '@/lib/masterPassword'
import { STAGE_CONFIG } from '@/lib/stageData'

export const dynamic = 'force-dynamic'

const STAGE_TABLES = Object.values(STAGE_CONFIG).map(c => c.table)

/** Delete a record only when the master password is correct. Runs with the caller's own permissions (RLS). */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { table, id, password } = await request.json().catch(() => ({}))
  const allowed = ['companies', 'employees', ...STAGE_TABLES]
  if (!allowed.includes(table) || !id) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const v = await verifyMasterPassword(String(password || ''))
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 403 })

  if (table === 'employees') {
    const { data: me } = await supabase.from('employees').select('role').eq('user_id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Admins only.' }, { status: 403 })
    const db = adminDb()!
    const { data: target } = await db.from('employees').select('user_id').eq('id', id).maybeSingle()
    const { error } = await db.from('employees').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (target?.user_id) await db.auth.admin.deleteUser(target.user_id).catch(() => {})
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

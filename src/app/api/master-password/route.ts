import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { isMasterPasswordSet, setMasterPassword, verifyMasterPassword } from '@/lib/masterPassword'

export const dynamic = 'force-dynamic'

async function currentUser() {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('employees').select('role').eq('user_id', user.id).single()
  return { id: user.id, role: (data?.role || 'employee') as string }
}

// Is a master password set? (any signed-in user)
export async function GET() {
  if (!(await currentUser())) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  const r = await isMasterPasswordSet()
  return NextResponse.json({ set: r.set, error: r.error })
}

// Set / change (admin only). Changing needs the current master password.
export async function POST(request: Request) {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  if (me.role !== 'admin') return NextResponse.json({ error: 'Admins only.' }, { status: 403 })
  const { current, next } = await request.json().catch(() => ({}))
  if (!next || String(next).length < 6) return NextResponse.json({ error: 'New master password must be at least 6 characters.' }, { status: 400 })
  const state = await isMasterPasswordSet()
  if (state.error) return NextResponse.json({ error: state.error }, { status: 503 })
  if (state.set) {
    const v = await verifyMasterPassword(String(current || ''), me.id)
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 403 })
  }
  const r = await setMasterPassword(String(next))
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 })
}

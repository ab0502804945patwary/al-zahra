import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Admin-only: change a team member's login email and/or password. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing, so logins cannot be changed.' }, { status: 503 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  const { data: me } = await supabase.from('employees').select('role').eq('user_id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Admins only.' }, { status: 403 })

  const { employee_id, email, password } = await request.json().catch(() => ({}))
  if (!employee_id || typeof employee_id !== 'string') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  const newEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const newPassword = typeof password === 'string' ? password : ''
  if (!newEmail && !newPassword) return NextResponse.json({ ok: true, changed: [] })
  if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  if (newPassword && newPassword.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false } })
  const { data: target } = await admin.from('employees').select('id, user_id, email').eq('id', employee_id).maybeSingle()
  if (!target?.user_id) return NextResponse.json({ error: 'This team member has no login to change.' }, { status: 404 })

  const attrs: { email?: string; password?: string; email_confirm?: boolean } = {}
  const changed: string[] = []
  if (newEmail && newEmail !== String(target.email || '').toLowerCase()) { attrs.email = newEmail; attrs.email_confirm = true; changed.push('email') }
  if (newPassword) { attrs.password = newPassword; changed.push('password') }
  if (!changed.length) return NextResponse.json({ ok: true, changed })

  const { error: authErr } = await admin.auth.admin.updateUserById(target.user_id, attrs)
  if (authErr) {
    const msg = /already|registered|exists/i.test(authErr.message) ? 'That email is already used by another account.' : authErr.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  if (attrs.email) {
    const { error: dbErr } = await admin.from('employees').update({ email: attrs.email }).eq('id', target.id)
    if (dbErr) return NextResponse.json({ error: 'Login email changed, but the profile could not be updated: ' + dbErr.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, changed })
}

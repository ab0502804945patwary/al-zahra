import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Admin-only: create a Supabase Auth login + employees row for a new staff member. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing in .env.local, so staff logins cannot be created.' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  const { data: me } = await supabase.from('employees').select('role').eq('user_id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Admins only.' }, { status: 403 })

  const body = await request.json()
  const { name, email, password, phone, role, assigned_stage, is_active, avatar_url } = body
  if (!name || !email || !password || String(password).length < 6) {
    return NextResponse.json({ error: 'Name, email and a password of at least 6 characters are required.' }, { status: 400 })
  }

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false } })
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError || !created.user) {
    return NextResponse.json({ error: authError?.message || 'Could not create login.' }, { status: 400 })
  }

  const { error: dbError } = await admin.from('employees').insert([{
    user_id: created.user.id,
    name,
    email,
    phone: phone || null,
    role: role || 'employee',
    assigned_stage: assigned_stage ?? null,
    is_active: is_active ?? true,
    avatar_url: avatar_url || null,
  }])
  if (dbError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}

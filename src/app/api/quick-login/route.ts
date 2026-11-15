import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { QUICK_ACCOUNTS } from '@/lib/quickAccounts'

export const dynamic = 'force-dynamic'

/** One-click sign-in for the test accounts. Creates the real Supabase user + staff row on first use. */
export async function POST(request: Request) {
  if (process.env.ENABLE_QUICK_LOGIN === 'false') return NextResponse.json({ error: 'Quick login is disabled.' }, { status: 404 })
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing.' }, { status: 503 })

  const { key } = await request.json().catch(() => ({ key: '' }))
  const acc = QUICK_ACCOUNTS.find(a => a.key === key)
  if (!acc) return NextResponse.json({ error: 'Unknown account.' }, { status: 400 })

  const password = process.env.QUICK_LOGIN_PASSWORD || 'AlZahra@2026'
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false } })

  // Make sure the auth user and the staff row exist (idempotent)
  const { data: existing } = await admin.from('employees').select('id, user_id').eq('email', acc.email).maybeSingle()
  if (existing?.user_id) {
    // keep the test password in sync for logins created earlier
    await admin.auth.admin.updateUserById(existing.user_id, { password, email_confirm: true }).catch(() => {})
  }
  if (!existing) {
    let userId: string | undefined
    const created = await admin.auth.admin.createUser({ email: acc.email, password, email_confirm: true })
    if (created.data?.user) {
      userId = created.data.user.id
    } else {
      // login already exists in auth: look it up and reset its password
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      userId = list?.users.find(u => u.email === acc.email)?.id
      if (userId) await admin.auth.admin.updateUserById(userId, { password, email_confirm: true })
    }
    if (!userId) return NextResponse.json({ error: created.error?.message || 'Could not create login.' }, { status: 400 })
    const { error } = await admin.from('employees').insert([{
      user_id: userId, name: acc.name, email: acc.email, role: acc.role,
      assigned_stage: acc.stages[0] ?? null, assigned_stages: acc.stages, is_active: true,
    }])
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email: acc.email, password })
  if (error) return NextResponse.json({ error: error.message }, { status: 401 })
  return NextResponse.json({ ok: true })
}

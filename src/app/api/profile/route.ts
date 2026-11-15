import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { adminDb } from '@/lib/masterPassword'

export const dynamic = 'force-dynamic'

/** Update the signed-in user's own profile (name, phone, photo). */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const update: Record<string, any> = {}
  if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim()
  if (typeof body.phone === 'string') update.phone = body.phone.trim() || null
  if ('avatar_url' in body) {
    const a = body.avatar_url
    if (a && String(a).length > 400000) return NextResponse.json({ error: 'Image is too large.' }, { status: 400 })
    update.avatar_url = a || null
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })

  // Own row only; service key so it works even when RLS blocks self-updates
  const db = adminDb() || supabase
  const { error } = await db.from('employees').update(update).eq('user_id', user.id)
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { adminDb } from '@/lib/masterPassword'
import { pushConfigured } from '@/lib/push'

export const dynamic = 'force-dynamic'

async function me() {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** Save this device so it can receive push notifications. */
export async function POST(request: Request) {
  const user = await me()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  if (!pushConfigured) return NextResponse.json({ error: 'Push is not set up on the server (VAPID keys missing).' }, { status: 503 })
  const { subscription } = await request.json().catch(() => ({}))
  const endpoint = subscription?.endpoint
  const p256dh = subscription?.keys?.p256dh
  const auth = subscription?.keys?.auth
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 })
  const db = adminDb()
  if (!db) return NextResponse.json({ error: 'Server key missing.' }, { status: 503 })
  const { error } = await db.from('push_subscriptions').upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: 'endpoint' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

/** Remove this device. */
export async function DELETE(request: Request) {
  const user = await me()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  const { endpoint } = await request.json().catch(() => ({}))
  const db = adminDb()
  if (db && endpoint) await db.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint)
  return NextResponse.json({ ok: true })
}

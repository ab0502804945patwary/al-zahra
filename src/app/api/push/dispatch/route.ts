import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { dispatchPending, sendToUser } from '@/lib/push'

export const dynamic = 'force-dynamic'

async function me() {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** Called after a save: pushes newly arrived work to the staff it belongs to. Safe to call often. */
export async function POST(request: Request) {
  const user = await me()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  if (body?.test) {
    const n = await sendToUser(user.id, { title: 'AL ZAHRA — test', body: 'Notifications are working on this device.', url: '/dashboard/settings', tag: 'test' })
    return NextResponse.json({ ok: true, sent: n })
  }
  try {
    return NextResponse.json({ ok: true, ...(await dispatchPending()) })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

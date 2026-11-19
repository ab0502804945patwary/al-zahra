import * as webpush from 'web-push'
import { adminDb } from '@/lib/masterPassword'
import { getAllStaffNotifications } from '@/lib/notifications'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const SUBJECT = process.env.VAPID_SUBJECT || process.env.NEXT_PUBLIC_SITE_URL || 'https://erp.finoraca.com'

export const pushConfigured = Boolean(PUBLIC_KEY && PRIVATE_KEY)

function setup() {
  if (!pushConfigured) return false
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY!, PRIVATE_KEY!)
  return true
}

export interface PushPayload { title: string; body: string; url: string; tag?: string }

/** Sends one notification to every device of a user. Dead devices (gone/expired) are removed. */
export async function sendToUser(userId: string, payload: PushPayload): Promise<number> {
  const db = adminDb()
  if (!db || !setup()) return 0
  const { data: subs } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId)
  let sent = 0
  for (const s of subs || []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 60 * 60 * 24 })
      sent++
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await db.from('push_subscriptions').delete().eq('id', s.id)
    }
  }
  return sent
}

/**
 * Finds work that reached each staff member and pushes it once.
 * Called after any save in the app. Already-sent items are remembered in push_sent;
 * items that are no longer waiting are forgotten so a later return of the work notifies again.
 */
export async function dispatchPending(): Promise<{ pushed: number }> {
  const db = adminDb()
  if (!db || !setup()) return { pushed: 0 }

  // Do not run twice at the same moment (many saves in a row)
  const now = Date.now()
  const { data: last } = await db.from('app_settings').select('value').eq('key', 'push_last_run').maybeSingle()
  if (last?.value && now - Number(last.value) < 4000) return { pushed: 0 }
  await db.from('app_settings').upsert({ key: 'push_last_run', value: String(now), updated_at: new Date().toISOString() })

  const { data: subUsers } = await db.from('push_subscriptions').select('user_id')
  const withDevices = new Set((subUsers || []).map((r: any) => r.user_id as string))
  if (!withDevices.size) return { pushed: 0 }

  let pushed = 0
  const perUser = await getAllStaffNotifications()
  for (const { userId, items } of perUser) {
    if (!withDevices.has(userId)) continue
    const { data: sentRows } = await db.from('push_sent').select('key').eq('user_id', userId)
    const sentKeys = new Set((sentRows || []).map((r: any) => r.key as string))
    const pendingKeys = new Set(items.map(i => i.key))

    const fresh = items.filter(i => !sentKeys.has(i.key))
    for (const item of fresh.slice(0, 5)) {
      const n = await sendToUser(userId, { title: 'AL ZAHRA — new work', body: item.message, url: item.href, tag: item.key })
      // remember it only when a device really received it, otherwise try again at the next save
      if (n > 0) { pushed++; await db.from('push_sent').upsert({ user_id: userId, key: item.key }) }
    }
    // more than 5 at once: one summary instead of a flood
    if (fresh.length > 5) {
      const n = await sendToUser(userId, { title: 'AL ZAHRA — new work', body: `${fresh.length - 5} more files are waiting for you`, url: fresh[5].href, tag: 'more' })
      if (n > 0) for (const item of fresh.slice(5)) await db.from('push_sent').upsert({ user_id: userId, key: item.key })
    }
    const stale = [...sentKeys].filter(k => !pendingKeys.has(k))
    if (stale.length) await db.from('push_sent').delete().eq('user_id', userId).in('key', stale)
  }
  return { pushed }
}

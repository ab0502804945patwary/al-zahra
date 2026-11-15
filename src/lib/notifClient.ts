import type { AppNotification } from '@/lib/notifications'

// The bell and the sidebar badges both need the same list: share one request.
let inflight: Promise<AppNotification[]> | null = null
let last = 0
let cached: AppNotification[] = []

export async function fetchNotifications(force = false): Promise<AppNotification[]> {
  if (!force && Date.now() - last < 8000) return cached
  if (inflight) return inflight
  inflight = fetch('/api/notifications', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : { items: cached }))
    .then(d => {
      cached = (d.items || []) as AppNotification[]
      last = Date.now()
      return cached
    })
    .catch(() => cached)
    .finally(() => { inflight = null })
  return inflight
}

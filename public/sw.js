// AL ZAHRA ERP service worker.
// - makes the site installable and shows a friendly page when there is no internet
// - shows push notifications (new work for the staff member), even when the app is closed
// It never stores pages or data: the ERP always shows live, signed-in information.
const OFFLINE_URL = '/offline.html'
const CACHE = 'alzahra-offline-v3'

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll([OFFLINE_URL, '/icons/icon-192.png'])))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const req = event.request
  // the little logo on the offline page must still show when there is no network
  if (req.method === 'GET' && new URL(req.url).pathname === '/icons/icon-192.png') {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req)))
    return
  }
  if (req.mode !== 'navigate') return
  // Try the network; on a failure wait a moment and try once more (a weak or briefly dropped connection)
  // before showing the offline page, so a hiccup does not look like "you are offline".
  event.respondWith((async () => {
    try { return await fetch(req.clone()) } catch (e) {}
    await new Promise(r => setTimeout(r, 800))
    try { return await fetch(req.clone()) } catch (e) {}
    return (await caches.match(OFFLINE_URL)) || Response.error()
  })())
})

self.addEventListener('push', event => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) { data = { body: event.data ? event.data.text() : '' } }
  const title = data.title || 'AL ZAHRA'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      vibrate: [200, 100, 200],
      data: { url: data.url || '/dashboard' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) {
          c.focus()
          if ('navigate' in c) c.navigate(url)
          return
        }
      }
      return self.clients.openWindow(url)
    })
  )
})

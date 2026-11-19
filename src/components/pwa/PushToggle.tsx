'use client'
import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2, Send } from 'lucide-react'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function keyToBytes(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

type State = 'unsupported' | 'blocked' | 'off' | 'on'

/** Settings card body: allow/stop notifications on this device and send a test. */
export default function PushToggle() {
  const [state, setState] = useState<State>('off')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { setState('unsupported'); return }
    if (Notification.permission === 'denied') { setState('blocked'); return }
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setState(sub && Notification.permission === 'granted' ? 'on' : 'off'))
      .catch(() => {})
  }, [])

  async function enable() {
    setBusy(true); setMsg(null)
    try {
      if (!PUBLIC_KEY) throw new Error('Notifications are not set up on the server yet.')
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setState(perm === 'denied' ? 'blocked' : 'off'); throw new Error('Notifications were not allowed.') }
      const reg = await navigator.serviceWorker.ready
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(PUBLIC_KEY) }))
      const res = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON() }) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not save this device.')
      setState('on')
      setMsg({ ok: true, text: 'Notifications are on for this device.' })
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || 'Could not turn on notifications.' })
    }
    setBusy(false)
  }

  async function disable() {
    setBusy(true); setMsg(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) })
        await sub.unsubscribe()
      }
      setState('off')
    } catch {}
    setBusy(false)
  }

  async function test() {
    setBusy(true); setMsg(null)
    const res = await fetch('/api/push/dispatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test: true }) })
    const d = await res.json().catch(() => ({}))
    setMsg(d.sent > 0 ? { ok: true, text: 'Test sent. You should see it in a moment.' } : { ok: false, text: 'Nothing was delivered. Turn notifications off and on again.' })
    setBusy(false)
  }

  if (state === 'unsupported') {
    return <p className="text-xs text-slate-500">This browser cannot show notifications. On iPhone: add the app to the Home Screen first (Share → Add to Home Screen), then open it from there.</p>
  }
  if (state === 'blocked') {
    return <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">Notifications are blocked for this site. Click the lock icon next to the address bar, allow Notifications, then reload.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {state === 'on' ? (
          <>
            <button type="button" onClick={test} disabled={busy} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send test
            </button>
            <button type="button" onClick={disable} disabled={busy} className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5">
              <BellOff className="w-3.5 h-3.5" /> Turn off
            </button>
          </>
        ) : (
          <button type="button" onClick={enable} disabled={busy} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />} Allow notifications
          </button>
        )}
      </div>
      {state === 'on' && <p className="text-[11px] text-emerald-700">On for this device. New work reaches you even when the app is closed.</p>}
      {msg && <div className={`text-xs rounded-lg p-2 border ${msg.ok ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>{msg.text}</div>}
    </div>
  )
}

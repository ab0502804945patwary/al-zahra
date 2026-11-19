'use client'
import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const BUILD = process.env.NEXT_PUBLIC_BUILD_ID || 'dev'
const CHECK_MS = 5 * 60 * 1000

/**
 * Shows "A new version is available" as soon as a newer deploy is online.
 * It checks every 5 minutes, when the tab comes back to the front, and when the phone/PC is back online.
 */
export default function UpdateBanner() {
  const [stale, setStale] = useState(false)

  useEffect(() => {
    let alive = true
    const check = async () => {
      try {
        const r = await fetch('/api/version', { cache: 'no-store' })
        if (!r.ok) return
        const { build } = await r.json()
        if (alive && build && build !== 'dev' && BUILD !== 'dev' && build !== BUILD) setStale(true)
        // also let the browser look for a new service worker
        navigator.serviceWorker?.getRegistration().then(reg => reg?.update()).catch(() => {})
      } catch {}
    }
    const t = setInterval(check, CHECK_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', check)
    check()
    return () => {
      alive = false
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', check)
    }
  }, [])

  if (!stale) return null
  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[calc(100vw-2rem)] max-w-md bg-slate-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3">
      <RefreshCw className="w-4 h-4 text-blue-300 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold">New version available</div>
        <div className="text-[11px] text-slate-300">Update to get the latest improvements.</div>
      </div>
      <button onClick={() => window.location.reload()} className="shrink-0 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-xs font-semibold rounded-lg">
        Update now
      </button>
    </div>
  )
}

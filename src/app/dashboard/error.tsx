'use client'
import { useEffect } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'

/** Shown when a page could not load for a moment (slow network). You stay signed in; it retries by itself. */
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    const t = setTimeout(reset, 3000)
    return () => clearTimeout(t)
  }, [reset])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        <h2 className="text-sm font-bold text-slate-900">Reconnecting…</h2>
        <p className="text-xs text-slate-500">The connection was slow for a moment. You are still signed in. Trying again.</p>
        <button onClick={reset} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Try now
        </button>
      </div>
    </div>
  )
}

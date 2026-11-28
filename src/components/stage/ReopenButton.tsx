'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { STAGE_CONFIG } from '@/lib/stageData'
import { assessTiming } from '@/lib/utils'
import { triggerPush } from '@/lib/pushClient'

/** Admin only: a record completed by mistake goes back to Pending. Everything else in it stays. */
export default function ReopenButton({ stageId, entry }: { stageId: string; entry: any }) {
  const router = useRouter()
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Company Name Clearance is completed by its Approval Date, every other phase by its Completion Date
  const clearance = stageId === '8'
  if (!(clearance ? entry.approval_date : entry.complete_date)) return null

  const notes = [
    clearance ? 'The Approval Date and Expiration Date will be removed.' : 'The Completion Date will be removed.',
    stageId === '7' ? 'The company goes back from Renewal Companies to the workflow.' : 'Records already opened in later phases stay.',
  ]

  async function reopen() {
    let patch: Record<string, any> = { approval_date: null, expire_date: null, remaining_days: null }
    if (!clearance) {
      const t = assessTiming(entry.submit_date, entry.target_date, null)
      patch = { complete_date: null, days_taken: t.days, status: t.status, completion_percent: t.completion, overdue_status: t.overdue }
    }
    setBusy(true)
    setError('')
    const { data, error: err } = await createClient().from(STAGE_CONFIG[stageId].table).update(patch).eq('id', entry.id).select('id')
    setBusy(false)
    if (err || !data?.length) { setError('Could not reopen: ' + (err?.message || 'no permission')); return }
    setAsking(false)
    triggerPush()
    router.refresh()
  }

  return (
    <>
      <button type="button" onClick={() => { setError(''); setAsking(true) }} title="Reopen: move back to Pending" aria-label="Reopen" className="p-1.5 hover:bg-rose-50 rounded-md transition text-rose-600">
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
      {asking && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => !busy && setAsking(false)}>
          <div role="alertdialog" aria-modal="true" aria-label="Move back to Pending" className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden text-center whitespace-normal" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape' && !busy) setAsking(false) }}>
            <div className="h-1.5 bg-red-600" />
            <div className="px-6 pt-6 pb-5">
              <span className="mx-auto mb-3 w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle className="w-7 h-7" /></span>
              <h2 className="text-base font-bold text-red-700">Move {entry.company_id || 'this record'} back to Pending?</h2>
              {entry.companies?.company_name && <p className="mt-1 text-xs font-semibold text-slate-800">{entry.companies.company_name}</p>}
              <div className="mt-3 text-xs text-slate-600 space-y-1">{notes.map(n => <p key={n}>{n}</p>)}</div>
              {error && <p className="mt-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button type="button" autoFocus onClick={() => setAsking(false)} disabled={busy} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancel</button>
              <button type="button" onClick={reopen} disabled={busy} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white disabled:opacity-60">
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Yes, move to Pending
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

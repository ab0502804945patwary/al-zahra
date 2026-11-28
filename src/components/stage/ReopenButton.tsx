'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { STAGE_CONFIG } from '@/lib/stageData'
import { assessTiming } from '@/lib/utils'
import { triggerPush } from '@/lib/pushClient'

/** Admin only: a record completed by mistake goes back to Pending. Everything else in it stays. */
export default function ReopenButton({ stageId, entry }: { stageId: string; entry: any }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  // Company Name Clearance is completed by its Approval Date, every other phase by its Completion Date
  const clearance = stageId === '8'
  if (!(clearance ? entry.approval_date : entry.complete_date)) return null

  async function reopen() {
    const notes = [
      clearance ? 'The Approval Date and Expiration Date will be removed.' : 'The Completion Date will be removed.',
      stageId === '7' ? 'The company goes back from Renewal Companies to the workflow.' : 'Records already opened in later phases stay.',
    ]
    if (!window.confirm(`Move ${entry.company_id || 'this record'} back to Pending?\n\n${notes.join('\n')}`)) return
    let patch: Record<string, any> = { approval_date: null, expire_date: null, remaining_days: null }
    if (!clearance) {
      const t = assessTiming(entry.submit_date, entry.target_date, null)
      patch = { complete_date: null, days_taken: t.days, status: t.status, completion_percent: t.completion, overdue_status: t.overdue }
    }
    setBusy(true)
    const { data, error } = await createClient().from(STAGE_CONFIG[stageId].table).update(patch).eq('id', entry.id).select('id')
    setBusy(false)
    if (error || !data?.length) { alert('Could not reopen: ' + (error?.message || 'no permission')); return }
    triggerPush()
    router.refresh()
  }

  return (
    <button type="button" onClick={reopen} disabled={busy} title="Reopen: move back to Pending" aria-label="Reopen" className="p-1.5 hover:bg-amber-50 rounded-md transition text-amber-600 disabled:opacity-50">
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
    </button>
  )
}

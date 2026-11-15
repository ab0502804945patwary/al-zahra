'use client'
import { useRef, useState } from 'react'
import { Loader2, Lock, Trash2, X } from 'lucide-react'

/**
 * Asks for the master password, then deletes through /api/delete.
 * Usage: const { askDelete, dialog } = useSecureDelete(); ... await askDelete('companies', id, 'this company')
 * Render {dialog} once in the component. Resolves true when the record was deleted.
 */
export function useSecureDelete() {
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [label, setLabel] = useState('')
  const job = useRef<{ table: string; id: string; resolve: (ok: boolean) => void } | null>(null)

  function askDelete(table: string, id: string, what = 'this record') {
    return new Promise<boolean>(resolve => {
      job.current = { table, id, resolve }
      setLabel(what)
      setPw('')
      setErr('')
      setOpen(true)
    })
  }

  function cancel() {
    job.current?.resolve(false)
    job.current = null
    setOpen(false)
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault()
    if (!job.current) return
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: job.current.table, id: job.current.id, password: pw }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(data.error || 'Could not delete.'); setBusy(false); return }
      job.current.resolve(true)
      job.current = null
      setOpen(false)
    } catch {
      setErr('Cannot reach the server.')
    }
    setBusy(false)
  }

  const dialog = open ? (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={confirm} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center"><Trash2 className="w-4 h-4 text-rose-600" /></div>
            <div>
              <div className="text-sm font-bold text-slate-900">Confirm delete</div>
              <div className="text-[11px] text-slate-500">Enter the master password to delete {label}. This cannot be undone.</div>
            </div>
          </div>
          <button type="button" onClick={cancel} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Master password"
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        {err && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{err}</div>}
        <div className="flex gap-2">
          <button type="button" onClick={cancel} className="flex-1 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={busy || !pw} className="flex-1 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-lg flex items-center justify-center gap-1.5">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
          </button>
        </div>
      </form>
    </div>
  ) : null

  return { askDelete, dialog }
}

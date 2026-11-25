'use client'
import { useRef, useState } from 'react'
import { Upload, Loader2, FileText, Image as ImageIcon, X } from 'lucide-react'
import { uploadToR2, openFromR2, removeFromR2, kb, type StoredFile } from '@/lib/compress'

export type DossierFile = StoredFile

/** Electronic dossier of a workflow record: upload files straight from the computer or phone (replaces the Google Drive link). */
export default function DossierFiles({ value, onChange, folder, required = false, label = 'Electronic Dossier (upload files)' }: { value: DossierFile[]; onChange: (v: DossierFile[]) => void; folder: string; required?: boolean; label?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const files = Array.isArray(value) ? value : []

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || [])
    e.target.value = ''
    if (!list.length) return
    setMsg('')
    setBusy(true)
    const added: DossierFile[] = []
    for (const f of list) {
      try { added.push(await uploadToR2(f, folder)) } catch (err: any) { setMsg(err?.message || 'Upload failed.') }
    }
    setBusy(false)
    if (added.length) onChange([...files, ...added])
  }

  async function open(f: DossierFile) {
    setMsg('')
    try { await openFromR2(f.key) } catch (err: any) { setMsg(err?.message || 'Could not open the file.') }
  }

  async function remove(f: DossierFile) {
    if (!confirm(`Remove "${f.name}"?`)) return
    setMsg('')
    try { await removeFromR2(f.key) } catch (err: any) { setMsg(err?.message || 'Could not remove the file.'); return }
    onChange(files.filter(x => x.key !== f.key))
  }

  return (
    <div>
      <label className="text-xs font-medium text-slate-700 mb-1 block">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
      <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={pick} />
      <button type="button" onClick={() => ref.current?.click()} disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-blue-700 border border-dashed border-blue-300 bg-blue-50/60 rounded-lg hover:bg-blue-50 disabled:opacity-60">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Choose files (JPG, PNG, PDF · pictures are made small automatically · PDF max 5 MB)
      </button>
      {msg && <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{msg}</div>}
      {files.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
          {files.map(f => (
            <li key={f.key} className="flex items-center gap-2 px-3 py-1.5 text-xs">
              {f.type === 'application/pdf' ? <FileText className="w-4 h-4 text-rose-500 shrink-0" /> : <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />}
              <button type="button" onClick={() => open(f)} className="flex-1 text-left truncate text-blue-700 hover:underline">{f.name}</button>
              <span className="text-slate-400 shrink-0">{kb(f.size)}</span>
              <button type="button" onClick={() => remove(f)} title="Remove" className="text-slate-400 hover:text-rose-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

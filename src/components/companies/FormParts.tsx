'use client'
import { uploadToR2, openFromR2, kb, type StoredFile } from '@/lib/compress'
import { useRef, useState } from 'react'
import { Copy, ExternalLink, FileText, Link2, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CountrySelect from '@/components/ui/CountrySelect'

const inputCls = 'w-full px-2.5 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-slate-400'
const labelCls = 'block text-[11px] font-semibold text-slate-600 mb-0.5'

// ---------- 02 Shareholders / partners (as many as needed) ----------
export const SH_DOCS: { key: string; label: string }[] = [
  { key: 'signature', label: 'Signature' },
  { key: 'photo', label: 'Photo' },
  { key: 'passport_copy', label: 'Passport Copy' },
  { key: 'nid_copy', label: 'NID Copy' },
]

const CUSTOM = '__custom'
const DESIGNATIONS = ['General Manager (GM)', 'Chief Executive Officer (CEO)', 'Chairman of the Board / Board Director']

export interface Shareholder {
  name: string; address: string; father_name: string; mother_name: string; dob: string; nationality: string
  passport_no: string; tin_no: string; email: string; phone: string; designation: string; share_percent: string
  docs: Record<string, 'Collected' | 'Pending' | ''>
  passport_file?: StoredFile | null // scanned passport kept in R2; missing on records saved before it was required
  doc_files?: Record<string, StoredFile | null> // signature, photo, NID copy: asked when Bangladesh Company is ticked
}

export const blankShareholder = (): Shareholder => ({
  name: '', address: '', father_name: '', mother_name: '', dob: '', nationality: '', passport_no: '', tin_no: '',
  email: '', phone: '', designation: '', share_percent: '', docs: {},
})

export const isBlankShareholder = (s: Shareholder) =>
  !Object.entries(s).some(([k, v]) => (k === 'docs' || k === 'doc_files' ? Object.values((v || {}) as object).some(Boolean) : String(v || '').trim() !== ''))

/** The uploaded file of one document; the passport has its own older field */
export const shareholderFile = (s: Shareholder, key: string) => (key === 'passport_copy' ? s.passport_file : s.doc_files?.[key]) || null

/** Shareholder cards that miss a required file. Every card on screen counts, also an empty one (remove it if not needed).
 *  The passport is always required; with allDocs, every document in SH_DOCS is. */
export const missingShareholderFiles = (list: Shareholder[], allDocs: boolean) =>
  list.map((s, i) => ({
    i,
    labels: SH_DOCS.filter(d => (allDocs || d.key === 'passport_copy') && !shareholderFile(s, d.key)?.key).map(d => d.label),
  })).filter(x => x.labels.length)

/** One scanned document of a shareholder: upload, view, replace, remove. The old file is deleted from storage only after the company is saved. */
function DocUpload({ what, file, required, invalid, busy, error, onPick, onRemove }: {
  what: string; file?: StoredFile | null; required: boolean; invalid: boolean; busy: boolean; error: string
  onPick: (f: File) => void; onRemove: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [openError, setOpenError] = useState('')
  const link = 'text-[10px] font-semibold hover:underline disabled:opacity-60'

  async function view() {
    if (!file) return
    setOpenError('')
    try { await openFromR2(file.key) } catch (e: any) { setOpenError(e?.message || 'Could not open the file.') }
  }

  return (
    <div className="mt-1.5">
      <input ref={ref} type="file" accept={ACCEPT} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { setOpenError(''); onPick(f) } }} />
      {file ? (
        <div className="bg-white border border-emerald-200 rounded-md px-2 py-1.5">
          <button type="button" onClick={view} title={file.name} className="w-full flex items-center gap-1.5 text-[11px] text-blue-700 hover:underline">
            <FileText className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{file.name}</span><span className="text-slate-400 shrink-0">{kb(file.size)}</span>
          </button>
          <div className="flex items-center gap-3 mt-1">
            <button type="button" onClick={view} className={`${link} text-blue-700`}>View</button>
            <button type="button" onClick={() => ref.current?.click()} disabled={busy} className={`${link} text-slate-600`}>{busy ? 'Uploading...' : 'Replace'}</button>
            <button type="button" onClick={onRemove} disabled={busy} className={`${link} text-rose-600`}>Remove</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} title="JPG, PNG, WebP or PDF. PDF max 5 MB."
          className={`w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold border border-dashed rounded-md disabled:opacity-60 ${invalid ? 'text-rose-700 border-rose-400 bg-rose-50' : 'text-blue-700 border-blue-300 bg-blue-50/60 hover:bg-blue-50'}`}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} {busy ? 'Uploading...' : `Upload ${what}`}
          {required && !busy && <span className="text-rose-500">*</span>}
        </button>
      )}
      {invalid && !file && <div className="mt-1 text-[10px] font-semibold text-rose-600">This upload is required.</div>}
      {(error || openError) && <div className="mt-1 text-[10px] text-rose-700">{error || openError}</div>}
    </div>
  )
}

function ShareholderCard({ index, total, value, onChange, onDuplicate, onRemove, locked, allDocs, upload }: {
  index: number; total: number; value: Shareholder; onChange: (s: Shareholder) => void
  onDuplicate: () => void; onRemove: () => void
  locked: boolean; allDocs: boolean; upload: (docKey: string) => React.ReactNode
}) {
  const set = (k: keyof Shareholder, v: string) => onChange({ ...value, [k]: v })
  // Every shareholder card must be filled in, except TIN No. and E-mail
  const must = true
  // a designation that is not in the list is shown in its own box
  const [typingOwn, setTypingOwn] = useState(false)
  const custom = value.designation ? !DESIGNATIONS.includes(value.designation) : typingOwn
  const star = <span className="text-rose-500 ml-0.5">*</span>
  const text = (label: string, k: keyof Shareholder, type = 'text', placeholder = '', required = must) => (
    <div>
      <label className={labelCls}>{label}{required && star}</label>
      <input type={type} required={required} value={(value[k] as string) || ''} onChange={e => set(k, e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  )
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 uppercase">Shareholder {index + 1}</span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onDuplicate} disabled={locked} title="Copy this shareholder into a new one (the passport file is not copied)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60">
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
          {total > 1 && (
            <button type="button" onClick={onRemove} disabled={locked} title="Remove this shareholder"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 disabled:opacity-60">
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-2.5 gap-y-2">
        {text('Name', 'name')}
        {text("Father's Name", 'father_name')}
        {text("Mother's Name", 'mother_name')}
        {text('Date of Birth', 'dob', 'date')}
        <div>
          <label className={labelCls}>Nationality{must && star}</label>
          <CountrySelect compact required={must} value={value.nationality} onChange={v => set('nationality', v)} />
        </div>
        {text('Passport No.', 'passport_no')}
        {text('TIN No.', 'tin_no', 'text', '', false)}
        {text('E-mail', 'email', 'email', '', false)}
        {text('Phone', 'phone')}
        <div>
          <label className={labelCls}>Designation{must && star}</label>
          <select required={must && !custom} value={custom ? CUSTOM : value.designation || ''}
            onChange={e => { const v = e.target.value; setTypingOwn(v === CUSTOM); set('designation', v === CUSTOM ? '' : v) }} className={inputCls}>
            <option value="">Select designation</option>
            {DESIGNATIONS.map(o => <option key={o} value={o}>{o}</option>)}
            <option value={CUSTOM}>Custom (write yourself)</option>
          </select>
          {custom && <input required={must} autoFocus={typingOwn} value={value.designation || ''} onChange={e => set('designation', e.target.value)} placeholder="Write designation" aria-label="Custom designation" className={`${inputCls} mt-1`} />}
        </div>
        {text('Shareholding %', 'share_percent', 'number', 'e.g. 50')}
        <div className="col-span-2 md:col-span-4 xl:col-span-6">
          <label className={labelCls}>Address{must && star}</label>
          <input required={must} value={value.address} onChange={e => set('address', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-2.5">
        <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">Documents{allDocs && <span className="ml-1.5 normal-case tracking-normal font-semibold text-rose-600">All four files are required (Bangladesh Company)</span>}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-start">
          {SH_DOCS.map(d => (
            <div key={d.key} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
              <div className="text-[11px] font-semibold text-slate-700 mb-1">{d.label}{allDocs && star}</div>
              {!allDocs && <div className="flex gap-1">
                {(['Collected', 'Pending'] as const).map(st => {
                  const on = value.docs?.[d.key] === st
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onChange({ ...value, docs: { ...value.docs, [d.key]: on ? '' : st } })}
                      className={`flex-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border transition ${on
                        ? (st === 'Collected' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-amber-500 text-white border-amber-500')
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      {st}
                    </button>
                  )
                })}
              </div>}
              {(allDocs || d.key === 'passport_copy') && upload(d.key)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** One card by default. "Add shareholder" adds a blank one, "Duplicate" copies a card. No limit. */
export function ShareholdersEditor({ value, onChange, folder, allDocs = false, showMissing, onUploading, onUploaded }: {
  value: Shareholder[]; onChange: (v: Shareholder[]) => void
  folder: string
  /** Bangladesh Company is ticked: every document needs its file */
  allDocs?: boolean
  /** true after a save was refused: missing files are marked */
  showMissing: boolean
  onUploading: (delta: 1 | -1) => void
  onUploaded: (key: string) => void
}) {
  const list = value.length ? value : [blankShareholder()]
  // an upload takes a while: apply its result to the newest list so typing done meanwhile is kept
  const latest = useRef(list)
  latest.current = list
  // keys are "card:document"
  const [busy, setBusy] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  // cards are matched by position, so no adding / copying / removing while a file is on its way
  const locked = busy.length > 0
  const missing = missingShareholderFiles(list, allDocs)

  // a file also marks the document as Collected, which other screens show
  const setFile = (i: number, docKey: string, file: StoredFile | null) => {
    latest.current = latest.current.map((x, k) => (k !== i ? x : {
      ...x,
      ...(docKey === 'passport_copy' ? { passport_file: file } : { doc_files: { ...x.doc_files, [docKey]: file } }),
      docs: { ...x.docs, [docKey]: file ? 'Collected' as const : '' as const },
    }))
    onChange(latest.current)
  }

  async function uploadFile(i: number, docKey: string, file: File) {
    const id = `${i}:${docKey}`
    setErrors(p => ({ ...p, [id]: '' }))
    setBusy(b => [...b, id])
    onUploading(1)
    try {
      const saved = await uploadToR2(file, folder || 'unassigned')
      onUploaded(saved.key)
      setFile(i, docKey, saved)
    } catch (e: any) {
      setErrors(p => ({ ...p, [id]: e?.message || 'Upload failed.' }))
    }
    setBusy(b => b.filter(k => k !== id))
    onUploading(-1)
  }
  const update = (i: number, s: Shareholder) => onChange(list.map((x, k) => (k === i ? s : x)))
  const total = list.reduce((a, s) => a + (parseFloat(s.share_percent) || 0), 0)

  return (
    <div className="col-span-2 lg:col-span-12 space-y-3">
      {list.map((s, i) => (
        <ShareholderCard
          key={i}
          index={i}
          total={list.length}
          value={s}
          onChange={x => update(i, x)}
          onDuplicate={() => { setErrors({}); onChange([...list.slice(0, i + 1), { ...s, docs: Object.fromEntries(Object.entries(s.docs || {}).filter(([k]) => !shareholderFile(s, k))), passport_file: null, doc_files: {} }, ...list.slice(i + 1)]) }}
          onRemove={() => { setErrors({}); onChange(list.filter((_, k) => k !== i)) }}
          locked={locked}
          allDocs={allDocs}
          upload={docKey => {
            const label = SH_DOCS.find(d => d.key === docKey)!.label
            const file = shareholderFile(s, docKey)
            return (
              <DocUpload
                what={docKey === 'passport_copy' ? 'passport' : label}
                file={file}
                required
                invalid={showMissing && !!missing.find(m => m.i === i)?.labels.includes(label)}
                busy={busy.includes(`${i}:${docKey}`)}
                error={errors[`${i}:${docKey}`] || ''}
                onPick={f => uploadFile(i, docKey, f)}
                onRemove={() => { if (confirm(`Remove "${file?.name}"?`)) setFile(i, docKey, null) }}
              />
            )
          }}
        />
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => onChange([...list, blankShareholder()])} disabled={locked}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-60">
          <Plus className="w-3.5 h-3.5" /> Add shareholder ({list.length})
        </button>
        <span className={`text-[11px] font-medium ${total > 100 ? 'text-rose-600' : 'text-slate-500'}`}>
          Total shareholding: {total}%{total > 100 ? ' — more than 100%' : ''}
        </span>
      </div>
    </div>
  )
}

// ---------- 04 Internal document verification ----------
export const VERIFY_ITEMS: { key: string; label: string }[] = [
  { key: 'signature', label: 'Shareholder signature' },
  { key: 'photo', label: 'Passport-size photograph' },
  { key: 'passport_copy', label: 'Passport copy' },
  { key: 'nid_copy', label: 'NID copy' },
  { key: 'other', label: 'Other supporting documents' },
]

export interface DocCheck { status?: 'Received' | 'Pending' | ''; remarks?: string }
export interface CompanyDoc { id: string; type: string; shareholder: number | null; name: string; path?: string; url?: string; store?: 'r2'; added_at: string }

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'
const MAX_BYTES = 5 * 1024 * 1024

export function DocumentVerification({ checks, onChecks, docs, onDocs, folder, shareholderNames }: {
  checks: Record<string, DocCheck>; onChecks: (c: Record<string, DocCheck>) => void
  docs: CompanyDoc[]; onDocs: (d: CompanyDoc[]) => void
  folder: string; shareholderNames: string[]
}) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState('signature')
  const [holder, setHolder] = useState(0)
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const perHolder = type !== 'other'

  const setCheck = (k: string, patch: DocCheck) => onChecks({ ...checks, [k]: { ...checks[k], ...patch } })
  const labelOf = (t: string) => VERIFY_ITEMS.find(v => v.key === t)?.label || t
  const holderLabel = (i: number | null) => (i === null ? '' : ` · Shareholder ${i + 1}${shareholderNames[i] ? ` (${shareholderNames[i]})` : ''}`)

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMsg('')
    if (!ACCEPT.split(',').includes(file.type)) { setMsg('Only JPG, PNG, WebP images or PDF files are allowed.'); return }
    
    setBusy(true)
    try {
      const saved = await uploadToR2(file, folder || 'unassigned')
      onDocs([...docs, { id: `${Date.now()}`, type, shareholder: perHolder ? holder : null, name: saved.name, path: saved.key, store: 'r2', added_at: saved.added_at }])
    } catch (err: any) {
      setBusy(false)
      setMsg('Upload failed: ' + (err?.message || 'unknown error'))
      return
    }
    setBusy(false)
    if (!checks[type]?.status) setCheck(type, { status: 'Received' })
  }

  function addLink() {
    const url = link.trim()
    setMsg('')
    if (!/^https?:\/\/\S+$/i.test(url)) { setMsg('Paste a full link starting with http:// or https://'); return }
    onDocs([...docs, { id: `${Date.now()}`, type, shareholder: perHolder ? holder : null, name: url.replace(/^https?:\/\//i, '').slice(0, 60), url, added_at: new Date().toISOString() }])
    if (!checks[type]?.status) setCheck(type, { status: 'Received' })
    setLink('')
  }

  async function open(d: CompanyDoc) {
    if (d.url) { window.open(d.url, '_blank', 'noopener'); return }
    if (!d.path) return
    if (d.store === 'r2') {
      const res = await fetch('/api/r2/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'download', key: d.path }) })
      const out = await res.json().catch(() => ({} as any))
      if (!res.ok || !out.url) { setMsg('Could not open the file: ' + (out.error || 'unknown error')); return }
      window.open(out.url, '_blank', 'noopener')
      return
    }
    const { data, error } = await supabase.storage.from('company-docs').createSignedUrl(d.path, 3600)
    if (error || !data) { setMsg('Could not open the file: ' + (error?.message || 'unknown error')); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function remove(d: CompanyDoc) {
    if (d.path && d.store === 'r2') {
      const res = await fetch('/api/r2/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', key: d.path }) })
      if (!res.ok) { const out = await res.json().catch(() => ({} as any)); setMsg('Could not remove the file: ' + (out.error || 'unknown error')); return }
    } else if (d.path) await supabase.storage.from('company-docs').remove([d.path])
    onDocs(docs.filter(x => x.id !== d.id))
  }

  return (
    <div className="col-span-2 lg:col-span-12 space-y-4">
      {/* checklist */}
      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wide text-[10px] font-bold">
              <th className="text-left px-3 py-2">Document / Item</th>
              <th className="px-3 py-2 w-20">Received</th>
              <th className="px-3 py-2 w-20">Pending</th>
              <th className="text-left px-3 py-2">Remarks</th>
              <th className="text-left px-3 py-2 w-24">Files</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {VERIFY_ITEMS.map(it => {
              const c = checks[it.key] || {}
              const count = docs.filter(d => d.type === it.key).length
              return (
                <tr key={it.key}>
                  <td className="px-3 py-2 font-medium text-slate-800">{it.label}</td>
                  {(['Received', 'Pending'] as const).map(st => (
                    <td key={st} className="px-3 py-2 text-center">
                      <input type="radio" name={`chk_${it.key}`} checked={c.status === st} onChange={() => setCheck(it.key, { status: st })} className="accent-blue-600 w-4 h-4" />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <input value={c.remarks || ''} onChange={e => setCheck(it.key, { remarks: e.target.value })} placeholder="Remarks" className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </td>
                  <td className="px-3 py-2 text-slate-500">{count ? `${count} attached` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* add a file or a link: first choose which document it is */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Attach a file or link</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>1. Which document is it?</label>
            <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
              {VERIFY_ITEMS.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
            </select>
          </div>
          {perHolder && (
            <div>
              <label className={labelCls}>Whose document?</label>
              <select value={holder} onChange={e => setHolder(Number(e.target.value))} className={inputCls}>
                {(shareholderNames.length ? shareholderNames : ['']).map((n, i) => <option key={i} value={i}>Shareholder {i + 1}{n ? ` — ${n}` : ''}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>2. Upload an image or PDF</label>
            <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={upload} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-blue-700 border border-dashed border-blue-300 bg-blue-50/60 rounded-lg hover:bg-blue-50 disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Choose file (JPG, PNG, PDF · pictures are made small automatically · PDF max 5 MB)
            </button>
          </div>
          <div>
            <label className={labelCls}>or paste a link (URL)</label>
            <div className="flex gap-2">
              <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className={inputCls} />
              <button type="button" onClick={addLink} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
                <Link2 className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>
        {msg && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{msg}</div>}

        {docs.length > 0 && (
          <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {docs.map(d => (
              <li key={d.id} className="flex items-center gap-3 px-3 py-2">
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 truncate">{labelOf(d.type)}{holderLabel(d.shareholder)}</div>
                  <div className="text-[11px] text-slate-500 truncate">{d.name}</div>
                </div>
                <button type="button" onClick={() => open(d)} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-md">
                  <ExternalLink className="w-3 h-3" /> Open
                </button>
                <button type="button" onClick={() => remove(d)} title="Remove" className="p-1 text-slate-400 hover:text-rose-600">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] text-slate-400">Files are private. They open with a link that stops working after one hour.</p>
      </div>
    </div>
  )
}

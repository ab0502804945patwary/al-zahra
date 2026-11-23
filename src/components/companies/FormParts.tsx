'use client'
import { useRef, useState } from 'react'
import { Copy, ExternalLink, FileText, Link2, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CountrySelect from '@/components/ui/CountrySelect'

const inputCls = 'w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-slate-400'
const labelCls = 'block text-xs font-semibold text-slate-700 mb-1'

// ---------- 02 Shareholders / partners (up to 5) ----------
export const MAX_SHAREHOLDERS = 5
export const SH_DOCS: { key: string; label: string }[] = [
  { key: 'signature', label: 'Signature' },
  { key: 'photo', label: 'Photo' },
  { key: 'passport_copy', label: 'Passport Copy' },
  { key: 'nid_copy', label: 'NID Copy' },
]

export interface Shareholder {
  name: string; address: string; father_name: string; mother_name: string; dob: string; nationality: string
  passport_no: string; tin_no: string; email: string; phone: string; designation: string; share_percent: string
  docs: Record<string, 'Collected' | 'Pending' | ''>
}

export const blankShareholder = (): Shareholder => ({
  name: '', address: '', father_name: '', mother_name: '', dob: '', nationality: '', passport_no: '', tin_no: '',
  email: '', phone: '', designation: '', share_percent: '', docs: {},
})

export const isBlankShareholder = (s: Shareholder) =>
  !Object.entries(s).some(([k, v]) => (k === 'docs' ? Object.values(v as object).some(Boolean) : String(v || '').trim() !== ''))

function ShareholderCard({ index, total, value, onChange, onDuplicate, onRemove, canAdd }: {
  index: number; total: number; value: Shareholder; onChange: (s: Shareholder) => void
  onDuplicate: () => void; onRemove: () => void; canAdd: boolean
}) {
  const set = (k: keyof Shareholder, v: string) => onChange({ ...value, [k]: v })
  const text = (label: string, k: keyof Shareholder, type = 'text', placeholder = '') => (
    <div>
      <label className={labelCls}>{label}</label>
      <input type={type} value={(value[k] as string) || ''} onChange={e => set(k, e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  )
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 uppercase">Shareholder {index + 1}</span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onDuplicate} disabled={!canAdd} title={canAdd ? 'Copy this shareholder into a new one' : `Up to ${MAX_SHAREHOLDERS} shareholders`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
          {total > 1 && (
            <button type="button" onClick={onRemove} title="Remove this shareholder"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50">
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {text('Name', 'name')}
        {text("Father's Name", 'father_name')}
        {text("Mother's Name", 'mother_name')}
        {text('Date of Birth', 'dob', 'date')}
        <div>
          <label className={labelCls}>Nationality</label>
          <CountrySelect value={value.nationality} onChange={v => set('nationality', v)} />
        </div>
        {text('Passport No.', 'passport_no')}
        {text('TIN No.', 'tin_no')}
        {text('E-mail', 'email', 'email')}
        {text('Phone', 'phone')}
        {text('Designation', 'designation')}
        {text('Shareholding %', 'share_percent', 'number', 'e.g. 50')}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className={labelCls}>Address</label>
          <input value={value.address} onChange={e => set('address', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">Documents</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {SH_DOCS.map(d => (
            <div key={d.key} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <div className="text-xs font-semibold text-slate-700 mb-1.5">{d.label}</div>
              <div className="flex gap-1">
                {(['Collected', 'Pending'] as const).map(st => {
                  const on = value.docs?.[d.key] === st
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onChange({ ...value, docs: { ...value.docs, [d.key]: on ? '' : st } })}
                      className={`flex-1 px-2 py-1 text-[11px] font-semibold rounded-md border transition ${on
                        ? (st === 'Collected' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-amber-500 text-white border-amber-500')
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      {st}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** One card by default. "Add shareholder" adds a blank one, "Duplicate" copies a card. Up to five. */
export function ShareholdersEditor({ value, onChange }: { value: Shareholder[]; onChange: (v: Shareholder[]) => void }) {
  const list = value.length ? value : [blankShareholder()]
  const canAdd = list.length < MAX_SHAREHOLDERS
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
          canAdd={canAdd}
          onDuplicate={() => onChange([...list.slice(0, i + 1), { ...s, docs: { ...s.docs } }, ...list.slice(i + 1)])}
          onRemove={() => onChange(list.filter((_, k) => k !== i))}
        />
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => onChange([...list, blankShareholder()])} disabled={!canAdd}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed">
          <Plus className="w-3.5 h-3.5" /> Add shareholder ({list.length}/{MAX_SHAREHOLDERS})
        </button>
        <span className={`text-[11px] font-medium ${total > 100 ? 'text-rose-600' : 'text-slate-500'}`}>
          Total shareholding: {total}%{total > 100 ? ' — more than 100%' : ''}
        </span>
      </div>
      {!canAdd && <p className="text-[11px] text-slate-400">For more than five shareholders, attach an additional sheet using the same format.</p>}
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
export interface CompanyDoc { id: string; type: string; shareholder: number | null; name: string; path?: string; url?: string; added_at: string }

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'
const MAX_BYTES = 10 * 1024 * 1024

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
    if (file.size > MAX_BYTES) { setMsg('The file is larger than 10 MB.'); return }
    setBusy(true)
    const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_')
    const path = `${folder || 'unassigned'}/${Date.now()}_${safe}`
    const { error } = await supabase.storage.from('company-docs').upload(path, file, { contentType: file.type })
    setBusy(false)
    if (error) { setMsg('Upload failed: ' + error.message); return }
    onDocs([...docs, { id: `${Date.now()}`, type, shareholder: perHolder ? holder : null, name: file.name, path, added_at: new Date().toISOString() }])
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
    const { data, error } = await supabase.storage.from('company-docs').createSignedUrl(d.path, 3600)
    if (error || !data) { setMsg('Could not open the file: ' + (error?.message || 'unknown error')); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function remove(d: CompanyDoc) {
    if (d.path) await supabase.storage.from('company-docs').remove([d.path])
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
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Choose file (JPG, PNG, PDF · max 10 MB)
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

'use client'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, X, Loader2, Save, UploadCloud, Paperclip, Trash2, Check, Ban } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ComboInput from '@/components/ui/ComboInput'
import { matchesQuery } from '@/lib/search'
import {
  EXPENSE_CATEGORIES, PAYMENT_METHODS, EXPENSE_STATUSES, EXPENSE_CURRENCY,
  MAX_FILES, MAX_FILE_BYTES, ALLOWED_EXT,
} from '@/lib/expenseConfig'

interface Expense { id: string; expense_no: string; expense_date: string; category: string; payment_method: string; amount: number; reference_no?: string | null; notes?: string | null; status: string; attachments: { path: string; name: string; size: number }[] }

const inputCls = 'w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400'
const money = (n: number) => `${EXPENSE_CURRENCY} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0)}`
const tone = (s: string) => s === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : s === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
const today = () => new Date().toISOString().slice(0, 10)

function previewNumber(date: string, expenses: Expense[]) {
  const [y, m, d] = date.split('-')
  const prefix = `EXP${d}${m}${y.slice(2)}`
  const used = expenses.filter(e => e.expense_no.startsWith(prefix)).map(e => parseInt(e.expense_no.slice(-4), 10))
  return `${prefix}${String((used.length ? Math.max(...used) : 0) + 1).padStart(4, '0')}`
}

export default function ExpensesClient({ expenses }: { expenses: Expense[] }) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [form, setForm] = useState({ expense_date: today(), category: '', payment_method: '', amount: '', reference_no: '', notes: '' })
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // suggestions: categories already used (so a typed one is offered next time) plus the defaults
  const categoryOptions = useMemo(() => [...new Set([...expenses.map(e => e.category), ...EXPENSE_CATEGORIES])].sort((a, b) => a.localeCompare(b)), [expenses])
  const month = new Date().toISOString().slice(0, 7)
  const stats = useMemo(() => {
    const live = expenses.filter(e => e.status !== 'Rejected')
    return {
      thisMonth: live.filter(e => e.expense_date.startsWith(month)).reduce((s, e) => s + Number(e.amount), 0),
      total: live.reduce((s, e) => s + Number(e.amount), 0),
      pending: expenses.filter(e => e.status === 'Pending').length,
    }
  }, [expenses, month])

  function addFiles(list: FileList | null) {
    if (!list) return
    const next = [...files]
    for (const f of Array.from(list)) {
      const ext = f.name.split('.').pop()?.toLowerCase() || ''
      if (!ALLOWED_EXT.includes(ext) && !f.type.startsWith('image/')) { setError(`${f.name}: only photos, PDF or DOC files are allowed`); continue }
      if (f.size > MAX_FILE_BYTES) { setError(`${f.name}: file is bigger than 5MB`); continue }
      if (next.length >= MAX_FILES) { setError(`You can attach at most ${MAX_FILES} files`); break }
      next.push(f)
    }
    setFiles(next)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.category.trim()) return setError('Enter the category')
    if (!form.payment_method) return setError('Select a payment method')
    if (!(Number(form.amount) > 0)) return setError('Enter the amount')
    if (files.length === 0) return setError('Attach at least one file (bill or receipt)')
    setLoading(true)
    const folder = crypto.randomUUID()
    const uploaded: { path: string; name: string; size: number }[] = []
    for (const f of files) {
      const safe = f.name.replace(/[^\w.\-]+/g, '_')
      const path = `${folder}/${safe}`
      const { error: upErr } = await supabase.storage.from('expense-files').upload(path, f, { upsert: false, contentType: f.type || undefined })
      if (upErr) { setLoading(false); return setError(`Could not upload ${f.name}: ${upErr.message}`) }
      uploaded.push({ path, name: f.name, size: f.size })
    }
    const { error: err } = await supabase.rpc('create_expense', { p: { ...form, category: form.category.trim(), amount: Number(form.amount), attachments: uploaded } })
    setLoading(false)
    if (err) return setError(err.message)
    setAdding(false); setFiles([])
    setForm({ expense_date: today(), category: '', payment_method: '', amount: '', reference_no: '', notes: '' })
    router.refresh()
  }

  async function openFile(path: string) {
    const { data } = await supabase.storage.from('expense-files').createSignedUrl(path, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener')
  }
  async function setExpenseStatus(id: string, s: string) {
    await supabase.from('expenses').update({ status: s, updated_at: new Date().toISOString() }).eq('id', id)
    router.refresh()
  }

  const label = (t: string, required = true) => <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{t}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>

  if (adding) {
    return (
      <form onSubmit={save} className="w-full max-w-[900px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Add New Expense</h1>
          <button type="button" onClick={() => { setAdding(false); setError('') }} title="Back" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>{label('Expense Number')}<input readOnly value={previewNumber(form.expense_date || today(), expenses)} className={`${inputCls} bg-slate-50 font-mono font-bold text-blue-700`} /></div>
          <div>{label('Date')}<input type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} className={inputCls} /></div>
          <div>{label('Category')}<ComboInput value={form.category} onChange={v => set('category', v)} options={categoryOptions} className={inputCls} placeholder="Type a category or pick one" /></div>
          <div>{label(`Amount (${EXPENSE_CURRENCY})`)}<input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} className={inputCls} placeholder="0.00" /></div>
          <div>{label('Reference Number', false)}<input value={form.reference_no} onChange={e => set('reference_no', e.target.value)} className={inputCls} placeholder="Bill no, receipt no, etc." /></div>
          <div>{label('Payment Method')}<select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} className={inputCls}><option value="">Select Payment Method</option>{PAYMENT_METHODS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="sm:row-span-2">
            {label('Attachments')}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
              className="border-2 border-dashed border-slate-300 rounded-lg px-4 py-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition"
            >
              <UploadCloud className="w-8 h-8 mx-auto text-slate-400" />
              <div className="mt-1 text-sm"><span className="font-semibold text-blue-600">Upload files</span> <span className="text-slate-500">or drag and drop</span></div>
              <div className="text-[11px] text-slate-400 mt-0.5">Photos, PDF, DOC up to 5MB (max {MAX_FILES})</div>
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onClick={e => e.stopPropagation()} onChange={e => { setError(''); addFiles(e.target.files); e.target.value = '' }} />
            </div>
            {error && <p className="mt-2 text-[11px] font-medium text-rose-600">{error}</p>}
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={f.name + i} className="flex items-center justify-between gap-2 text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5">
                    <span className="truncate flex items-center gap-1.5"><Paperclip className="w-3 h-3 text-slate-400 shrink-0" />{f.name}</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="sm:col-span-2">{label('Notes', false)}<textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls} placeholder="Additional notes..." /></div>
        </div>
        {error && <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => { setAdding(false); setError('') }} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Expense
          </button>
        </div>
      </form>
    )
  }

  const filtered = expenses.filter((e, i) => (status === 'All' || e.status === status) && matchesQuery(search, expenses.length - i, [e.expense_no, e.category, e.payment_method, e.reference_no, e.notes, e.expense_date]))

  return (
    <div className="space-y-5 w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Expenses</h1>
          <p className="text-xs text-slate-500 mt-0.5">Record every expense with its bill or receipt ({EXPENSE_CURRENCY})</p>
        </div>
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"><Plus className="w-4 h-4" /> Add Expense</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[['This month', money(stats.thisMonth)], ['All time (not rejected)', money(stats.total)], ['Pending approval', String(stats.pending)]].map(([l, v]) => (
          <div key={l} className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm"><p className="text-xs font-medium text-slate-500">{l}</p><p className="text-xl font-bold text-slate-900 mt-1">{v}</p></div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search number, category, reference..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
          {['All', ...EXPENSE_STATUSES].map(s => <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-md transition ${status === s ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{s}</button>)}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
            <tr>{['Expense No.', 'Date', 'Category', 'Method', 'Amount', 'Reference', 'Files', 'Status', ''].map(h => <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(e => (
              <tr key={e.id} className="hover:bg-slate-50/70">
                <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{e.expense_no}</td>
                <td className="px-3 py-2.5 text-slate-600">{e.expense_date}</td>
                <td className="px-3 py-2.5 text-slate-800 font-medium">{e.category}</td>
                <td className="px-3 py-2.5 text-slate-600">{e.payment_method}</td>
                <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">{money(e.amount)}</td>
                <td className="px-3 py-2.5 text-slate-500">{e.reference_no || '—'}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">{(e.attachments || []).map((a, i) => <button key={a.path} onClick={() => openFile(a.path)} title={a.name} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] text-blue-600 hover:bg-blue-50"><Paperclip className="w-3 h-3" />{i + 1}</button>)}</div>
                </td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${tone(e.status)}`}>{e.status}</span></td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  {e.status !== 'Approved' && <button onClick={() => setExpenseStatus(e.id, 'Approved')} title="Approve" className="p-1.5 text-slate-400 hover:text-emerald-600"><Check className="w-4 h-4" /></button>}
                  {e.status !== 'Rejected' && <button onClick={() => setExpenseStatus(e.id, 'Rejected')} title="Reject" className="p-1.5 text-slate-400 hover:text-rose-600"><Ban className="w-4 h-4" /></button>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-14 text-slate-400">No expenses yet. Click “Add Expense”.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

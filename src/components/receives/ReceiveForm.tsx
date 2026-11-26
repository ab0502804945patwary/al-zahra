'use client'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Save, UploadCloud, Paperclip, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ComboInput from '@/components/ui/ComboInput'
import SearchSelect from '@/components/ui/SearchSelect'
import { bdt } from '@/lib/money'

interface OpenInvoice { id: string; invoice_no: string; customer_id: string; customer_name: string; phone: string; date: string; total: number; due: number }

const inputCls = 'w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-slate-400'
const ACCOUNT_TYPES = ['Cash', 'Bank Transfer', 'bKash', 'Nagad', 'Cheque', 'Other']
const EXT = ['png', 'jpg', 'jpeg', 'jfif', 'webp', 'heic', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx']
const today = () => new Date().toISOString().slice(0, 10)

function nextNumber(date: string, vouchers: any[]) {
  const [y, m, d] = date.split('-')
  const prefix = `RCV${d}${m}${y.slice(2)}`
  const used = vouchers.filter(v => String(v.voucher_no).startsWith(prefix)).map(v => parseInt(String(v.voucher_no).slice(-3), 10))
  return `${prefix}${String((used.length ? Math.max(...used) : 0) + 1).padStart(3, '0')}`
}

export default function ReceiveForm({ customers, openInvoices, vouchers, staffNames, me, usedAccounts, onClose }: { customers: any[]; openInvoices: OpenInvoice[]; vouchers: any[]; staffNames: string[]; me: string; usedAccounts: string[]; onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ receive_date: today(), customer_id: '', invoice_id: '', account_type: '', account_name: '', status: 'Completed', amount: '', reference_no: '', received_by: staffNames.includes(me) ? me : '', notes: '' })
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // what the customer still owes, and what is left on the chosen invoice
  const customerInvoices = useMemo(() => openInvoices.filter(i => !form.customer_id || i.customer_id === form.customer_id), [openInvoices, form.customer_id])
  const customerDue = useMemo(() => form.customer_id ? openInvoices.filter(i => i.customer_id === form.customer_id).reduce((s, i) => s + i.due, 0) : 0, [openInvoices, form.customer_id])
  const invoice = openInvoices.find(i => i.id === form.invoice_id)
  const maxReceivable = invoice ? invoice.due : customerDue
  const amount = Number(form.amount) || 0
  const left = Math.max(maxReceivable - amount, 0)

  function pickCustomer(id: string) { setForm(p => ({ ...p, customer_id: id, invoice_id: '', amount: '' })) }
  function pickInvoice(id: string) {
    const inv = openInvoices.find(i => i.id === id)
    setForm(p => ({ ...p, invoice_id: id, customer_id: inv ? inv.customer_id : p.customer_id, amount: '' }))
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const next = [...files]
    for (const f of Array.from(list)) {
      const ext = f.name.split('.').pop()?.toLowerCase() || ''
      if (!EXT.includes(ext) && !f.type.startsWith('image/')) { setError(`${f.name}: only photos, PDF, DOC or XLS files are allowed`); continue }
      if (f.size > 5 * 1024 * 1024) { setError(`${f.name}: file is bigger than 5MB`); continue }
      if (next.length >= 5) { setError('You can attach at most 5 files'); break }
      next.push(f)
    }
    setFiles(next)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.customer_id && !form.invoice_id) return setError('Select a customer or an invoice')
    if (!form.account_type) return setError('Select the account type')
    if (!(amount > 0)) return setError('Enter the amount')
    if (amount > maxReceivable + 0.004) return setError(`The amount is more than what is due (max ${bdt(maxReceivable)})`)
    if (files.length === 0) return setError('Attach at least one file (receipt or slip)')
    setLoading(true)
    const folder = crypto.randomUUID()
    const uploaded: { path: string; name: string; size: number }[] = []
    for (const f of files) {
      const path = `${folder}/${f.name.replace(/[^\w.\-]+/g, '_')}`
      const { error: upErr } = await supabase.storage.from('receive-files').upload(path, f, { upsert: false, contentType: f.type || undefined })
      if (upErr) { setLoading(false); return setError(`Could not upload ${f.name}: ${upErr.message}`) }
      uploaded.push({ path, name: f.name, size: f.size })
    }
    const { error: err } = await supabase.rpc('create_receive', { p: { ...form, amount, attachments: uploaded } })
    setLoading(false)
    if (err) return setError(err.message)
    router.refresh()
    onClose()
  }

  const L = (t: string, req = false) => <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{t}{req && <span className="text-rose-500 ml-0.5">*</span>}</label>

  return (
    <form onSubmit={save} className="w-full max-w-[900px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Receive New Voucher</h1>
        <button type="button" onClick={onClose} title="Back" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>{L('Receive Number', true)}<input readOnly value={nextNumber(form.receive_date || today(), vouchers)} className={`${inputCls} bg-slate-50 font-mono font-bold text-blue-700`} /></div>
        <div>{L('Customer')}
          <SearchSelect
            value={form.customer_id}
            onChange={pickCustomer}
            placeholder="Select customer"
            emptyLabel="Select customer"
            className={inputCls}
            options={customers.map(c => ({ value: c.id, label: `${c.given_name} ${c.surname}`, hint: c.phone ? `(${c.phone})` : '', keywords: c.customer_code }))}
          />
          {form.customer_id && <p className={`text-[11px] mt-1 font-medium ${customerDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{customerDue > 0 ? `This customer owes ${bdt(customerDue)} in total` : 'This customer has nothing due'}</p>}
        </div>
        <div>{L('Receive Date', true)}<input type="date" value={form.receive_date} onChange={e => set('receive_date', e.target.value)} className={inputCls} /></div>
        <div>{L('Invoice (optional)')}
          <SearchSelect
            value={form.invoice_id}
            onChange={pickInvoice}
            placeholder="Select invoice"
            emptyLabel={form.customer_id ? 'All invoices (oldest first)' : 'Select invoice'}
            className={inputCls}
            options={customerInvoices.map(i => ({ value: i.id, label: i.invoice_no, hint: `(${i.phone || i.customer_name}) · due ${bdt(i.due)}`, keywords: `${i.customer_name} ${i.phone}` }))}
          />
        </div>
        <div>{L('Account Type', true)}
          <select value={form.account_type} onChange={e => set('account_type', e.target.value)} className={inputCls}><option value="">Select account type</option>{ACCOUNT_TYPES.map(a => <option key={a}>{a}</option>)}</select></div>
        <div>{L('Amount (৳)', true)}
          <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} className={inputCls} placeholder="0.00" />
          <p className="text-[11px] text-slate-500 mt-1">Max receivable: <b>{maxReceivable.toFixed(2)}</b>{amount > 0 && <> · due after this: <b className="text-rose-600">{left.toFixed(2)}</b></>}</p>
        </div>
        <div>{L('Account')}<ComboInput value={form.account_name} onChange={v => set('account_name', v)} options={usedAccounts} className={inputCls} placeholder="Bank / wallet name (optional)" /></div>
        <div>{L('Reference Number')}<input value={form.reference_no} onChange={e => set('reference_no', e.target.value)} className={inputCls} placeholder="Transaction ID, Receipt No, etc." /></div>
        <div>{L('Status', true)}
          <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}><option>Completed</option><option>Pending</option></select>
          {form.status === 'Pending' && <p className="text-[11px] text-amber-600 mt-1">Pending is saved but not taken off the due until you mark it received.</p>}
        </div>
        <div>{L('Received By')}
          <select value={form.received_by} onChange={e => set('received_by', e.target.value)} className={inputCls}><option value="">Select staff</option>{staffNames.map(s => <option key={s}>{s}</option>)}</select></div>

        <div className="sm:col-span-2">
          {L('Attachments', true)}
          <div onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
            className="border-2 border-dashed border-slate-300 rounded-lg px-4 py-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition">
            <UploadCloud className="w-8 h-8 mx-auto text-slate-400" />
            <div className="mt-1 text-sm"><span className="font-semibold text-blue-600">Upload files</span> <span className="text-slate-500">or drag and drop</span></div>
            <div className="text-[11px] text-slate-400 mt-0.5">Photos, PDF, DOC, XLS up to 5MB (max 5)</div>
            <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onClick={e => e.stopPropagation()} onChange={e => { setError(''); addFiles(e.target.files); e.target.value = '' }} />
          </div>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">{files.map((f, i) => (
              <li key={f.name + i} className="flex items-center justify-between gap-2 text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5">
                <span className="truncate flex items-center gap-1.5"><Paperclip className="w-3 h-3 text-slate-400 shrink-0" />{f.name}</span>
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </li>))}</ul>
          )}
        </div>
        <div className="sm:col-span-2">{L('Notes')}<textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls} placeholder="Additional notes about this payment..." /></div>
      </div>

      {error && <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Record Receive
        </button>
      </div>
    </form>
  )
}

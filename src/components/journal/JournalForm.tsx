'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { bdt } from '@/lib/money'

const TYPES = ['Adjustment', 'Commission Settlement', 'Donation Entry', 'Employee Settlement', 'Expense', 'Transfer', 'Opening Balance', 'General']
const METHOD_ACCOUNT: Record<string, string> = { Cash: 'Cash in Hand', Bank: 'Bank Account', 'Mobile Wallet': 'Mobile Wallet (bKash / Nagad)' }
const inp = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

interface Line { account_id: string; debit: string; credit: string }
const blank = (): Line => ({ account_id: '', debit: '', credit: '' })

export default function JournalForm({ accounts, balances, startAsSettlement, onClose }: { accounts: any[]; balances: any[]; startAsSettlement: boolean; onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)
  const [type, setType] = useState(startAsSettlement ? 'Employee Settlement' : 'General')
  const [status, setStatus] = useState('Posted')
  const [date, setDate] = useState(today)
  const [ref, setRef] = useState('')
  const [desc, setDesc] = useState('')
  const [lines, setLines] = useState<Line[]>([blank(), blank()])
  const [emp, setEmp] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Cash')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const settle = type === 'Employee Settlement'
  const pending = Number(balances.find(b => b.employee_name === emp)?.pending || 0)
  const acc = (name: string) => accounts.find(a => a.name === name)?.id || ''
  const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const balanced = Math.abs(debit - credit) < 0.005 && debit > 0
  const ymd = date.slice(8, 10) + date.slice(5, 7) + date.slice(2, 4)
  const voucherPreview = `${settle ? 'STL' : 'JV'}${ymd}xxxx`

  function pickEmployee(name: string) {
    setEmp(name)
    const p = Number(balances.find(b => b.employee_name === name)?.pending || 0)
    setAmount(p > 0 ? String(p) : '')
  }
  function generate() {
    const a = Number(amount)
    if (!emp) return setError('Select the employee')
    if (!(a > 0)) return setError('Enter the amount')
    if (a > pending + 0.004) return setError(`${emp} only has ${bdt(pending)} pending`)
    setError('')
    setDesc(`Cash settlement from ${emp}`)
    setLines([{ account_id: acc(METHOD_ACCOUNT[method]), debit: String(a), credit: '' }, { account_id: acc('Employee Receivable'), debit: '', credit: String(a) }])
  }
  const setLine = (i: number, patch: Partial<Line>) => setLines(ls => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)))

  async function save() {
    setError('')
    if (!desc.trim()) return setError('Enter the description')
    if (!balanced) return setError('Total debit and total credit must be equal')
    if (lines.some(l => !l.account_id && (Number(l.debit) || Number(l.credit)))) return setError('Every line needs an account')
    setBusy(true)
    const { error: err } = await supabase.rpc('create_journal', {
      p: {
        entry_type: type, status, description: desc, reference_no: ref, entry_date: date, employee_name: settle ? emp : '',
        lines: lines.filter(l => l.account_id).map(l => ({ account_id: l.account_id, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      },
    })
    setBusy(false)
    if (err) return setError(err.message)
    router.refresh()
    onClose()
  }

  return (
    <div className="space-y-5 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Journal Entry</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-slate-600">Voucher Number<input readOnly value={voucherPreview} className={inp + ' mt-1 bg-slate-50 font-mono text-slate-500'} /></label>
          <label className="text-xs font-semibold text-slate-600">Reference Number<input value={ref} onChange={e => setRef(e.target.value)} placeholder="Optional" className={inp + ' mt-1'} /></label>
          <label className="text-xs font-semibold text-slate-600">Entry Date *<input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp + ' mt-1'} /></label>
          <label className="text-xs font-semibold text-slate-600">Status
            <select value={status} onChange={e => setStatus(e.target.value)} className={inp + ' mt-1'}><option>Posted</option><option>Draft</option></select>
          </label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Entry Type *
            <select value={type} onChange={e => setType(e.target.value)} className={inp + ' mt-1'}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
          </label>
        </div>

        {settle && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <p className="text-xs font-bold text-blue-800">Employee Settlement</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-xs font-semibold text-slate-600">Employee *
                <select value={emp} onChange={e => pickEmployee(e.target.value)} className={inp + ' mt-1'}>
                  <option value="">Select employee</option>
                  {balances.map(b => <option key={b.employee_name} value={b.employee_name}>{b.employee_name} ({bdt(b.pending)})</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">Amount *<input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={inp + ' mt-1'} /></label>
              <label className="text-xs font-semibold text-slate-600">Payment Method
                <select value={method} onChange={e => setMethod(e.target.value)} className={inp + ' mt-1'}>{Object.keys(METHOD_ACCOUNT).map(m => <option key={m}>{m}</option>)}</select>
              </label>
            </div>
            {emp && <p className="text-[11px] text-blue-700">{emp} has pending receivable of {bdt(pending)}</p>}
            <button type="button" onClick={generate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg">Generate Lines</button>
          </div>
        )}

        <label className="text-xs font-semibold text-slate-600 block">Description *
          <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} className={inp + ' mt-1'} />
        </label>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500">Total Debit <b className="text-slate-900 font-mono">{bdt(debit)}</b></span>
          <span className="text-slate-500">Total Credit <b className="text-slate-900 font-mono">{bdt(credit)}</b></span>
          {balanced
            ? <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Balanced</span>
            : <span className="inline-flex items-center gap-1 text-amber-600 font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Difference {bdt(Math.abs(debit - credit))}</span>}
        </div>

        <div>
          <p className="text-xs font-bold text-slate-700 mb-2">Journal Lines</p>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs min-w-[560px]">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide"><tr>{['Account', 'Debit', 'Credit', 'Actions'].map(h => <th key={h} className="text-left font-semibold px-3 py-2">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5"><select value={l.account_id} onChange={e => setLine(i, { account_id: e.target.value })} className={inp}><option value="">Select account</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select></td>
                    <td className="px-2 py-1.5"><input type="number" min="0" step="0.01" value={l.debit} onChange={e => setLine(i, { debit: e.target.value, credit: e.target.value ? '' : l.credit })} className={inp} /></td>
                    <td className="px-2 py-1.5"><input type="number" min="0" step="0.01" value={l.credit} onChange={e => setLine(i, { credit: e.target.value, debit: e.target.value ? '' : l.debit })} className={inp} /></td>
                    <td className="px-2 py-1.5"><button type="button" disabled={lines.length <= 2} onClick={() => setLines(ls => ls.filter((_, k) => k !== i))} className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setLines(ls => [...ls, blank()])} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"><Plus className="w-3.5 h-3.5" /> Add Line</button>
        </div>

        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={save} disabled={busy || !balanced} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg">{busy ? 'Saving...' : 'Save Entry'}</button>
        </div>
      </div>
    </div>
  )
}

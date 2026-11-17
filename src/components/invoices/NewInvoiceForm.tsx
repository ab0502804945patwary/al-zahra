'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Save, Plus, Trash2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { bdt } from '@/lib/money'

interface Line { key: string; service_id: string | null; description: string; quantity: string; unit_price: string }

const inputCls = 'w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400'
const METHODS = ['Cash', 'Bank Transfer', 'bKash', 'Nagad', 'Cheque', 'Other']

export default function NewInvoiceForm({ customers, services, onClose }: { customers: any[]; services: any[]; onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [customerId, setCustomerId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [lines, setLines] = useState<Line[]>([])
  const [discount, setDiscount] = useState('')
  const [mode, setMode] = useState<'later' | 'partial' | 'full'>('later')
  const [partial, setPartial] = useState('')
  const [method, setMethod] = useState('Cash')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = useMemo(() => lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0), [lines])
  const disc = Number(discount) || 0
  const total = Math.max(subtotal - disc, 0)
  const payNow = mode === 'full' ? total : mode === 'partial' ? Number(partial) || 0 : 0

  const picked = (id: string) => lines.some(l => l.service_id === id)
  function toggleService(s: any) {
    setLines(prev => picked(s.id)
      ? prev.filter(l => l.service_id !== s.id)
      : [...prev, { key: `${s.id}-${Date.now()}`, service_id: s.id, description: s.name, quantity: '1', unit_price: String(s.price) }])
  }
  const updateLine = (key: string, patch: Partial<Line>) => setLines(prev => prev.map(l => (l.key === key ? { ...l, ...patch } : l)))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return setError('Select a customer')
    if (lines.length === 0) return setError('Select at least one service')
    if (lines.some(l => !l.description.trim() || !(Number(l.quantity) > 0) || l.unit_price === '' || Number(l.unit_price) < 0)) return setError('Check the service lines: name, quantity and price are required')
    if (disc < 0 || disc > subtotal) return setError('Discount cannot be more than the subtotal')
    if (mode === 'partial' && !(payNow > 0 && payNow < total)) return setError('Partial payment must be more than 0 and less than the total')
    setLoading(true)
    const { data, error: err } = await supabase.rpc('create_invoice', {
      p: {
        customer_id: customer.id,
        customer_name: `${customer.given_name} ${customer.surname}`,
        customer_phone: customer.phone,
        invoice_date: date,
        discount: disc,
        notes,
        initial_payment: payNow,
        method: payNow > 0 ? method : '',
        reference: payNow > 0 ? reference : '',
        items: lines.map(l => ({ service_id: l.service_id, description: l.description.trim(), quantity: Number(l.quantity), unit_price: Number(l.unit_price) })),
      },
    })
    setLoading(false)
    if (err) return setError(err.message)
    router.push(`/dashboard/invoices/${data}`)
    router.refresh()
  }

  const visibleServices = services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))

  return (
    <form onSubmit={submit} className="w-full max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Invoice</h1>
          <p className="text-xs text-slate-500">Choose the customer and services, then record the payment (or leave it for later).</p>
        </div>
        <button type="button" onClick={onClose} title="Back" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Customer<span className="text-rose-500 ml-0.5">*</span></label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={inputCls}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.customer_code} — {c.given_name} {c.surname}{c.phone ? ` (${c.phone})` : ''}</option>)}
              </select>
              {customers.length === 0 && <p className="text-[11px] text-amber-600 mt-1">No customers yet. Add one in Customers first.</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Invoice Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-800">Services (select one or more)</h3>
              <input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} placeholder="Search service..." className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" />
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {visibleServices.map(s => (
                <button key={s.id} type="button" onClick={() => toggleService(s)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${picked(s.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                  {picked(s.id) && <Check className="w-3.5 h-3.5" />}{s.name} <span className={picked(s.id) ? 'text-blue-100' : 'text-slate-400'}>· {bdt(s.price)}</span>
                </button>
              ))}
              {services.length === 0 && <p className="text-xs text-amber-600">No services yet. Add them in the Services page first.</p>}
            </div>

            {lines.length > 0 && (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs min-w-[560px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]"><tr>{['Service', 'Qty', 'Unit price', 'Total', ''].map(h => <th key={h} className="text-left font-semibold px-3 py-2">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map(l => (
                      <tr key={l.key}>
                        <td className="px-3 py-2"><input value={l.description} onChange={e => updateLine(l.key, { description: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs" /></td>
                        <td className="px-3 py-2 w-20"><input type="number" min="0.01" step="0.01" value={l.quantity} onChange={e => updateLine(l.key, { quantity: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs" /></td>
                        <td className="px-3 py-2 w-32"><input type="number" min="0" step="0.01" value={l.unit_price} onChange={e => updateLine(l.key, { unit_price: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs" /></td>
                        <td className="px-3 py-2 w-32 font-mono text-slate-800">{bdt((Number(l.quantity) || 0) * (Number(l.unit_price) || 0))}</td>
                        <td className="px-3 py-2 w-10"><button type="button" onClick={() => setLines(prev => prev.filter(x => x.key !== l.key))} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" onClick={() => setLines(prev => [...prev, { key: `c-${Date.now()}`, service_id: null, description: '', quantity: '1', unit_price: '' }])} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"><Plus className="w-3.5 h-3.5" /> Add a custom line</button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="Optional note printed on the invoice" />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Summary</h3>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-mono">{bdt(subtotal)}</span></div>
            <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Discount</span>
              <input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0.00" className="w-36 px-2 py-1.5 border border-slate-300 rounded-md text-sm text-right" /></div>
            <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-3"><span>Total</span><span className="font-mono">{bdt(total)}</span></div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Payment</h3>
            <div className="grid grid-cols-3 gap-2">
              {([['later', 'Pay Later'], ['partial', 'Partial'], ['full', 'Full']] as const).map(([k, label]) => (
                <button key={k} type="button" onClick={() => setMode(k)} className={`py-2 rounded-lg border text-xs font-semibold transition ${mode === k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>{label}</button>
              ))}
            </div>
            {mode === 'partial' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Amount received now (BDT)</label>
                <input type="number" min="0" step="0.01" value={partial} onChange={e => setPartial(e.target.value)} className={inputCls} placeholder="0.00" />
              </div>
            )}
            {payNow > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-700 mb-1.5 block">Method</label>
                  <select value={method} onChange={e => setMethod(e.target.value)} className={inputCls}>{METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-slate-700 mb-1.5 block">Reference</label>
                  <input value={reference} onChange={e => setReference(e.target.value)} className={inputCls} placeholder="Txn / cheque no." /></div>
              </div>
            )}
            <div className="text-xs text-slate-500 space-y-1 pt-1">
              <div className="flex justify-between"><span>Received now</span><span className="font-mono text-emerald-700">{bdt(payNow)}</span></div>
              <div className="flex justify-between"><span>Due after this</span><span className="font-mono text-rose-600">{bdt(Math.max(total - payNow, 0))}</span></div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="flex gap-3 pt-3 border-t border-slate-200">
        <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Create Invoice
        </button>
      </div>
    </form>
  )
}

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Loader2, Ban, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { bdt, payStatus, statusTone } from '@/lib/money'
import { INVOICE_COMPANY } from '@/lib/invoiceConfig'

const inputCls = 'w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const METHODS = ['Cash', 'Bank Transfer', 'bKash', 'Nagad', 'Cheque', 'Other']

export default function InvoiceView({ invoice, items, payments }: { invoice: any; items: any[]; payments: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const paid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const total = Number(invoice.total)
  const due = total - paid
  const cancelled = invoice.status === 'Cancelled'
  const st = payStatus(total, paid, cancelled)

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Cash')
  const [reference, setReference] = useState('')
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function addPayment(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const n = Number(amount)
    if (!(n > 0)) return setError('Enter the amount')
    if (n > due) return setError(`Amount is more than the due ${bdt(due)}`)
    setLoading(true)
    const { error: err } = await supabase.rpc('add_payment', { p_invoice: invoice.id, p_amount: n, p_method: method, p_reference: reference, p_paid_on: paidOn, p_note: '' })
    setLoading(false)
    if (err) return setError(err.message)
    setAmount(''); setReference('')
    router.refresh()
  }

  async function cancelInvoice() {
    if (!confirm('Cancel this invoice? It stays in the list as Cancelled and no more payments can be added.')) return
    await supabase.from('invoices').update({ status: 'Cancelled' }).eq('id', invoice.id)
    router.refresh()
  }

  return (
    <div className="w-full max-w-[1000px] mx-auto space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> All invoices</Link>
        <div className="flex gap-2">
          {!cancelled && <button onClick={cancelInvoice} className="inline-flex items-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-50"><Ban className="w-3.5 h-3.5" /> Cancel invoice</button>}
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"><Printer className="w-3.5 h-3.5" /> Print / PDF</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10 print:border-0 print:shadow-none print:p-0">
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <img src="/al_zahra_logo.svg" alt="AL ZAHRA" className="h-10 w-auto mb-2" />
            <div className="text-sm font-bold text-slate-900">{INVOICE_COMPANY.name}</div>
            {INVOICE_COMPANY.address && <div className="text-xs text-slate-500">{INVOICE_COMPANY.address}</div>}
            {(INVOICE_COMPANY.phone || INVOICE_COMPANY.email) && <div className="text-xs text-slate-500">{[INVOICE_COMPANY.phone, INVOICE_COMPANY.email].filter(Boolean).join(' · ')}</div>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">INVOICE</div>
            <div className="font-mono text-sm font-bold text-blue-700 mt-1">{invoice.invoice_no}</div>
            <div className="text-xs text-slate-500 mt-1">Date: {invoice.invoice_date}</div>
            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${statusTone(st)}`}>{st}</span>
          </div>
        </div>

        <div className="py-5">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Bill to</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">{invoice.customer_name}</div>
          {invoice.customer_phone && <div className="text-xs text-slate-500 font-mono">{invoice.customer_phone}</div>}
        </div>

        <table className="w-full text-sm">
          <thead><tr className="border-y border-slate-200 text-[11px] uppercase text-slate-500 tracking-wide">
            <th className="text-left py-2 font-semibold">Service</th><th className="text-right py-2 font-semibold w-16">Qty</th><th className="text-right py-2 font-semibold w-32">Unit price</th><th className="text-right py-2 font-semibold w-36">Amount</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(i => (
              <tr key={i.id}><td className="py-2.5 text-slate-800">{i.description}</td><td className="py-2.5 text-right text-slate-600">{Number(i.quantity)}</td><td className="py-2.5 text-right font-mono text-slate-600">{bdt(i.unit_price)}</td><td className="py-2.5 text-right font-mono text-slate-900">{bdt(i.line_total)}</td></tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 ml-auto w-full sm:w-80 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-mono">{bdt(invoice.subtotal)}</span></div>
          {Number(invoice.discount) > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-mono">- {bdt(invoice.discount)}</span></div>}
          <div className="flex justify-between font-bold border-t border-slate-200 pt-2"><span>Total</span><span className="font-mono">{bdt(total)}</span></div>
          <div className="flex justify-between text-emerald-700"><span>Paid</span><span className="font-mono">{bdt(paid)}</span></div>
          <div className={`flex justify-between font-bold ${due > 0 && !cancelled ? 'text-rose-600' : 'text-slate-700'}`}><span>Balance due</span><span className="font-mono">{cancelled ? '—' : bdt(due)}</span></div>
        </div>

        {payments.length > 0 && (
          <div className="mt-6">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">Payments received</div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id}><td className="py-1.5 text-slate-600">{p.paid_on}</td><td className="py-1.5 text-slate-600">{p.method || '—'}{p.reference ? ` · ${p.reference}` : ''}</td><td className="py-1.5 text-right font-mono text-slate-900">{bdt(p.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {invoice.notes && <p className="mt-6 text-xs text-slate-500">{invoice.notes}</p>}
        {INVOICE_COMPANY.bankLines.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">Bank details</div>
            {INVOICE_COMPANY.bankLines.map(l => <div key={l}>{l}</div>)}
          </div>
        )}
      </div>

      {!cancelled && due > 0 && (
        <form onSubmit={addPayment} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 print:hidden">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Plus className="w-4 h-4 text-blue-600" /> Add payment <span className="text-xs font-normal text-slate-400">· due {bdt(due)}</span></h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><label className="text-xs font-semibold text-slate-700 mb-1 block">Amount (BDT)</label><input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} /></div>
            <div><label className="text-xs font-semibold text-slate-700 mb-1 block">Date</label><input type="date" value={paidOn} onChange={e => setPaidOn(e.target.value)} className={inputCls} /></div>
            <div><label className="text-xs font-semibold text-slate-700 mb-1 block">Method</label><select value={method} onChange={e => setMethod(e.target.value)} className={inputCls}>{METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label className="text-xs font-semibold text-slate-700 mb-1 block">Reference</label><input value={reference} onChange={e => setReference(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setAmount(String(due))} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Pay full balance</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg">{loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save payment</button>
          </div>
          {error && <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
        </form>
      )}
    </div>
  )
}

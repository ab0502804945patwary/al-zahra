'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Printer, Loader2, Ban, Plus, Phone, Mail, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { bdt, payStatus, statusTone } from '@/lib/money'
import { INVOICE_COMPANY as CO } from '@/lib/invoiceConfig'

const inputCls = 'w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const METHODS = ['Cash', 'Bank Transfer', 'bKash', 'Nagad', 'Cheque', 'Other']

export default function InvoiceView({ invoice, items, payments, isAdmin = false }: { invoice: any; items: any[]; payments: any[]; isAdmin?: boolean }) {
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
    <div className="w-full max-w-[210mm] mx-auto space-y-4 print:max-w-none print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> All invoices</Link>
        <div className="flex gap-2">
          {!cancelled && <Link href={`/dashboard/invoices/${invoice.id}/edit`} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"><Pencil className="w-3.5 h-3.5" /> Edit invoice</Link>}
          {!cancelled && isAdmin && <button onClick={cancelInvoice} className="inline-flex items-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-50"><Ban className="w-3.5 h-3.5" /> Cancel invoice</button>}
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"><Printer className="w-3.5 h-3.5" /> Print / Save as PDF</button>
        </div>
      </div>

      {/* A4 sheet */}
      <div id="invoice-sheet" className="print-area relative bg-white shadow-md border border-slate-200 flex flex-col min-h-[297mm] print:shadow-none print:border-0">
        <div className="h-2 bg-blue-600" />
        {cancelled && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-8xl font-black text-rose-500/15 -rotate-12 tracking-widest">CANCELLED</span></div>}

        <div className="px-[14mm] pt-[10mm] flex-1 flex flex-col">
          {/* header */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <img src="/al_zahra_logo.svg" alt="AL ZAHRA" className="h-12 w-auto" />
              <div className="mt-2 text-[15px] font-bold text-slate-900 tracking-wide">{CO.name}</div>
              {CO.tagline && <div className="text-[11px] text-slate-500">{CO.tagline}</div>}
            </div>
            <div className="text-right">
              <div className="text-[34px] leading-none font-extrabold text-blue-600 tracking-tight">INVOICE</div>
              <div className="mt-2 font-mono text-sm font-bold text-slate-900">{invoice.invoice_no}</div>
              <span className={`inline-block mt-2 px-3 py-0.5 rounded-full border text-[11px] font-bold ${statusTone(st)}`}>{st.toUpperCase()}</span>
            </div>
          </div>

          <div className="my-6 h-px bg-slate-200" />

          {/* bill to + details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">Bill to</div>
              <div className="mt-1.5 text-[15px] font-bold text-slate-900">{invoice.customer_name}</div>
              {invoice.customer_phone && <div className="mt-0.5 text-xs text-slate-600 font-mono">{invoice.customer_phone}</div>}
            </div>
            <div className="rounded-lg border border-slate-200 p-4 text-xs space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Invoice no.</span><span className="font-mono font-bold text-slate-900">{invoice.invoice_no}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Invoice date</span><span className="font-semibold text-slate-900">{invoice.invoice_date}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Currency</span><span className="font-semibold text-slate-900">BDT (Taka)</span></div>
            </div>
          </div>

          {/* items */}
          <table className="w-full mt-7 text-[13px]">
            <thead>
              <tr className="bg-blue-600 text-white text-[11px] uppercase tracking-wider">
                <th className="text-left py-2.5 px-3 font-semibold w-10">#</th>
                <th className="text-left py-2.5 px-3 font-semibold">Service</th>
                <th className="text-right py-2.5 px-3 font-semibold w-16">Qty</th>
                <th className="text-right py-2.5 px-3 font-semibold w-32">Unit price</th>
                <th className="text-right py-2.5 px-3 font-semibold w-36">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <tr key={i.id} className={idx % 2 ? 'bg-slate-50' : ''}>
                  <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 text-slate-900 font-medium">{i.description}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{Number(i.quantity)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{bdt(i.unit_price)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">{bdt(i.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-px bg-slate-200" />

          {/* totals */}
          <div className="mt-5 flex justify-end">
            <div className="w-80 text-[13px] space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-mono">{bdt(invoice.subtotal)}</span></div>
              {Number(invoice.discount) > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-mono">- {bdt(invoice.discount)}</span></div>}
              <div className="flex justify-between items-center rounded-lg bg-blue-600 text-white px-3 py-2.5 text-sm font-bold"><span>Total</span><span className="font-mono">{bdt(total)}</span></div>
              <div className="flex justify-between text-emerald-700 font-medium"><span>Paid</span><span className="font-mono">{bdt(paid)}</span></div>
              <div className={`flex justify-between font-bold text-base border-t border-slate-200 pt-2 ${due > 0 && !cancelled ? 'text-rose-600' : 'text-slate-700'}`}><span>Balance due</span><span className="font-mono">{cancelled ? '—' : bdt(due)}</span></div>
            </div>
          </div>

          {/* payments */}
          {payments.length > 0 && (
            <div className="mt-7">
              <div className="text-[10px] font-bold tracking-widest text-blue-600 uppercase mb-1.5">Payments received</div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100 border-y border-slate-200">
                  {payments.map(p => (
                    <tr key={p.id}><td className="py-1.5 text-slate-600 w-28">{p.paid_on}</td><td className="py-1.5 text-slate-600">{p.method || '—'}{p.reference ? ` · ${p.reference}` : ''}</td><td className="py-1.5 text-right font-mono text-slate-900 font-medium">{bdt(p.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {invoice.notes && <div className="mt-6 rounded-lg border border-slate-200 p-3 text-xs text-slate-600"><span className="font-bold text-slate-700">Note: </span>{invoice.notes}</div>}

          {CO.bankLines.length > 0 && (
            <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              <div className="text-[10px] font-bold tracking-widest text-blue-600 uppercase mb-1">Bank details</div>
              {CO.bankLines.map(l => <div key={l}>{l}</div>)}
            </div>
          )}

          <div className="mt-auto pt-8 text-center text-xs font-semibold text-slate-500">{CO.thanks}</div>
        </div>

        {/* footer */}
        <div className="mt-6 bg-slate-900 text-slate-200 px-[14mm] py-4 text-[11px] grid grid-cols-3 gap-4">
          {CO.offices.map(o => (
            <div key={o.label} className="flex gap-2"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-300" /><div><div className="font-bold text-white">{o.label}</div><div className="text-slate-300 leading-snug">{o.address}</div></div></div>
          ))}
          <div className="space-y-1">
            {CO.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-blue-300" />{CO.phone}</div>}
            {CO.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-blue-300" />{CO.email}</div>}
          </div>
        </div>
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

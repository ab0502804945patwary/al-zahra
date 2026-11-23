'use client'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { bdt, payStatus, statusTone } from '@/lib/money'

export default function CustomerStatement({ customer, invoices }: { customer: any; invoices: any[] }) {
  const live = invoices.filter(i => i.status !== 'Cancelled')
  const rows = live.map(i => {
    const paid = (i.payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0)
    return { ...i, total: Number(i.total), paid, due: Number(i.total) - paid }
  })
  const invoiced = rows.reduce((s, r) => s + r.total, 0)
  const received = rows.reduce((s, r) => s + r.paid, 0)
  const due = invoiced - received
  // every payment, newest first, with the invoice it went to
  const payments = rows.flatMap(r => (r.payments || []).map((p: any) => ({ ...p, invoice_no: r.invoice_no }))).sort((a, b) => String(b.paid_on).localeCompare(String(a.paid_on)))

  return (
    <div className="print-area w-full max-w-[1100px] mx-auto space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/customers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> All customers</Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"><Printer className="w-3.5 h-3.5" /> Print / PDF</button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{customer.given_name} {customer.surname}</h1>
        <p className="text-xs text-slate-500 mt-0.5 font-mono">{customer.customer_code} · {customer.phone || 'no phone'}{customer.email ? ` · ${customer.email}` : ''}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"><p className="text-xs font-medium text-slate-500">Total invoiced</p><p className="text-xl font-bold text-slate-900 mt-1">{bdt(invoiced)}</p></div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"><p className="text-xs font-medium text-slate-500">Paid so far</p><p className="text-xl font-bold text-emerald-700 mt-1">{bdt(received)}</p></div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"><p className="text-xs font-medium text-slate-500">Still due</p><p className={`text-xl font-bold mt-1 ${due > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{bdt(due)}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-bold text-slate-900">Payments received (when and how much)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide"><tr>{['Date', 'Amount', 'Invoice', 'Method', 'Reference', 'Voucher', 'Received by'].map(h => <th key={h} className="text-left font-semibold px-3 py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-slate-700 font-mono">{p.paid_on}</td>
                  <td className="px-3 py-2 font-mono font-semibold text-emerald-700">{bdt(p.amount)}</td>
                  <td className="px-3 py-2 font-mono text-blue-700">{p.invoice_no}</td>
                  <td className="px-3 py-2 text-slate-600">{p.method || '—'}</td>
                  <td className="px-3 py-2 text-slate-500">{p.reference || '—'}</td>
                  <td className="px-3 py-2 font-mono text-slate-500">{p.receive_vouchers?.voucher_no || '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{p.receive_vouchers?.received_by || '—'}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">No payment received yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-bold text-slate-900">Invoices</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[600px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide"><tr>{['Invoice', 'Date', 'Total', 'Paid', 'Due', 'Status'].map(h => <th key={h} className="text-left font-semibold px-3 py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r => { const st = payStatus(r.total, r.paid); return (
                <tr key={r.id}>
                  <td className="px-3 py-2 print:no-underline"><Link href={`/dashboard/invoices/${r.id}`} className="font-mono font-bold text-blue-700 hover:underline">{r.invoice_no}</Link></td>
                  <td className="px-3 py-2 text-slate-600">{r.invoice_date}</td>
                  <td className="px-3 py-2 font-mono">{bdt(r.total)}</td>
                  <td className="px-3 py-2 font-mono text-emerald-700">{bdt(r.paid)}</td>
                  <td className="px-3 py-2 font-mono text-rose-600">{bdt(r.due)}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusTone(st)}`}>{st}</span></td>
                </tr>) })}
              {rows.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye } from 'lucide-react'
import { matchesQuery } from '@/lib/search'
import { bdt, payStatus, statusTone } from '@/lib/money'
import NewInvoiceForm from './NewInvoiceForm'

export default function InvoicesClient({ invoices, customers, services }: { invoices: any[]; customers: any[]; services: any[] }) {
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<'All' | 'Unpaid' | 'Partial' | 'Paid'>('All')

  if (creating) return <NewInvoiceForm customers={customers} services={services} onClose={() => setCreating(false)} />

  const rows = invoices.map(i => {
    const paid = (i.payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0)
    return { ...i, paid, due: Number(i.total) - paid, st: payStatus(Number(i.total), paid, i.status === 'Cancelled') }
  })
  const filtered = rows.filter((r, idx) =>
    (filter === 'All' || r.st === filter) &&
    matchesQuery(search, rows.length - idx, [r.invoice_no, r.customer_name, r.customer_phone, r.st])
  )
  const totalDue = rows.filter(r => r.st !== 'Cancelled').reduce((s, r) => s + r.due, 0)

  return (
    <div className="space-y-5 w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">Total due from customers: <span className="font-bold text-rose-600">{bdt(totalDue)}</span></p>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice no., customer, phone..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
          {(['All', 'Unpaid', 'Partial', 'Paid'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md transition ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
            <tr>{['Invoice', 'Date', 'Customer', 'Total', 'Paid', 'Due', 'Status', ''].map(h => <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/70">
                <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{r.invoice_no}</td>
                <td className="px-3 py-2.5 text-slate-600">{r.invoice_date}</td>
                <td className="px-3 py-2.5"><div className="font-semibold text-slate-900">{r.customer_name}</div><div className="text-[11px] text-slate-400 font-mono">{r.customer_phone}</div></td>
                <td className="px-3 py-2.5 font-mono">{bdt(r.total)}</td>
                <td className="px-3 py-2.5 font-mono text-emerald-700">{bdt(r.paid)}</td>
                <td className="px-3 py-2.5 font-mono text-rose-600">{r.st === 'Cancelled' ? '—' : bdt(r.due)}</td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusTone(r.st)}`}>{r.st}</span></td>
                <td className="px-3 py-2.5 text-right"><Link href={`/dashboard/invoices/${r.id}`} className="inline-flex p-1.5 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-700"><Eye className="w-4 h-4" /></Link></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-slate-400">No invoices yet. Click “New Invoice”.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

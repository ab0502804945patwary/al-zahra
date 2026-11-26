'use client'
import { useMemo, useState } from 'react'
import { Printer, Download, FileText, HandCoins, ReceiptText, Scale, Users, Building2, RefreshCw } from 'lucide-react'
import { bdt, payStatus, statusTone } from '@/lib/money'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const SHORT = MONTHS.map(m => m.slice(0, 3))
const RENEWAL_FIELDS: [string, string][] = [
  ['cr_expire_date', 'CR'], ['misa_expire_date', 'MISA'], ['rjsc_annual_return_due', 'RJSC Annual Return'],
  ['bd_next_audit_due', 'BD Audit'], ['sa_next_audit_due', 'Saudi Audit'],
]

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export default function ReportsClient({ invoices, expenses, customers, companies, agents }: { invoices: any[]; expenses: any[]; customers: any[]; companies: any[]; agents: any[] }) {
  const now = new Date()
  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const years = useMemo(() => {
    const ys = new Set<number>([now.getFullYear()])
    const add = (d?: string) => { const y = d ? Number(String(d).slice(0, 4)) : NaN; if (y > 2000) ys.add(y) }
    invoices.forEach(i => add(i.invoice_date)); expenses.forEach(e => add(e.expense_date)); customers.forEach(c => add(c.created_at))
    return [...ys].sort((a, b) => b - a)
  }, [invoices, expenses, customers]) // eslint-disable-line react-hooks/exhaustive-deps

  const prefix = mode === 'yearly' ? String(year) : `${year}-${String(month).padStart(2, '0')}`
  const inPeriod = (d?: string | null) => !!d && String(d).startsWith(prefix)
  const periodLabel = mode === 'yearly' ? `Year ${year}` : `${MONTHS[month - 1]} ${year}`

  const data = useMemo(() => {
    const liveInv = invoices.filter(i => i.status !== 'Cancelled')
    const liveExp = expenses.filter(e => e.status === 'Approved')
    const payments = liveInv.flatMap(i => (i.payments || []).map((p: any) => ({ ...p, customer: i.customer_name })))

    const invoicedP = liveInv.filter(i => inPeriod(i.invoice_date))
    const paymentsP = payments.filter(p => inPeriod(p.paid_on))
    const expensesP = liveExp.filter(e => inPeriod(e.expense_date))
    const invoiced = sum(invoicedP.map(i => Number(i.total)))
    const received = sum(paymentsP.map(p => Number(p.amount)))
    const spent = sum(expensesP.map(e => Number(e.amount)))

    // chart / table rows: months of the year (yearly) or days of the month (monthly)
    const slots = mode === 'yearly' ? 12 : new Date(year, month, 0).getDate()
    const keyOf = (d: string) => (mode === 'yearly' ? Number(d.slice(5, 7)) : Number(d.slice(8, 10)))
    const series = Array.from({ length: slots }, (_, i) => ({ label: mode === 'yearly' ? SHORT[i] : String(i + 1), invoiced: 0, received: 0, spent: 0 }))
    invoicedP.forEach(i => { series[keyOf(i.invoice_date) - 1].invoiced += Number(i.total) })
    paymentsP.forEach(p => { series[keyOf(p.paid_on) - 1].received += Number(p.amount) })
    expensesP.forEach(e => { series[keyOf(e.expense_date) - 1].spent += Number(e.amount) })

    const byCategory = new Map<string, number>()
    expensesP.forEach(e => byCategory.set(e.category, (byCategory.get(e.category) || 0) + Number(e.amount)))
    const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1])

    const byCustomer = new Map<string, { name: string; invoiced: number; count: number }>()
    invoicedP.forEach(i => {
      const k = i.customer_id || i.customer_name
      const c = byCustomer.get(k) || { name: i.customer_name || 'Customer', invoiced: 0, count: 0 }
      c.invoiced += Number(i.total); c.count += 1; byCustomer.set(k, c)
    })
    const topCustomers = [...byCustomer.values()].sort((a, b) => b.invoiced - a.invoiced).slice(0, 5)

    const invoiceRows = invoicedP.map(i => {
      const paid = sum((i.payments || []).map((p: any) => Number(p.amount)))
      return { ...i, paid, st: payStatus(Number(i.total), paid) }
    }).sort((a, b) => String(a.invoice_date).localeCompare(String(b.invoice_date)))

    // everything still owed right now (not limited to the period)
    const dueNow = sum(liveInv.map(i => Number(i.total) - sum((i.payments || []).map((p: any) => Number(p.amount)))))

    const newCustomers = customers.filter(c => inPeriod(c.created_at))
    const newCompanies = companies.filter(c => (c.service_type !== 'renewal' || (c as any).workflow_completed_at) && inPeriod(c.created_at))
    const newRenewals = companies.filter(c => c.service_type === 'renewal' && inPeriod(c.created_at))

    const renewalsDue = companies.filter(c => c.service_type === 'renewal').flatMap(c =>
      RENEWAL_FIELDS.filter(([f]) => inPeriod(c[f])).map(([f, doc]) => ({ company: c.company_name, id: c.company_id, doc, date: c[f] as string }))
    ).sort((a, b) => a.date.localeCompare(b.date))

    return { invoiced, received, spent, net: received - spent, dueNow, series, categories, topCustomers, invoiceRows, invoiceCount: invoicedP.length, paymentCount: paymentsP.length, expenseCount: expensesP.length, newCustomers: newCustomers.length, newCompanies: newCompanies.length, newRenewals: newRenewals.length, renewalsDue }
  }, [invoices, expenses, customers, companies, prefix, mode, year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  const maxBar = Math.max(1, ...data.series.map(s => Math.max(s.received, s.spent, s.invoiced)))

  function exportCsv() {
    const q = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines: string[] = [`AL ZAHRA report - ${periodLabel} (৳)`, '',
      `${mode === 'yearly' ? 'Month' : 'Day'},Invoiced,Received,Expenses,Net`,
      ...data.series.map(s => [q(s.label), s.invoiced.toFixed(2), s.received.toFixed(2), s.spent.toFixed(2), (s.received - s.spent).toFixed(2)].join(',')),
      ['Total', data.invoiced.toFixed(2), data.received.toFixed(2), data.spent.toFixed(2), data.net.toFixed(2)].join(','), '',
      'Expense category,Amount', ...data.categories.map(([c, a]) => `${q(c)},${a.toFixed(2)}`), '',
      'Invoice,Date,Customer,Total,Paid,Status', ...data.invoiceRows.map(r => [q(r.invoice_no), r.invoice_date, q(r.customer_name), Number(r.total).toFixed(2), r.paid.toFixed(2), r.st].join(','))]
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `report-${prefix}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const sel = 'px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-700'
  const cards = [
    { label: 'Invoiced', value: bdt(data.invoiced), sub: `${data.invoiceCount} invoices`, icon: FileText, tone: 'text-blue-600 bg-blue-50' },
    { label: 'Received', value: bdt(data.received), sub: `${data.paymentCount} payments`, icon: HandCoins, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Expenses', value: bdt(data.spent), sub: `${data.expenseCount} expenses`, icon: ReceiptText, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Balance', value: bdt(data.net), sub: data.net < 0 ? 'Loss in this period' : 'Profit in this period', icon: Scale, tone: data.net < 0 ? 'text-rose-600 bg-rose-50' : 'text-teal-600 bg-teal-50' },
  ]

  return (
    <div className="print-area space-y-5 w-full max-w-[1400px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">{periodLabel} · all amounts in ৳</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
            {(['monthly', 'yearly'] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-md capitalize transition ${mode === m ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{m}</button>)}
          </div>
          {mode === 'monthly' && <select value={month} onChange={e => setMonth(Number(e.target.value))} className={sel}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>}
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={sel}>{years.map(y => <option key={y}>{y}</option>)}</select>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"><Download className="w-3.5 h-3.5" /> CSV</button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"><Printer className="w-3.5 h-3.5" /> Print / PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => { const Icon = c.icon; return (
          <div key={c.label} className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-start justify-between gap-2">
            <div className="min-w-0"><p className="text-xs font-medium text-slate-500">{c.label}</p><p className="text-lg sm:text-xl font-bold text-slate-900 mt-1 truncate">{c.value}</p><p className="text-[11px] text-slate-400 mt-0.5">{c.sub}</p></div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.tone}`}><Icon className="w-4 h-4" /></div>
          </div>) })}
      </div>

      {/* chart + table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">{mode === 'yearly' ? 'Month by month' : 'Day by day'}</h2>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Received</span>
            <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Expenses</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-40">
          {data.series.map(s => (
            <div key={s.label} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-1" title={`${s.label}: received ${bdt(s.received)}, expenses ${bdt(s.spent)}`}>
              <div className="w-full flex items-end justify-center gap-px flex-1">
                <div className="w-1/2 max-w-3 bg-emerald-500 rounded-t" style={{ height: `${(s.received / maxBar) * 100}%` }} />
                <div className="w-1/2 max-w-3 bg-amber-500 rounded-t" style={{ height: `${(s.spent / maxBar) * 100}%` }} />
              </div>
              <span className="text-[9px] text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto mt-5">
          <table className="w-full text-xs min-w-[520px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide"><tr>{[mode === 'yearly' ? 'Month' : 'Day', 'Invoiced', 'Received', 'Expenses', 'Net'].map((h, i) => <th key={h} className={`font-semibold px-3 py-2 ${i ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.series.filter(s => s.invoiced || s.received || s.spent || mode === 'yearly').map(s => (
                <tr key={s.label}><td className="px-3 py-1.5 text-slate-700 font-medium">{s.label}</td><td className="px-3 py-1.5 text-right font-mono text-slate-600">{bdt(s.invoiced)}</td><td className="px-3 py-1.5 text-right font-mono text-emerald-700">{bdt(s.received)}</td><td className="px-3 py-1.5 text-right font-mono text-amber-700">{bdt(s.spent)}</td><td className={`px-3 py-1.5 text-right font-mono font-semibold ${s.received - s.spent < 0 ? 'text-rose-600' : 'text-slate-800'}`}>{bdt(s.received - s.spent)}</td></tr>
              ))}
              <tr className="bg-slate-50 font-bold"><td className="px-3 py-2">Total</td><td className="px-3 py-2 text-right font-mono">{bdt(data.invoiced)}</td><td className="px-3 py-2 text-right font-mono text-emerald-700">{bdt(data.received)}</td><td className="px-3 py-2 text-right font-mono text-amber-700">{bdt(data.spent)}</td><td className={`px-3 py-2 text-right font-mono ${data.net < 0 ? 'text-rose-600' : ''}`}>{bdt(data.net)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Expenses by category</h2>
          {data.categories.length === 0 ? <p className="text-xs text-slate-400">No expenses in this period.</p> : (
            <div className="space-y-2.5">
              {data.categories.map(([c, a]) => (
                <div key={c}><div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-700">{c}</span><span className="font-mono text-slate-800">{bdt(a)} <span className="text-slate-400">({data.spent ? Math.round((a / data.spent) * 100) : 0}%)</span></span></div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${data.spent ? (a / data.spent) * 100 : 0}%` }} /></div></div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Top customers (invoiced)</h2>
          {data.topCustomers.length === 0 ? <p className="text-xs text-slate-400">No invoices in this period.</p> : (
            <table className="w-full text-xs"><tbody className="divide-y divide-slate-100">
              {data.topCustomers.map(t => <tr key={t.name}><td className="py-2 font-semibold text-slate-900">{t.name}</td><td className="py-2 text-slate-500">{t.count} invoice{t.count > 1 ? 's' : ''}</td><td className="py-2 text-right font-mono text-slate-800">{bdt(t.invoiced)}</td></tr>)}
            </tbody></table>
          )}
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs"><span className="text-slate-500">Total due from customers now</span><span className="font-mono font-bold text-rose-600">{bdt(data.dueNow)}</span></div>
        </div>
      </div>

      {/* business activity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'New customers', value: data.newCustomers, icon: Users },
          { label: 'New companies registered', value: data.newCompanies, icon: Building2 },
          { label: 'New renewal companies', value: data.newRenewals, icon: RefreshCw },
          { label: 'Agents (total)', value: agents.length, icon: Users },
        ].map(c => { const Icon = c.icon; return (
          <div key={c.label} className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between"><div><p className="text-xs font-medium text-slate-500">{c.label}</p><p className="text-xl font-bold text-slate-900 mt-1">{c.value}</p></div><Icon className="w-5 h-5 text-blue-500" /></div>) })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-bold text-slate-900">Invoices in this period</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide"><tr>{['Invoice', 'Date', 'Customer', 'Total', 'Paid', 'Status'].map(h => <th key={h} className="text-left font-semibold px-3 py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.invoiceRows.map(r => <tr key={r.id}><td className="px-3 py-2 font-mono font-bold text-blue-700">{r.invoice_no}</td><td className="px-3 py-2 text-slate-600">{r.invoice_date}</td><td className="px-3 py-2 text-slate-800">{r.customer_name}</td><td className="px-3 py-2 font-mono">{bdt(r.total)}</td><td className="px-3 py-2 font-mono text-emerald-700">{bdt(r.paid)}</td><td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusTone(r.st)}`}>{r.st}</span></td></tr>)}
              {data.invoiceRows.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No invoices in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-bold text-slate-900">Renewals falling due in this period</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[520px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide"><tr>{['Company', 'ID', 'Item', 'Due date'].map(h => <th key={h} className="text-left font-semibold px-3 py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.renewalsDue.map((r, i) => <tr key={r.id + r.doc + i}><td className="px-3 py-2 font-semibold text-slate-900">{r.company}</td><td className="px-3 py-2 font-mono text-blue-700">{r.id}</td><td className="px-3 py-2 text-slate-700">{r.doc}</td><td className="px-3 py-2 font-mono text-slate-600">{r.date}</td></tr>)}
              {data.renewalsDue.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-400">No renewals due in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

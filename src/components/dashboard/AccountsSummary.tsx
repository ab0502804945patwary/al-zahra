import Link from 'next/link'
import { Scale, HandCoins, Hourglass, FileText, ReceiptText } from 'lucide-react'
import { bdt, payStatus } from '@/lib/money'

interface InvoiceRow { id: string; invoice_no: string; customer_id: string | null; customer_name: string | null; total: number; status: string; payments: { amount: number; paid_on: string }[] }

interface ExpenseRow { expense_date: string; amount: number; status: string }

export default function AccountsSummary({ invoices, expenses = [] }: { invoices: InvoiceRow[]; expenses?: ExpenseRow[] }) {
  const live = invoices.filter(i => i.status !== 'Cancelled')
  const rows = live.map(i => {
    const paid = (i.payments || []).reduce((s, p) => s + Number(p.amount), 0)
    return { ...i, total: Number(i.total), paid, due: Number(i.total) - paid }
  })
  const invoiced = rows.reduce((s, r) => s + r.total, 0)
  const received = rows.reduce((s, r) => s + r.paid, 0)
  const due = invoiced - received
  const month = new Date().toISOString().slice(0, 7)
  const receivedThisMonth = live.flatMap(i => i.payments || []).filter(p => String(p.paid_on).startsWith(month)).reduce((s, p) => s + Number(p.amount), 0)
  // expenses reduce the money received (rejected expenses are ignored)
  const liveExpenses = expenses.filter(e => e.status !== 'Rejected')
  const expenseTotal = liveExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const expenseThisMonth = liveExpenses.filter(e => String(e.expense_date).startsWith(month)).reduce((s, e) => s + Number(e.amount), 0)
  const net = received - expenseTotal
  const count = (st: string) => rows.filter(r => payStatus(r.total, r.paid) === st).length

  // customers who owe the most
  const byCustomer = new Map<string, { name: string; due: number; invoices: number }>()
  for (const r of rows) {
    if (r.due <= 0) continue
    const key = r.customer_id || r.customer_name || r.id
    const cur = byCustomer.get(key) || { name: r.customer_name || 'Customer', due: 0, invoices: 0 }
    cur.due += r.due; cur.invoices += 1
    byCustomer.set(key, cur)
  }
  const topDue = [...byCustomer.values()].sort((a, b) => b.due - a.due).slice(0, 5)

  const cards = [
    { label: 'Total Invoiced', value: bdt(invoiced), sub: `${rows.length} invoices · ${count('Paid')} fully paid`, icon: FileText, tone: 'text-blue-600 bg-blue-50' },
    { label: 'Received', value: bdt(received), sub: `This month: ${bdt(receivedThisMonth)}`, icon: HandCoins, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Expenses', value: bdt(expenseTotal), sub: `This month: ${bdt(expenseThisMonth)}`, icon: ReceiptText, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Balance', value: bdt(net), sub: net < 0 ? 'Expenses are more than received' : 'Money left after expenses', icon: Scale, tone: net < 0 ? 'text-rose-600 bg-rose-50' : 'text-teal-600 bg-teal-50' },
    { label: 'Total Due', value: bdt(due), sub: `${count('Unpaid')} unpaid · ${count('Partial')} partial`, icon: Hourglass, tone: 'text-rose-600 bg-rose-50' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Accounts Summary</h2>
          <p className="text-xs text-slate-500">Invoices, money received, expenses and what customers still owe (BDT)</p>
        </div>
        <Link href="/dashboard/invoices" className="text-xs font-semibold text-blue-600 hover:text-blue-800">All invoices →</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{c.label}</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1 truncate">{c.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{c.sub}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.tone}`}><Icon className="w-4 h-4" /></div>
            </div>
          )
        })}
      </div>

      {topDue.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-800">Customers with the highest due</div>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-100">
              {topDue.map(t => (
                <tr key={t.name + t.due}><td className="px-4 py-2.5 font-semibold text-slate-900">{t.name}</td><td className="px-4 py-2.5 text-slate-500">{t.invoices} invoice{t.invoices > 1 ? 's' : ''}</td><td className="px-4 py-2.5 text-right font-mono font-semibold text-rose-600">{bdt(t.due)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

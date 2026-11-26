import { payStatus } from '@/lib/money'

export interface InvoiceRow { id: string; invoice_no?: string; customer_id: string | null; customer_name: string | null; total: number; status: string; payments: { amount: number; paid_on: string }[] }
export interface ExpenseRow { expense_date: string; amount: number; status: string; category?: string }

/** Money figures shown on the dashboard. */
export function summarizeAccounts(invoices: InvoiceRow[], expenses: ExpenseRow[]) {
  const live = invoices.filter(i => i.status !== 'Cancelled')
  const rows = live.map(i => {
    const paid = (i.payments || []).reduce((s, p) => s + Number(p.amount), 0)
    return { ...i, total: Number(i.total), paid, due: Number(i.total) - paid }
  })
  const invoiced = rows.reduce((s, r) => s + r.total, 0)
  const received = rows.reduce((s, r) => s + r.paid, 0)
  const payments = live.flatMap(i => i.payments || [])
  const receivedIn = (month: string) => payments.filter(p => String(p.paid_on).startsWith(month)).reduce((s, p) => s + Number(p.amount), 0)
  // expenses reduce the money received (only approved expenses count)
  const approved = expenses.filter(e => e.status === 'Approved')
  const expenseTotal = approved.reduce((s, e) => s + Number(e.amount), 0)
  const today = new Date()
  const month = today.toISOString().slice(0, 7)
  const count = (st: string) => rows.filter(r => payStatus(r.total, r.paid) === st).length

  const spentIn = (m: string) => approved.filter(e => String(e.expense_date).startsWith(m)).reduce((s, e) => s + Number(e.amount), 0)
  const lastMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)).toISOString().slice(0, 7)

  // newest payments first
  const recentPayments = live
    .flatMap(i => (i.payments || []).map((p, n) => ({ key: `${i.id}-${n}`, name: i.customer_name || 'Customer', invoice: i.invoice_no || '', amount: Number(p.amount), date: String(p.paid_on || '') })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  // approved expenses by category, biggest first
  const byCategory = new Map<string, number>()
  for (const e of approved) byCategory.set(e.category || 'Other', (byCategory.get(e.category || 'Other') || 0) + Number(e.amount))
  const categories = [...byCategory].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5)

  // received and spent per month, oldest first, ending with the current month
  const months = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (6 - i), 1))
    const key = d.toISOString().slice(0, 7)
    return { key, label: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }), received: receivedIn(key), spent: spentIn(key) }
  })

  // customers who owe the most
  const byCustomer = new Map<string, { key: string; name: string; due: number; invoices: number }>()
  for (const r of rows) {
    if (r.due <= 0) continue
    const key = r.customer_id || r.customer_name || r.id
    const cur = byCustomer.get(key) || { key, name: r.customer_name || 'Customer', due: 0, invoices: 0 }
    cur.due += r.due; cur.invoices += 1
    byCustomer.set(key, cur)
  }

  return {
    invoiced,
    received,
    receivedThisMonth: receivedIn(month),
    expenses: expenseTotal,
    expensesThisMonth: spentIn(month),
    receivedLastMonth: receivedIn(lastMonth),
    expensesLastMonth: spentIn(lastMonth),
    recentPayments,
    categories,
    balance: received - expenseTotal,
    due: invoiced - received,
    count: rows.length,
    paidCount: count('Paid'),
    unpaidCount: count('Unpaid'),
    partialCount: count('Partial'),
    months,
    topDue: [...byCustomer.values()].sort((a, b) => b.due - a.due).slice(0, 5),
  }
}

export type AccountsData = ReturnType<typeof summarizeAccounts>

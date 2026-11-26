import type { ComponentType, ReactNode } from 'react'
import { CashFlowIcon, CompareIcon, DueIcon, InvoiceStatusIcon, PaymentsIcon, PieIcon } from './MoneyIcons'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { bdt } from '@/lib/money'
import type { AccountsData } from '@/lib/accounts'

const CARD = 'bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 min-w-0 flex flex-col'
const EMPTY = 'flex-1 flex items-center justify-center py-6 text-xs text-slate-400'
const SLICE_COLORS = ['#f59e0b', '#8b5cf6', '#0ea5e9', '#f43f5e', '#14b8a6']
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

function Panel({ icon: Icon, title, className = '', aside, children }: { icon: ComponentType<{ className?: string }>; title: string; className?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className={`${CARD} ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Icon className="w-6 h-6 shrink-0" /> {title}</h3>
        {aside}
      </div>
      {children}
    </div>
  )
}

/** Money in and money out, side by side for each of the last months. */
function CashFlow({ months }: { months: AccountsData['months'] }) {
  const max = Math.max(1, ...months.flatMap(m => [m.received, m.spent]))
  const bar = (value: number, tone: string, label: string) => (
    <div title={`${label}: ${bdt(value)}`} className="flex-1 max-w-6 h-full flex flex-col justify-end items-center">
      {value > 0 && <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap mb-1">{compact.format(value)}</span>}
      {/* the label takes room too, so a full bar stops short of the top */}
      <span className={`block w-full rounded-t-md ${value > 0 ? tone : 'bg-slate-100'}`} style={{ height: value > 0 ? `${Math.max(4, (value / max) * 82)}%` : '4px' }} />
    </div>
  )
  return (
    <div className="flex-1 flex items-stretch gap-2 sm:gap-4 min-h-44">
      {months.map((m, i) => (
        <div key={m.key} className={`flex-1 min-w-0 flex flex-col rounded-lg ${i === months.length - 1 ? 'bg-slate-50' : ''}`}>
          <div className="flex-1 flex items-stretch justify-center gap-1 px-0.5 pt-1">
            {bar(m.received, 'bg-gradient-to-t from-emerald-600 to-emerald-400', `${m.label} received`)}
            {bar(m.spent, 'bg-gradient-to-t from-amber-500 to-amber-300', `${m.label} expenses`)}
          </div>
          <span className="text-center text-[10px] text-slate-500 py-1">{m.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Approved expenses as a ring, one slice per category, with the total in the middle. */
function ExpenseRing({ categories, total }: { categories: AccountsData['categories']; total: number }) {
  // anything outside the five biggest categories
  const rest = total - categories.reduce((a, c) => a + c.total, 0)
  const slices = [...categories.map((c, i) => ({ ...c, color: SLICE_COLORS[i] })), ...(rest > 0.004 ? [{ name: 'Others', total: rest, color: '#cbd5e1' }] : [])]
  const ring = slices.map((c, i) => {
    const before = slices.slice(0, i).reduce((a, q) => a + q.total, 0)
    return `${c.color} ${(before / total) * 100}% ${((before + c.total) / total) * 100}%`
  }).join(', ')
  return (
    <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-28 h-28 rounded-full shrink-0" style={{ background: `conic-gradient(${ring})` }}>
        <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-base font-bold text-slate-900">৳ {compact.format(total)}</span>
          <span className="text-[10px] text-slate-500">total spent</span>
        </div>
      </div>
      <ul className="flex-1 w-full min-w-0 space-y-2">
        {slices.map(c => (
          <li key={c.name} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-slate-800 truncate">{c.name}</span>
              <span className="block text-[11px] text-slate-500">{bdt(c.total)}</span>
            </span>
            <span className="text-sm font-bold text-slate-900">{Math.round((c.total / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Last month and this month as a pair of columns, with this month's amount on top. */
function MonthPair({ label, now, before, upIsGood, color }: { label: string; now: number; before: number; upIsGood: boolean; color: string }) {
  const max = Math.max(1, Math.abs(now), Math.abs(before))
  const diff = now - before
  const good = (diff > 0) === upIsGood
  const Arrow = diff > 0 ? ArrowUpRight : ArrowDownRight
  const height = (v: number) => (v ? `${Math.max(6, (Math.abs(v) / max) * 100)}%` : '4px')
  return (
    <div className="flex flex-col items-center rounded-xl bg-slate-50 px-2 py-2 min-w-0">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p title={bdt(now)} className="text-base font-bold text-slate-900 whitespace-nowrap">৳ {compact.format(now)}</p>
      <div className="flex-1 min-h-12 w-full flex items-end justify-center gap-1.5 mt-1.5">
        <span title={`Last month: ${bdt(before)}`} className="w-4 rounded-t-md bg-slate-300" style={{ height: height(before) }} />
        <span title={`This month: ${bdt(now)}`} className={`w-4 rounded-t-md ${color}`} style={{ height: height(now) }} />
      </div>
      {/* a percentage only makes sense when last month had something */}
      <p className={`mt-1.5 flex items-center gap-0.5 text-[11px] font-semibold ${!before || !diff ? 'text-slate-400' : good ? 'text-emerald-600' : 'text-rose-600'}`}>
        {before && diff ? <><Arrow className="w-3 h-3" />{Math.round((Math.abs(diff) / Math.abs(before)) * 100)}%</> : before ? 'No change' : 'First month'}
      </p>
    </div>
  )
}

/** How many invoices are paid, part paid and unpaid. */
function InvoiceStatus({ accounts }: { accounts: AccountsData }) {
  const parts = [
    { label: 'Paid', n: accounts.paidCount, color: 'bg-emerald-500', text: 'text-emerald-600', tint: 'bg-emerald-50' },
    { label: 'Partial', n: accounts.partialCount, color: 'bg-amber-400', text: 'text-amber-600', tint: 'bg-amber-50' },
    { label: 'Unpaid', n: accounts.unpaidCount, color: 'bg-rose-500', text: 'text-rose-600', tint: 'bg-rose-50' },
  ]
  const total = accounts.count
  return (
    <div className="flex-1 flex flex-col justify-between gap-3">
      <p className="text-slate-500 text-xs"><span className="text-3xl font-bold text-slate-900 mr-2">{total}</span>{total === 1 ? 'invoice' : 'invoices'} in total</p>
      <div className="flex h-3 gap-0.5 rounded-full overflow-hidden bg-slate-100">
        {parts.map(p => p.n > 0 && <span key={p.label} title={`${p.label}: ${p.n}`} className={p.color} style={{ width: `${(p.n / total) * 100}%` }} />)}
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {parts.map(p => (
          <div key={p.label} className={`rounded-xl px-3 py-2 ${p.tint}`}>
            <dt className={`text-[11px] font-medium ${p.text}`}>{p.label}</dt>
            <dd className="flex items-baseline justify-between gap-1">
              <span className="text-lg font-bold text-slate-900">{p.n}</span>
              <span className="text-[10px] text-slate-500">{total ? Math.round((p.n / total) * 100) : 0}%</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default function MoneyPanels({ accounts }: { accounts: AccountsData }) {
  const compare = [
    { label: 'Received', now: accounts.receivedThisMonth, before: accounts.receivedLastMonth, upIsGood: true, color: 'bg-emerald-500' },
    { label: 'Expenses', now: accounts.expensesThisMonth, before: accounts.expensesLastMonth, upIsGood: false, color: 'bg-amber-400' },
    { label: 'Balance', now: accounts.receivedThisMonth - accounts.expensesThisMonth, before: accounts.receivedLastMonth - accounts.expensesLastMonth, upIsGood: true, color: 'bg-blue-600' },
  ]
  const hasDues = accounts.topDue.length > 0

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          icon={CashFlowIcon} title="Cash Flow, Last 7 Months (৳)" className="xl:col-span-2"
          aside={
            <ul className="flex gap-4 text-[11px] text-slate-600">
              <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Received</li>
              <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />Expenses</li>
            </ul>
          }
        >
          <CashFlow months={accounts.months} />
        </Panel>

        <Panel icon={PaymentsIcon} title="Recent Payments">
          {accounts.recentPayments.length === 0 ? <p className={EMPTY}>No payments yet</p> : (
            <ul className="divide-y divide-slate-100">
              {accounts.recentPayments.map(p => (
                <li key={p.key} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p title={p.name} className="text-[12.5px] font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{[p.invoice, p.date].filter(Boolean).join(' · ')}</p>
                  </div>
                  <p className="text-[13px] font-bold text-emerald-600 whitespace-nowrap">+{bdt(p.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Panel icon={PieIcon} title="Expenses by Category">
          {accounts.categories.length === 0 || accounts.expenses <= 0 ? <p className={EMPTY}>No approved expenses yet</p>
            : <ExpenseRing categories={accounts.categories} total={accounts.expenses} />}
        </Panel>

        <Panel icon={InvoiceStatusIcon} title="Invoice Status">
          {accounts.count === 0 ? <p className={EMPTY}>No invoices yet</p> : <InvoiceStatus accounts={accounts} />}
        </Panel>

        <Panel
          icon={CompareIcon} title="This Month vs Last Month" className="md:col-span-2 xl:col-span-1"
          aside={
            <ul className="flex gap-3 text-[11px] text-slate-600">
              <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />Last month</li>
              <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />This month</li>
            </ul>
          }
        >
          <div className="flex-1 grid grid-cols-3 gap-2.5">
            {compare.map(c => <MonthPair key={c.label} {...c} />)}
          </div>
        </Panel>

      </div>

      {hasDues && (
        <Panel icon={DueIcon} title="Highest Customer Dues">
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
            {accounts.topDue.map(t => (
              <li key={t.key} className="rounded-xl bg-rose-50/60 px-3 py-2.5 min-w-0">
                <p title={t.name} className="text-xs font-semibold text-slate-800 truncate">{t.name}</p>
                <p className="text-sm font-bold text-rose-600 mt-0.5">{bdt(t.due)}</p>
                <p className="text-[11px] text-slate-500">{t.invoices} invoice{t.invoices > 1 ? 's' : ''}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  )
}

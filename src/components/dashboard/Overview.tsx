'use client'
import { useEffect, useState, type ComponentType } from 'react'
import Link from 'next/link'
import {
  ArrowRight, CalendarDays,
} from 'lucide-react'
import { bdt } from '@/lib/money'
import type { AccountsData } from '@/lib/accounts'
import PhaseOverview, { type PhaseRow } from './PhaseOverview'
import { BalanceIcon, CompliantIcon, DueIcon, ExpenseIcon, ExpiryIcon, InvoiceIcon, OverdueIcon, PortfolioIcon, ProgressRingIcon, ReceivedIcon, WalletIcon, WorkIcon } from './MoneyIcons'
import MoneyPanels from './MoneyPanels'

interface Props {
  name: string
  /** module keys the signed-in user may open */
  modules: string[]
  kpi: { totalCompanies: number; compliant: number; overdue: number; expiring: number }
  phases: PhaseRow[]
  /** null = this user may not see money */
  accounts: AccountsData | null
}

interface Slice { label: string; n: number; color: string; text: string }

/** Heading that opens one of the two halves of the dashboard. */
function SectionTitle({ icon: Icon, title, href, link, }: { icon: ComponentType<{ className?: string }>; title: string; href?: string; link?: string; }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <Icon className="w-7 h-7 shrink-0" />
      <h2 className="text-base font-semibold text-slate-900 whitespace-nowrap">{title}</h2>
      <span aria-hidden className="flex-1 h-px bg-slate-200" />
      {href && <Link href={href} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0">{link} <ArrowRight className="w-3.5 h-3.5" /></Link>}
    </div>
  )
}

export default function Overview({ name, modules, kpi, phases, accounts }: Props) {
  // Greeting and date follow the viewer's clock, so they are filled in after mount
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const clock = setTimeout(() => setNow(new Date()))
    return () => clearTimeout(clock)
  }, [])

  const hour = now?.getHours()
  const greeting = hour === undefined ? 'Welcome' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const can = (m: string) => modules.includes(m)

  const stats = [
    { label: 'Active Portfolios', value: kpi.totalCompanies, hint: 'Registered corporate entities', icon: PortfolioIcon },
    { label: 'Compliant & On Track', value: kpi.compliant, hint: 'On time (by target date)', icon: CompliantIcon },
    { label: 'Action Needed (Overdue)', value: kpi.overdue, hint: 'Exceeded target threshold (>13d)', icon: OverdueIcon },
    { label: 'Company Name Expiry Radar', value: kpi.expiring, hint: 'Expiring within 40 days', icon: ExpiryIcon },
  ]

  // money: large icon cards at the top of the dashboard
  const money = accounts ? [
    { label: 'Total Invoiced', value: accounts.invoiced, hint: `${accounts.count} invoices · ${accounts.paidCount} fully paid`, icon: InvoiceIcon },
    { label: 'Received', value: accounts.received, hint: `This month: ${bdt(accounts.receivedThisMonth)}`, icon: ReceivedIcon },
    { label: 'Expenses', value: accounts.expenses, hint: `This month: ${bdt(accounts.expensesThisMonth)}`, icon: ExpenseIcon },
    { label: 'Balance', value: accounts.balance, hint: accounts.balance < 0 ? 'Expenses are more than received' : 'Money left after expenses', icon: BalanceIcon },
    { label: 'Total Due', value: accounts.due, hint: `${accounts.unpaidCount} unpaid · ${accounts.partialCount} partial`, icon: DueIcon },
  ] : []

  // Work donut: share of every stage file by timing status
  const sum = (k: 'total' | 'green' | 'yellow' | 'red') => phases.reduce((a, r) => a + r[k], 0)
  const total = sum('total')
  const slice = (label: string, n: number, color: string): Slice => ({ label, n, color, text: String(n) })
  const work = [
    slice('On Time', sum('green'), '#10b981'),
    slice('Caution', sum('yellow'), '#f59e0b'),
    slice('Overdue', sum('red'), '#f43f5e'),
    slice('Pending', Math.max(0, total - sum('green') - sum('yellow') - sum('red')), '#cbd5e1'),
  ]
  const onTime = total ? Math.round((sum('green') / total) * 100) : 0



  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="relative isolate flex flex-wrap items-end justify-between gap-3 py-1">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden md:block">
          <div className="absolute right-40 -top-6 w-56 h-24 rounded-full bg-sky-300/40 blur-3xl" />
          <div className="absolute right-0 top-0 w-64 h-24 rounded-full bg-blue-400/30 blur-3xl" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{greeting}, {name}! <span aria-hidden>👋</span></h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Here&apos;s your investor licensing overview for today.</p>
        </div>
        {now && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            <CalendarDays className="w-4 h-4 text-blue-600" />
          </div>
        )}
      </div>

      {/* ───────── 1. Money ───────── */}
      {accounts && (
        <section aria-label="Accounts" className="space-y-4">
          <SectionTitle icon={WalletIcon} title="Accounts" href={can('invoices') ? '/dashboard/invoices' : undefined} link="All invoices" />
          <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(205px,1fr))] gap-3 sm:gap-4">
            {money.map(m => (
              <div key={m.label} className="bg-white rounded-2xl border border-slate-200/70 shadow-sm stat-card max-md:last:col-span-2 p-3 grid grid-cols-[auto_minmax(0,1fr)] content-center items-center gap-x-2 sm:gap-x-3 min-w-0">
                <m.icon className="col-start-1 row-start-1 w-7 h-7 sm:w-9 sm:h-9 sm:row-span-3" />
                <p className="col-start-2 row-start-1 text-xs font-medium text-slate-600">{m.label}</p>
                <p className="col-span-2 row-start-2 mt-1.5 sm:mt-0 sm:col-span-1 sm:col-start-2 text-[15px] sm:text-lg font-bold text-slate-900 leading-tight whitespace-nowrap">{bdt(m.value)}</p>
                <p className="col-span-2 row-start-3 sm:col-span-1 sm:col-start-2 text-[11px] text-slate-400">{m.hint}</p>
              </div>
            ))}
          </div>

          <MoneyPanels accounts={accounts} />
        </section>
      )}

      {/* ───────── 2. Work ───────── */}
      <section aria-label="Work" className="space-y-4">
        <SectionTitle icon={WorkIcon} title="Work" />
        {/* Two cards side by side: the portfolio counts, and how the files are doing */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col min-w-0">
            {/* the 1px gaps over a grey backing draw the dividers */}
            <div className="flex-1 grid grid-cols-2 gap-px bg-slate-100">
              {stats.map(m => (
                <div key={m.label} className="group grid grid-cols-[auto_minmax(0,1fr)] content-center items-center gap-x-2.5 sm:gap-x-4 bg-white px-3 sm:px-6 py-4 sm:py-5 min-w-0">
                  <m.icon className="col-start-1 row-start-1 w-8 h-8 sm:w-12 sm:h-12 sm:row-span-3 transition-transform group-hover:-translate-y-0.5 group-hover:scale-105" />
                  <p className="col-start-2 row-start-1 sm:row-start-2 sm:mt-1.5 text-xs font-semibold text-slate-700">{m.label}</p>
                  <p className="col-span-2 row-start-2 mt-2 sm:mt-0 sm:col-span-1 sm:col-start-2 sm:row-start-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none">{m.value}</p>
                  <p className="col-span-2 row-start-3 mt-1 sm:mt-0 sm:col-span-1 sm:col-start-2 text-[11px] text-slate-400">{m.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 sm:p-5 flex flex-col min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ProgressRingIcon className="w-6 h-6 shrink-0" /> Work Progress</h3>
              <p className="text-xs text-slate-500"><b className="text-xl text-emerald-600 mr-1.5">{onTime}%</b>on time · {total} files</p>
            </div>
            <div className="flex h-3 shrink-0 gap-0.5 rounded-full overflow-hidden bg-slate-100">
              {work.map(w => w.n > 0 && <span key={w.label} title={`${w.label}: ${w.n}`} className="min-w-1.5" style={{ flexGrow: w.n, flexBasis: 0, background: w.color }} />)}
            </div>
            <ul className="flex-1 flex flex-col justify-end divide-y divide-slate-100 mt-2">
              {work.map(w => (
                <li key={w.label} className="flex items-center gap-2.5 py-2 text-[13px] text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: w.color }} />
                  <span className="flex-1">{w.label}</span>
                  <b className="text-slate-900">{w.n}</b>
                  <span className="w-10 text-right text-xs text-slate-400">{total ? Math.round((w.n / total) * 100) : 0}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <PhaseOverview phases={phases} />
      </section>
    </div>
  )
}

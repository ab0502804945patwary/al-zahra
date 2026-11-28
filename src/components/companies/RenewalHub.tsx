'use client'
import { ReactNode, useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { AlertTriangle, ArrowRight, Award, Bell, Building2, CalendarRange, CheckCircle2, ChevronDown, Clock, History, Layers, RotateCcw, Search, Send, X } from 'lucide-react'
import { Company } from '@/lib/types'
import OwnerTag from '@/components/ui/OwnerTag'
import { matchesQuery } from '@/lib/search'
import { createClient } from '@/lib/supabase/client'
import RenewalNotifyDrawer from './RenewalNotifyDrawer'
import { Channel, Lang, LogRow, PILLARS, Pillar, PillarDef, SUSPENDED, Service, State, StateRow, WORKFLOWS, daysText, daysTone, phoneOf, pillarOf, serviceOf } from './renewalHubShared'

type Kpi = 'total' | 'overdue' | 'd30' | 'd90' | 'notified'
type Completed = 'all' | Pillar | null

const PAGE = 10
const noSubscribe = () => () => {}

const STATE_UI: Record<State, { label: string; cls: string; dot: string }> = {
  active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  due: { label: 'Due', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  inactive: { label: 'Inactive', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  none: { label: 'No date', cls: 'bg-slate-50 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
}
const STATE_KEYS: State[] = ['active', 'due', 'inactive', 'none']

const workflowTone = (w: string) =>
  w === 'Notified' ? 'bg-[#eef2ff] text-[#4338ca] border-[#c7d2fe]'
  : w === 'Confirmed / In Progress' ? 'bg-amber-50 text-amber-800 border-amber-300'
  : w === 'Completed (+1 Yr)' ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
  : 'bg-slate-100 text-slate-700 border-slate-200'

const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })

interface Props {
  companies: Company[]
  isAdmin?: boolean
  canEdit?: boolean
  owners?: Record<string, string>
  ownerAvatars?: Record<string, string>
  /** a renewal moved a date: keep the company list below in step */
  onCompanyChange: (company: Company) => void
  /** per company controls owned by the page: status switch and edit */
  rowTools?: (company: Company) => ReactNode
}

export default function RenewalHub({ companies, isAdmin = false, canEdit = false, owners = {}, ownerAvatars = {}, onCompanyChange, rowTools }: Props) {
  const [kpi, setKpi] = useState<Kpi>('total')
  const [pillar, setPillar] = useState<Pillar | null>(null)
  const [scope, setScope] = useState<State | 'all'>('all')
  const [completed, setCompleted] = useState<Completed>(null)
  const [statusSel, setStatusSel] = useState<'all' | 'active' | 'due' | 'inactive'>('all')
  const [menu, setMenu] = useState<Pillar | null>(null)
  const [search, setSearch] = useState('')
  const [who, setWho] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [notify, setNotify] = useState<{ list: Company[]; focus: Pillar | null } | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [busy, setBusy] = useState(false)
  const [stateRows, setStateRows] = useState<StateRow[]>([])
  const [logs, setLogs] = useState<LogRow[]>([])
  /** true when db/renewal-hub.sql has not been run yet (or the tables cannot be read) */
  const [noStore, setNoStore] = useState(false)
  // Day counts depend on today's date, which differs between server and browser: compute after mount only
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  const [openedAt] = useState(() => Date.now())

  const load = useCallback(async () => {
    const db = createClient()
    const [s, l] = await Promise.all([
      db.from('renewal_service_state').select('company_id, service, workflow, stage'),
      db.from('renewal_logs').select('*').order('created_at', { ascending: false }).limit(1000),
    ])
    setNoStore(!!(s.error || l.error))
    setStateRows((s.data as StateRow[]) || [])
    setLogs((l.data as LogRow[]) || [])
  }, [])
  useEffect(() => { void Promise.resolve().then(load) }, [load])

  if (!mounted) return null

  const rowsMap = new Map(stateRows.map(r => [`${r.company_id}:${r.service}`, r]))
  const svc = (c: Company, p: PillarDef) => serviceOf(c, p, rowsMap)
  const pool = who ? companies.filter(c => (who === '__none' ? !c.created_by : c.created_by === who)) : companies
  const byId = new Map(pool.map(c => [c.id, c]))
  const poolLogs = logs.filter(l => byId.has(l.company_id))
  const doneLogs = poolLogs.filter(l => l.kind === 'completed')
  const sentLogs = poolLogs.filter(l => l.kind === 'notified')
  const weekAgo = openedAt - 7 * 86400000
  const notifiedIds = new Set(sentLogs.filter(l => new Date(l.created_at).getTime() >= weekAgo).map(l => l.company_id))
  const lastSent = (c: Company) => sentLogs.find(l => l.company_id === c.id)
  const def = pillar ? pillarOf(pillar) : null

  const overall = (c: Company): State => {
    const states = PILLARS.map(p => svc(c, p).state)
    return states.includes('due') ? 'due' : states.includes('active') ? 'active' : states.includes('inactive') ? 'inactive' : 'none'
  }
  const inKpi = (c: Company, k: Kpi) => {
    if (k === 'total') return true
    if (k === 'notified') return notifiedIds.has(c.id)
    return PILLARS.some(p => {
      const { days, state } = svc(c, p)
      if (days === null || state === 'inactive') return false
      return k === 'overdue' ? days < 0 : k === 'd30' ? days >= 0 && days <= 30 : days >= 31 && days <= 90
    })
  }
  const urgency = (c: Company) => {
    const days = (def ? [def] : PILLARS).map(p => svc(c, p)).filter(s => s.state !== 'inactive' && s.days !== null).map(s => s.days as number)
    return days.length ? Math.min(...days) : Number.MAX_SAFE_INTEGER
  }
  const matches = (c: Company, serial: number) =>
    matchesQuery(search, serial, [c.company_id, c.company_name, c.cr_number, c.misa_license_no, c.rjsc_reg_no, c.tin_number, phoneOf(c), c.official_email])

  const list = pool
    .filter((c, i) => matches(c, pool.length - i))
    .filter(c => statusSel === 'all' || (def ? svc(c, def).state : overall(c)) === statusSel)
    .filter(c => (def ? scope === 'all' || svc(c, def).state === scope : inKpi(c, kpi)))
    .sort((a, b) => urgency(a) - urgency(b))

  const logList = doneLogs.filter(l => {
    if (completed !== 'all' && l.service !== completed) return false
    const c = byId.get(l.company_id)!
    return matches(c, 0)
  })

  const total = completed ? logList.length : list.length
  const pages = Math.max(1, Math.ceil(total / PAGE))
  const cur = Math.min(page, pages)
  const slice = <T,>(a: T[]) => a.slice((cur - 1) * PAGE, cur * PAGE)

  function clearView() { setSelected([]); setMenu(null); setPage(1) }
  function reset() { setKpi('total'); setPillar(null); setScope('all'); setCompleted(null); setStatusSel('all'); setSearch(''); clearView() }
  function pickKpi(k: Kpi) { setKpi(k); setPillar(null); setScope('all'); setCompleted(null); clearView() }
  function pickPillar(p: Pillar, s: State | 'all') { setPillar(p); setScope(s); setCompleted(null); setKpi('total'); setStatusSel('all'); clearView() }
  function pickCompleted(c: 'all' | Pillar) { setCompleted(c); setPillar(null); setKpi('total'); clearView() }

  async function saveState(c: Company, p: PillarDef, patch: { workflow?: string; stage?: string }) {
    const s = svc(c, p)
    const row = { company_id: c.id, service: p.key, workflow: s.workflow, stage: s.stage || null, ...patch }
    const { error } = await createClient().from('renewal_service_state').upsert({ ...row, updated_at: new Date().toISOString() })
    if (error) { alert('Could not save: ' + error.message); return }
    await load()
  }

  // Moves real expiry dates, so it always asks first
  async function complete(c: Company, items: PillarDef[]) {
    const todo = items.map(p => ({ p, s: svc(c, p) })).filter(x => x.s.date)
    if (!todo.length) { alert('No due date saved for this company'); return }
    const nextYear = (d: string) => `${Number(d.slice(0, 4)) + 1}${d.slice(4) === '-02-29' ? '-02-28' : d.slice(4)}`
    const summary = todo.map(x => `${x.s.doc}: ${x.s.date} → ${nextYear(x.s.date)}`).join('\n')
    if (!window.confirm(`Mark as completed and move +1 year?\n\n${c.company_name} (${c.company_id})\n${summary}`)) return
    setBusy(true)
    const patch: Partial<Company> = {}
    for (const { p, s } of todo) {
      const { data, error } = await createClient().rpc('complete_renewal', { p_company: c.id, p_service: p.key, p_field: s.field, p_prev: s.date })
      if (error) { alert('Could not complete: ' + error.message); break }
      patch[s.field] = data as string
    }
    if (Object.keys(patch).length) onCompanyChange({ ...c, ...patch })
    await load()
    setBusy(false)
  }

  async function change(c: Company, p: PillarDef, workflow: string) {
    if (workflow === 'Completed (+1 Yr)') await complete(c, [p])
    else await saveState(c, p, { workflow })
  }

  async function logSent(c: Company, picked: Pillar[], channel: Channel, lang: Lang) {
    if (noStore) return
    const db = createClient()
    const { error } = await db.from('renewal_logs').insert({ company_id: c.id, kind: 'notified', services: picked.map(k => pillarOf(k).short).join(' + '), channel, language: lang })
    if (error) { alert('The reminder opened, but the log was not saved: ' + error.message); return }
    const pending = picked.filter(k => svc(c, pillarOf(k)).workflow === 'Pending / Due')
    if (pending.length) await db.from('renewal_service_state').upsert(pending.map(k => ({ company_id: c.id, service: k, workflow: 'Notified', stage: svc(c, pillarOf(k)).stage || null })))
    await load()
  }

  const cards: { key: Kpi | 'completed'; label: string; hint: string; pill: string; value: number; icon: typeof Clock; text: string; chip: string }[] = [
    { key: 'total', label: 'Total Companies', hint: 'Registered for renewal', pill: `${pool.filter(c => overall(c) === 'active').length} Active`, value: pool.length, icon: Building2, text: 'text-[#1e3a8a]', chip: 'bg-[#eff6ff]' },
    { key: 'overdue', label: 'Overdue (Action Required)', hint: 'Past renewal or audit due date', pill: 'Urgent', value: pool.filter(c => inKpi(c, 'overdue')).length, icon: AlertTriangle, text: 'text-red-700', chip: 'bg-red-50' },
    { key: 'd30', label: 'Due Within 30 Days', hint: 'Immediate client follow-up', pill: '0–30 Days', value: pool.filter(c => inKpi(c, 'd30')).length, icon: Clock, text: 'text-amber-700', chip: 'bg-amber-50' },
    { key: 'd90', label: 'Due 31–90 Days', hint: 'Upcoming document collection', pill: '31–90 Days', value: pool.filter(c => inKpi(c, 'd90')).length, icon: CalendarRange, text: 'text-sky-700', chip: 'bg-sky-50' },
    { key: 'notified', label: 'Notified This Week', hint: 'Reminders sent to clients', pill: 'Last 7 Days', value: notifiedIds.size, icon: Send, text: 'text-[#4338ca]', chip: 'bg-[#eef2ff]' },
    { key: 'completed', label: 'Completed Works', hint: 'Total +1 Yr renewals & audits', pill: 'View History', value: doneLogs.length, icon: CheckCircle2, text: 'text-emerald-800', chip: 'bg-emerald-100' },
  ]

  const pill = (on: boolean) => `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${on ? 'bg-[#1e3a8a] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`

  const dateBadge = (s: Service) => {
    if (!s.date || s.days === null) return <span className="text-[11px] text-slate-400">No date</span>
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-slate-700">{s.date}</span>
        <span className={`w-fit px-2 py-0.5 rounded-full border text-[10.5px] font-bold ${s.state === 'inactive' ? STATE_UI.inactive.cls : daysTone(s.days)}`}>{daysText(s.days)}</span>
      </div>
    )
  }

  const workflowSelect = (c: Company, p: PillarDef) => {
    const s = svc(c, p)
    return (
      <select value={s.workflow} disabled={noStore || busy} onChange={e => change(c, p, e.target.value)} aria-label={`${p.label} workflow`} className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer w-fit disabled:cursor-default disabled:opacity-60 ${workflowTone(s.workflow)}`}>
        {WORKFLOWS.filter(w => canEdit || w !== 'Completed (+1 Yr)' || s.workflow === w).map(w => <option key={w} value={w}>{w}</option>)}
      </select>
    )
  }

  const stageSelect = (c: Company, p: PillarDef) => {
    const s = svc(c, p)
    return (
      <select value={s.stage} disabled={noStore || busy} onChange={e => saveState(c, p, { stage: e.target.value })} aria-label={`${p.label} stage`} className={`text-[11px] font-semibold px-2 py-1 rounded-lg border cursor-pointer w-fit disabled:cursor-default disabled:opacity-60 ${s.stage === SUSPENDED ? STATE_UI.inactive.cls : 'bg-[#eff6ff] text-[#1e3a8a] border-[#bfdbfe]'}`}>
        <option value="">Stage…</option>
        {p.stages!.map(st => <option key={st} value={st}>{st}</option>)}
      </select>
    )
  }

  const lastCell = (c: Company) => {
    const l = lastSent(c)
    if (!l) return <span className="text-[11.5px] text-slate-400 italic">Not Notified</span>
    return (
      <div className="flex flex-col gap-0.5">
        <span className="w-fit px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{l.channel} • {l.services}</span>
        <span className="text-[10.5px] text-slate-400">{dayOf(l.created_at)}</span>
      </div>
    )
  }

  const actions = (c: Company) => (
    <div className="inline-flex items-center justify-end gap-1.5">
      <button type="button" onClick={() => setNotify({ list: [c], focus: pillar })} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm ${def ? def.tone.button : 'bg-[#1e3a8a] hover:bg-[#1d4ed8]'}`}>
        <Bell className="w-3.5 h-3.5" />Notify Client
      </button>
      {canEdit && !noStore && (
        <button type="button" disabled={busy} title={def ? 'Mark complete and move +1 year' : 'Mark due services complete and move +1 year'}
          onClick={() => {
            if (def) { complete(c, [def]); return }
            const due = PILLARS.filter(p => svc(c, p).state === 'due')
            if (!due.length) { alert('Nothing is due for this company. Open a service tab to renew it early.'); return }
            complete(c, due)
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-50">
          <CheckCircle2 className="w-3.5 h-3.5" />+1 Yr
        </button>
      )}
      {rowTools?.(c)}
    </div>
  )

  const pageRows = slice(list)
  const heads = def
    ? ['SL', 'Company & ID', def.refLabel, def.stages ? 'Workflow & Audit Stage' : 'Workflow & State', `${def.short} Due`, 'Last Notified', 'Actions']
    : ['Company & Registrations', ...PILLARS.map(p => `${p.n}. ${p.label}`), 'Last Notified', 'Actions']
  const allPicked = list.length > 0 && list.every(c => selected.includes(c.id))
  const ownerLine = (c: Company) => isAdmin && <div className="mt-1"><OwnerTag name={c.created_by ? (owners[c.created_by] || 'Unknown') : null} avatar={c.created_by ? ownerAvatars[c.created_by] : null} /></div>
  const th = 'py-3.5 px-3 text-left font-bold whitespace-nowrap'

  return (
    <div className="space-y-5">
      {noStore && (
        <div className="px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 text-xs text-amber-900">
          Workflow status, +1 Yr and the history need a database update. Run <b>db/renewal-hub.sql</b> in the Supabase SQL editor, then reload this page.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3.5">
        {cards.map(k => {
          const on = k.key === 'completed' ? !!completed : !completed && !pillar && kpi === k.key
          return (
            <button key={k.key} type="button" onClick={() => (k.key === 'completed' ? pickCompleted('all') : pickKpi(k.key))} className={`flex flex-col justify-between text-left p-4 rounded-2xl shadow-sm hover:shadow-md transition-all ${k.key === 'completed' ? 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70' : 'bg-white'} ${on ? `border-2 ${k.key === 'completed' ? 'border-emerald-600' : 'border-[#1e3a8a]'}` : `border ${k.key === 'completed' ? 'border-emerald-200' : 'border-slate-200'}`}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${k.text}`}>{k.label}</span>
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${k.chip} ${k.text}`}><k.icon className="w-4 h-4" /></span>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between gap-2">
                <span className="text-2xl font-extrabold text-slate-800">{k.value}</span>
                <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${k.chip} ${k.text}`}>{k.pill}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{k.hint}</p>
            </button>
          )
        })}
      </div>

      {/* Completed works counter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0"><Award className="w-4 h-4" /></span>
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Completed Works Counter (4-Pillar Summary)</h2>
            <p className="text-[11px] text-slate-500">Click any service counter to inspect its permanently logged <b className="text-emerald-700">+1 Yr</b> completed companies</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 flex-1 xl:max-w-4xl">
          {PILLARS.map(p => (
            <button key={p.key} type="button" onClick={() => pickCompleted(p.key)} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left ${p.tone.box} ${completed === p.key ? 'ring-2 ring-emerald-600' : ''}`}>
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-wider">{p.short} Completed</span>
                <span className="text-[10.5px] opacity-80">{p.completedHint}</span>
              </span>
              <span className="text-base font-extrabold bg-white px-2.5 py-0.5 rounded-lg">{doneLogs.filter(l => l.service === p.key).length}</span>
            </button>
          ))}
          <button type="button" onClick={() => pickCompleted('all')} className={`col-span-2 sm:col-span-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 text-left ${completed === 'all' ? 'ring-2 ring-emerald-600' : ''}`}>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">All Completed</span>
              <span className="text-[10.5px] text-slate-500">Full log</span>
            </span>
            <span className="text-base font-extrabold text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg">{doneLogs.length}</span>
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search company name, ID, MISA no., CR no., RJSC no., or ZATCA TIN..." className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1d4ed8]" />
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-medium text-slate-500">Showing <b className="text-slate-800">{total}</b> of <b className="text-slate-800">{completed ? doneLogs.length : pool.length}</b></span>
            {isAdmin && (
              <select value={who} onChange={e => { setWho(e.target.value); clearView() }} aria-label="Employee" className="font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2">
                <option value="">All employees</option>
                {Object.entries(owners).filter(([id]) => companies.some(c => c.created_by === id)).sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                {companies.some(c => !c.created_by) && <option value="__none">AL ZAHRA (no person)</option>}
              </select>
            )}
            <select value={statusSel} onChange={e => { setStatusSel(e.target.value as typeof statusSel); setCompleted(null); setPage(1) }} aria-label="Status" className="font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2">
              <option value="all">All Statuses</option>
              <option value="active">Active Companies</option>
              <option value="due">Due / Overdue</option>
              <option value="inactive">Inactive Companies</option>
            </select>
            <button type="button" onClick={() => setShowLogs(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"><History className="w-3.5 h-3.5" />Notification Logs ({sentLogs.length})</button>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"><RotateCcw className="w-3.5 h-3.5" />Reset / Overview</button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Quick Filter:</span>
          <button type="button" onClick={reset} className={pill(!pillar && !completed)}><Layers className="w-3.5 h-3.5" />All Pillars Overview</button>
          {PILLARS.map(p => (
            <div key={p.key} className="relative">
              <button type="button" onClick={() => setMenu(menu === p.key ? null : p.key)} className={pill(pillar === p.key)} aria-expanded={menu === p.key}>
                {p.n}. {p.label}
                {pillar === p.key && <span className="px-1.5 rounded-full text-[10px] font-bold bg-white/20">{scope === 'all' ? 'All' : STATE_UI[scope].label}</span>}
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>
              {menu === p.key && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenu(null)} />
                  <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">{p.n}. {p.label}</div>
                    {(['all', ...STATE_KEYS] as const).filter(s => s !== 'none' || pool.some(c => svc(c, p).state === 'none')).map(s => (
                      <button key={s} type="button" onClick={() => pickPillar(p.key, s)} className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-slate-700 font-medium">
                        <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${s === 'all' ? 'bg-slate-400' : STATE_UI[s].dot}`} />{s === 'all' ? 'All' : STATE_UI[s].label} Companies</span>
                        <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-600">{s === 'all' ? pool.length : pool.filter(c => svc(c, p).state === s).length}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => pickCompleted(p.key)} className="w-full px-3 py-2 mt-1 border-t border-slate-100 flex items-center justify-between font-bold text-emerald-700 hover:bg-emerald-50">
                      <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" />Completed History</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-100">{doneLogs.filter(l => l.service === p.key).length}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          <button type="button" onClick={() => pickCompleted('all')} className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${completed ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'}`}>
            <History className="w-3.5 h-3.5" />Completed Work Log ({doneLogs.length})
          </button>
          {def && (
            <div className="ml-auto flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['all', ...STATE_KEYS] as const).map(k => {
                const n = k === 'all' ? pool.length : pool.filter(c => svc(c, def).state === k).length
                if (k === 'none' && !n) return null
                return (
                  <button key={k} type="button" onClick={() => { setScope(k); setPage(1) }} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${scope === k ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                    {k === 'all' ? 'All' : STATE_UI[k].label} Companies ({n})
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {(def || completed) && (
          <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs ${def ? def.tone.badge : 'bg-emerald-50 border-emerald-300 text-emerald-900'}`}>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center shrink-0">{def ? <Layers className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}</span>
              <div>
              <span className="font-bold block">{def ? `${def.n}. ${def.label} — ${scope === 'all' ? 'All' : STATE_UI[scope].label} Companies` : `Completed Work Log — ${completed === 'all' ? 'All 4 Services' : pillarOf(completed!).label}`}</span>
              <span className="text-[11px] opacity-80">{def ? 'Pending → Notified → Confirmed / In Progress → Completed (+1 Yr)' : 'Permanent ledger of completed +1 Yr renewals and audits with old-to-new cycle dates.'}</span>
              </div>
            </div>
            <button type="button" onClick={reset} className="text-[11px] font-bold underline shrink-0">Reset / Overview</button>
          </div>
        )}

        {selected.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1e3a8a]">
            <span>{selected.length} companies selected</span>
            <span className="flex items-center gap-2">
              <button type="button" onClick={() => setNotify({ list: pool.filter(c => selected.includes(c.id)), focus: pillar })} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1e3a8a] text-white"><Send className="w-3.5 h-3.5" />Notify Selected</button>
              <button type="button" onClick={() => setSelected([])} className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-white">Clear</button>
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {completed ? (
            <table className="w-full text-xs border-collapse">
              <thead className="bg-emerald-50 text-emerald-950 text-[11px] uppercase tracking-wider">
                <tr>{['Log ID', 'Completed Date', 'Company & ID', 'Completed Service', 'License / Audit Ref', 'Previous Due → New Due (+1 Yr)', 'Completion Status'].map(h => <th key={h} className={th}>{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slice(logList).map(l => {
                  const c = byId.get(l.company_id)!
                  const p = pillarOf(l.service!)
                  return (
                    <tr key={l.id} className="hover:bg-emerald-50/40">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-500">CMP-{l.id}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-800 whitespace-nowrap">{dayOf(l.created_at)}</td>
                      <td className="py-3.5 px-3"><span className="font-bold text-[#1d4ed8] mr-2">{c.company_id}</span><span className="font-bold text-slate-800">{c.company_name}</span></td>
                      <td className="py-3.5 px-3"><span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${p.tone.badge}`}>{p.n}. {p.label}</span></td>
                      <td className="py-3.5 px-3 font-mono text-slate-700">{p.ref(c) ? `${p.refPrefix}: ${p.ref(c)}` : '—'}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono">
                        <span className="inline-flex items-center gap-2"><span className="text-slate-500 line-through">{l.prev_due}</span><ArrowRight className="w-3.5 h-3.5 text-emerald-600" /><span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{l.new_due}</span></span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" />{p.key === 'bd' ? 'DVC Filed' : p.key === 'sa' ? 'Filed (ZATCA)' : 'Renewed'} • +1 Yr</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-[13px] border-collapse min-w-[1000px]">
              <thead className={`text-[11px] uppercase tracking-wider ${def ? def.tone.head : 'bg-slate-50 text-slate-500'}`}>
                <tr>
                  <th className="py-3.5 pl-4 pr-2 w-9"><input type="checkbox" checked={allPicked} onChange={e => setSelected(e.target.checked ? list.map(c => c.id) : [])} aria-label="Select all" className="w-4 h-4 cursor-pointer" /></th>
                  {heads.map(h => <th key={h} className={`${th} ${h === 'Actions' ? 'text-right pr-4' : ''}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((c, i) => (
                  <tr key={c.id} className={`hover:bg-[#eff6ff]/35 ${selected.includes(c.id) ? 'bg-[#eff6ff]/50' : ''}`}>
                    <td className="py-3.5 pl-4 pr-2"><input type="checkbox" checked={selected.includes(c.id)} onChange={e => setSelected(prev => (e.target.checked ? [...prev, c.id] : prev.filter(x => x !== c.id)))} aria-label={`Select ${c.company_name}`} className="w-4 h-4 cursor-pointer" /></td>
                    {def && <td className="py-3.5 px-3 text-xs font-semibold text-slate-400">{(cur - 1) * PAGE + i + 1}</td>}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1d4ed8]">{c.company_id}</span>
                        <span className="font-bold text-slate-800">{c.company_name}</span>
                      </div>
                      {def ? (
                        <span className="block text-[11px] text-slate-500 mt-0.5">{[c.entity_type, phoneOf(c)].filter(Boolean).join(' • ')}</span>
                      ) : (
                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-2.5">
                          {PILLARS.slice(0, 3).map(p => <span key={p.key}>{p.refPrefix}: <b className="text-slate-700 font-mono">{p.ref(c) || '—'}</b></span>)}
                        </div>
                      )}
                      {ownerLine(c)}
                    </td>
                    {def ? (
                      <>
                        <td className="py-3.5 px-3 font-mono text-xs font-bold text-slate-800">{def.ref(c) || '—'}</td>
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-1">
                            {workflowSelect(c, def)}
                            {def.stages && stageSelect(c, def)}
                            <span className={`w-fit px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${STATE_UI[svc(c, def).state].cls}`}>{STATE_UI[svc(c, def).state].label}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {dateBadge(svc(c, def))}
                          {def.fields.length > 1 && svc(c, def).date && <div className="text-[10px] text-slate-400">{svc(c, def).doc}</div>}
                        </td>
                      </>
                    ) : (
                      PILLARS.map(p => (
                        <td key={p.key} className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {workflowSelect(c, p)}
                            {p.stages && stageSelect(c, p)}
                            {dateBadge(svc(c, p))}
                          </div>
                        </td>
                      ))
                    )}
                    <td className="py-3.5 px-3 whitespace-nowrap">{lastCell(c)}</td>
                    <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">{actions(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {total === 0 && (
          <div className="py-12 text-center text-xs text-slate-400">{completed ? 'No completed renewals yet' : 'No matching companies found'}</div>
        )}
        {total > PAGE && (
          <div className="flex items-center justify-between p-3 border-t border-slate-100 text-xs text-slate-600">
            <span>Showing <b>{(cur - 1) * PAGE + 1}</b> to <b>{Math.min(cur * PAGE, total)}</b> of <b>{total}</b></span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={cur === 1} onClick={() => setPage(cur - 1)} className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40">‹</button>
              <span>{cur} / {pages}</span>
              <button type="button" disabled={cur === pages} onClick={() => setPage(cur + 1)} className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>

      {notify && <RenewalNotifyDrawer companies={notify.list} focus={notify.focus} rows={rowsMap} onSent={logSent} onClose={() => { setNotify(null); setSelected([]) }} />}

      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45" onClick={() => setShowLogs(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Notification Log</h3>
              <button type="button" onClick={() => setShowLogs(false)} aria-label="Close" className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 max-h-96 overflow-y-auto space-y-2.5 text-xs">
              {sentLogs.map(l => {
                const c = byId.get(l.company_id)!
                return (
                  <div key={l.id} className="p-3 rounded-xl border border-slate-200 flex justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-800">{c.company_name} ({c.company_id})</div>
                      <div className="text-slate-500">{l.channel} reminder opened for {l.services}</div>
                    </div>
                    <span className="text-slate-400 shrink-0">{dayOf(l.created_at)}</span>
                  </div>
                )
              })}
              {!sentLogs.length && <p className="text-center text-slate-400 py-6">No reminders yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

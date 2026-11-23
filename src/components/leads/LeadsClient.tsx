'use client'
import { useMemo, useState } from 'react'
import IconSelect from '@/components/ui/IconSelect'
import Avatar from '@/components/ui/Avatar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, Pencil, Trash2, RotateCcw, Users, PhoneCall, Star, FileText, Handshake } from 'lucide-react'
import { Flag } from '@/components/ui/CountrySelect'
import { matchesQuery } from '@/lib/search'
import { LEAD_SOURCES, LEAD_STATUSES, isLeadOverdue, leadStatusTone, fmtLeadDate } from '@/lib/leadConfig'
import { useSecureDelete } from '@/components/ui/useSecureDelete'
import SourceIcon from '@/components/ui/SourceIcon'

interface Lead { id: string; lead_date?: string | null; lead_name: string; mobile?: string | null; country?: string | null; city?: string | null; company_name?: string | null; service_required?: string | null; source?: string | null; assigned_to?: string | null; status: string; follow_up_date?: string | null }

const PAGE = 10
const sel = 'px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700'

export default function LeadsClient({ leads, staff }: { leads: Lead[]; staff: { name: string; avatar: string | null }[] }) {
  const avatarOf = new Map(staff.map(x => [x.name, x.avatar] as const))
  const router = useRouter()
  const { askDelete, dialog } = useSecureDelete()
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [employee, setEmployee] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const shown = leads.map(l => ({ ...l, shownStatus: isLeadOverdue(l.status, l.follow_up_date) ? 'Overdue' : l.status }))
  const sources = useMemo(() => [...new Set([...LEAD_SOURCES, ...(leads.map(l => l.source).filter(Boolean) as string[])])], [leads])
  const countries = useMemo(() => [...new Set(leads.map(l => l.country).filter(Boolean) as string[])].sort(), [leads])

  const filtered = shown.filter((l, i) =>
    (!country || l.country === country) && (!status || l.shownStatus === status) && (!source || l.source === source) && (!employee || l.assigned_to === employee) &&
    (!from || (l.follow_up_date || '') >= from) && (!to || (!!l.follow_up_date && l.follow_up_date <= to)) &&
    matchesQuery(search, leads.length - i, [l.lead_name, l.mobile, l.company_name, l.service_required, l.country, l.city, l.source, l.assigned_to])
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const cur = Math.min(page, pages)
  const rows = filtered.slice((cur - 1) * PAGE, cur * PAGE)
  const reset = () => { setSearch(''); setCountry(''); setStatus(''); setSource(''); setEmployee(''); setFrom(''); setTo(''); setPage(1) }

  const count = (s: string) => leads.filter(l => l.status === s).length
  const cards = [
    { label: 'Total Leads', value: leads.length, icon: Users, tone: 'text-blue-600 bg-blue-50' },
    { label: 'Contacted', value: count('Contacted'), icon: PhoneCall, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Interested', value: count('Interested'), icon: Star, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Quotation', value: count('Quotation'), icon: FileText, tone: 'text-violet-600 bg-violet-50' },
    { label: 'Converted', value: count('Completed'), icon: Handshake, tone: 'text-teal-600 bg-teal-50' },
  ]

  async function remove(l: Lead) {
    if (await askDelete('leads', l.id, `the lead "${l.lead_name}"`)) router.refresh()
  }

  return (
    <div className="space-y-5 w-full max-w-[1600px] mx-auto">
      {dialog}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leads Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and manage your business leads efficiently</p>
        </div>
        <Link href="/dashboard/leads/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"><Plus className="w-4 h-4" /> Add New Lead</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(c => { const Icon = c.icon; return (
          <div key={c.label} className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between gap-2">
            <div><p className="text-xs font-medium text-slate-500">{c.label}</p><p className="text-2xl font-bold text-slate-900 mt-1">{c.value}</p></div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.tone}`}><Icon className="w-5 h-5" /></div>
          </div>) })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name, mobile or company..." className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <select value={country} onChange={e => { setCountry(e.target.value); setPage(1) }} className={sel}><option value="">All Countries</option>{countries.map(c => <option key={c}>{c}</option>)}</select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className={sel}><option value="">All Status</option>{[...LEAD_STATUSES, 'Overdue'].map(s => <option key={s}>{s}</option>)}</select>
        <select value={source} onChange={e => { setSource(e.target.value); setPage(1) }} className={sel}><option value="">All Sources</option>{sources.map(s => <option key={s}>{s}</option>)}</select>
        <div className="w-52"><IconSelect value={employee} onChange={v => { setEmployee(v); setPage(1) }} placeholder="All Employees" emptyLabel="All Employees" options={staff.map(x => ({ value: x.name, label: x.name, icon: <Avatar name={x.name} src={x.avatar} size={20} /> }))} className={`${sel} w-full`} /></div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">Follow-up
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} className={sel} /> –
          <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }} className={sel} />
        </div>
        <button onClick={reset} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs min-w-[1300px]">
          <thead className="bg-slate-50 text-slate-600 text-[11px] tracking-wide">
            <tr>{['#', 'Lead Name', 'Date', 'Mobile', 'Country', 'City', 'Company Name', 'Service Required', 'Source', 'Assigned To', 'Status', 'Follow-up Date', 'Action'].map(h => <th key={h} className="text-left font-semibold px-3 py-3 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((l, i) => { const t = leadStatusTone(l.shownStatus); return (
              <tr key={l.id} className="hover:bg-slate-50/70">
                <td className="px-3 py-3 text-slate-500">{(cur - 1) * PAGE + i + 1}</td>
                <td className="px-3 py-3 font-semibold text-slate-900">{l.lead_name}</td>
                <td className="px-3 py-3 font-mono text-slate-700 whitespace-nowrap">{fmtLeadDate(l.lead_date)}</td>
                <td className="px-3 py-3 font-mono text-slate-700 whitespace-nowrap">{l.mobile || '—'}</td>
                <td className="px-3 py-3 text-slate-700 whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><Flag country={l.country || ''} />{l.country || '—'}</span></td>
                <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{l.city || '—'}</td>
                <td className="px-3 py-3 text-slate-800">{l.company_name || '—'}</td>
                <td className="px-3 py-3 text-slate-700">{l.service_required || '—'}</td>
                <td className="px-3 py-3">{l.source ? <span className="inline-flex items-center gap-2 pr-2.5 pl-1 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 text-[11px] font-medium"><SourceIcon source={l.source} size={16} />{l.source}</span> : '—'}</td>
                <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{l.assigned_to ? <span className="inline-flex items-center gap-2"><Avatar name={l.assigned_to} src={avatarOf.get(l.assigned_to)} size={22} /><span>{l.assigned_to}</span></span> : '—'}</td>
                <td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${t.pill}`}><span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />{l.shownStatus}</span></td>
                <td className="px-3 py-3 font-mono text-slate-700 whitespace-nowrap">{fmtLeadDate(l.follow_up_date)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/dashboard/leads/${l.id}?view=1`} title="View" className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"><Eye className="w-3.5 h-3.5" /></Link>
                    <Link href={`/dashboard/leads/${l.id}`} title="Edit" className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"><Pencil className="w-3.5 h-3.5" /></Link>
                    <button onClick={() => remove(l)} title="Delete" className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>) })}
            {rows.length === 0 && <tr><td colSpan={11} className="text-center py-14 text-slate-400">No leads found. Click “Add New Lead”.</td></tr>}
          </tbody>
        </table>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-600">
          <span>Showing <b>{filtered.length ? (cur - 1) * PAGE + 1 : 0}</b> to <b>{Math.min(cur * PAGE, filtered.length)}</b> of <b>{filtered.length}</b> entries</span>
          <div className="flex items-center gap-1">
            <button disabled={cur === 1} onClick={() => setPage(cur - 1)} className="px-2.5 py-1.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50">‹</button>
            {Array.from({ length: pages }, (_, k) => k + 1).filter(n => n === 1 || n === pages || Math.abs(n - cur) <= 1).map((n, idx, arr) => (
              <span key={n} className="flex items-center">
                {idx > 0 && arr[idx - 1] !== n - 1 && <span className="px-1 text-slate-400">…</span>}
                <button onClick={() => setPage(n)} className={`min-w-8 px-2.5 py-1.5 rounded-md border text-xs font-semibold ${n === cur ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-slate-50'}`}>{n}</button>
              </span>
            ))}
            <button disabled={cur === pages} onClick={() => setPage(cur + 1)} className="px-2.5 py-1.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50">›</button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import Link from 'next/link'
import { matchesQuery } from '@/lib/search'
import PortalLogo from './PortalLogo'
import { useState } from 'react'
import { openFromR2 } from '@/lib/compress'
import { ExternalLink, Eye, EyeOff, Lock, Edit2, Search, CheckCircle2, Clock, AlertTriangle, AlertCircle, FileText } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Flag } from '@/components/ui/CountrySelect'
import OwnerBadge, { type Owner } from '@/components/ui/OwnerBadge'
import EditEntryModal from './EditEntryModal'

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-400">—</span>

  if (status === 'Green') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Compliant
      </span>
    )
  }
  if (status === 'Yellow') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Caution
      </span>
    )
  }
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    )
  }
  if (status === 'Warning') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Warning
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      {status === 'Urgent' || status === 'Expired' ? status : 'Overdue'}
    </span>
  )
}

function MilestoneBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-400">—</span>

  if (status === 'Completed' || status === 'Complete') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Completed
      </span>
    )
  }
  if (status === 'Pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3 h-3 text-blue-600" />
        In Progress
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
      <AlertCircle className="w-3 h-3 text-rose-600" />
      {status}
    </span>
  )
}

interface Props {
  stageId: string
  entries: any[]
  companies: any[]
  employees: any[]
  isUSACanada?: boolean
  isNameClearance?: boolean
  canEdit?: boolean
  isAdmin?: boolean
  /** admin only: staff user id -> staff details, for the "Reg. by" column */
  owners?: Record<string, Owner>
}

/** A saved password: hidden until the eye is pressed (it is stored as plain text, so this only keeps it from being read over a shoulder). */
function SecretCell({ value }: { value?: string | null }) {
  const [show, setShow] = useState(false)
  if (!value) return <>—</>
  return (
    <span className="inline-flex items-center gap-2 font-mono whitespace-nowrap">
      <span>{show ? value : '••••••••'}</span>
      <button type="button" onClick={() => setShow(v => !v)} title={show ? 'Hide' : 'Show'} className="text-slate-400 hover:text-slate-700">
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </span>
  )
}

const PAGE = 10

/** Dossier column: how many files are attached, click to see and open them. */
function DossierCell({ files }: { files: any }) {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const list: any[] = Array.isArray(files) ? files : []
  if (!list.length) return <>—</>
  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen(v => !v)} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100">
        <FileText className="w-3.5 h-3.5" /> {list.length} {list.length === 1 ? 'file' : 'files'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 text-xs">
          {list.map((f: any) => (
            <button key={f.key} type="button" onClick={async () => { setMsg(''); try { await openFromR2(f.key) } catch (e: any) { setMsg(e?.message || 'Could not open the file.') } }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 text-left">
              <ExternalLink className="w-3 h-3 text-blue-600 shrink-0" /><span className="truncate flex-1 text-slate-700">{f.name}</span>
            </button>
          ))}
          {msg && <div className="px-2 py-1 text-rose-600">{msg}</div>}
        </div>
      )}
    </div>
  )
}


/** Page numbers like the Leads list: ‹ 1 2 … 6 › */
function Pager({ total, cur, pages, onPage }: { total: number; cur: number; pages: number; onPage: (n: number) => void }) {
  if (total <= PAGE) return null
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-600">
      <span>Showing <b>{(cur - 1) * PAGE + 1}</b> to <b>{Math.min(cur * PAGE, total)}</b> of <b>{total}</b> entries</span>
      <div className="flex items-center gap-1">
        <button disabled={cur === 1} onClick={() => onPage(cur - 1)} className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50">‹</button>
        {Array.from({ length: pages }, (_, k) => k + 1).filter(n => n === 1 || n === pages || Math.abs(n - cur) <= 1).map((n, idx, arr) => (
          <span key={n} className="flex items-center">
            {idx > 0 && arr[idx - 1] !== n - 1 && <span className="px-1 text-slate-400">…</span>}
            <button onClick={() => onPage(n)} className={`min-w-8 px-2.5 py-1.5 rounded-md border text-xs font-semibold ${n === cur ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>{n}</button>
          </span>
        ))}
        <button disabled={cur === pages} onClick={() => onPage(cur + 1)} className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50">›</button>
      </div>
    </div>
  )
}

export default function StageTable({ stageId, entries: serverEntries, companies, employees, isUSACanada, isNameClearance, canEdit = true, isAdmin = false, owners = {} }: Props) {
  // who registered the company of a record (admin only); no person = registered under AL ZAHRA
  const ownerCell = (companyId: string) => {
    const by = companies.find(c => c.company_id === companyId)?.created_by
    return <td className="py-3 px-2 text-center w-px"><OwnerBadge owner={by ? (owners[by] || { name: 'Unknown' }) : null} /></td>
  }
  const noDates = stageId === '6' // Portals & Compliance is a checklist: no dates, timing or payment
  const [editEntry, setEditEntry] = useState<any>(null)
  // Staff cannot change a record once it is completed; admins always can
  // canEdit (the phase edit permission, or admin) also covers completed records; people without it never get an edit button
  const isLocked = (_e: any) => false
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  // Bangladesh Company Name: two groups, names that are Approved and the rest (Pending etc.)
  const [bdTab, setBdTab] = useState<'pending' | 'approved' | 'completed'>('pending')
  // completed = the whole Bangladesh company work is finished (Completion Date); approved = name Approved, work still running
  // Bangladesh phase, Completed tab: the company details are hidden to keep the list short
  const hideBd = () => stageId === '9' && bdTab === 'completed'
  // Name Approved tab: RJSC no., Issue No, Incorporation and the company block are hidden too
  const hideCo = () => ['9', '10', '3', '11'].includes(stageId)
  const hideRjsc = () => stageId === '9' && bdTab !== 'completed'
  const bdGroup = (e: any): 'pending' | 'approved' | 'completed' => (e.complete_date ? 'completed' : e.approval_status === 'Approved' ? 'approved' : 'pending')
  const entries = serverEntries

  const filtered = entries.filter((e, i) => {
    if (['9', '10', '2', '3', '4', '5', '6', '11'].includes(stageId) && bdGroup(e) !== bdTab) return false
    if (stageId === '8' && (e.approval_date ? 'completed' : 'pending') !== bdTab) return false
    const comp = companies.find(c => c.company_id === e.company_id)
    return matchesQuery(search, i + 1, [
      e.bd_company_name, e.approval_status, e.foreign_company_name, e.city, e.registration_no, e.account_email, e.account_username, e.rjsc_reg_no, e.issue_no, e.auditor_firm, e.company_id, e.companies?.company_name, e.companies?.country_of_origin, comp?.client_name, comp?.client_phone,
      e.client_name, e.client_phone, e.category, e.country, e.city, e.current_stage, e.name_clearance_number, e.entity_type,
    ])
  })

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const cur = Math.min(page, pages)
  const pageRows = filtered.slice((cur - 1) * PAGE, cur * PAGE)
  const pager = <Pager total={filtered.length} cur={cur} pages={pages} onPage={setPage} />

  if (isNameClearance) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Commercial Name Clearances</h3>
            <p className="text-xs text-slate-400">Trade name approvals and statutory validity tracking</p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Filter records..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
        </div>

        <div className="px-4 sm:px-6 pt-3 flex flex-wrap gap-2 border-b border-slate-100">
          {([['pending', 'Pending / Others', entries.filter(e => !e.approval_date).length], ['completed', 'Completed', entries.filter(e => e.approval_date).length]] as const).map(([k, label, n]) => (
            <button key={k} onClick={() => { setBdTab(k); setPage(1) }} className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 -mb-px transition ${bdTab === k ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {label} <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${bdTab === k ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{n}</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity Structure</th>
                {isAdmin && <th className="py-3 px-2 text-center whitespace-nowrap w-px" title="Registered by">Reg. by</th>}
                <th className="py-3 px-4">Clearance Number</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Approval Date</th>
                <th className="py-3 px-4">Expiration Date</th>
                <th className="py-3 px-4">Remaining Validity</th>
                <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-slate-400">No records found</td></tr>
              ) : pageRows.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{e.company_id}</div>
                    <div className="text-slate-500 text-[11px]">{e.companies?.company_name}{e.companies?.original_company_name && <span className="block text-[10px] text-slate-400">Previously: {e.companies.original_company_name}</span>}</div>
                  </td>
                  <td className="py-3 px-4">{e.entity_type || '—'}</td>
                  {isAdmin && ownerCell(e.company_id)}
                  <td className="py-3 px-4 font-mono font-medium text-slate-600">{e.name_clearance_number || '—'}</td>
                  <td className="py-3 px-4">{formatDate(e.submit_date)}</td>
                  <td className="py-3 px-4">{formatDate(e.approval_date)}</td>
                  <td className="py-3 px-4">{formatDate(e.expire_date)}</td>
                  <td className="py-3 px-4">
                    {e.remaining_days != null ? (
                      <span className={cn('font-semibold', e.remaining_days <= 30 ? 'text-rose-600' : e.remaining_days <= 40 ? 'text-amber-600' : 'text-emerald-600')}>
                        {e.remaining_days < 0 ? `Expired ${-e.remaining_days} days ago` : `${e.remaining_days} days`}
                      </span>
                    ) : '—'}
                    {e.expiry_stopped && <span title="CR Association is Complete: the countdown stopped on that day" className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">Stopped · CR complete</span>}
                  </td>
                  <td className="py-3 px-4">{e.expire_date ? <StatusBadge status={e.status} /> : '—'}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-32 truncate">{e.notes || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    {canEdit && isLocked(e) ? (<span title="Submitted — locked. Only an admin can edit." className="p-1.5 text-slate-300 inline-block"><Lock className="w-3.5 h-3.5" /></span>) : canEdit && (<button onClick={() => setEditEntry(e)} className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-400 hover:text-slate-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pager}
        {editEntry && <EditEntryModal isAdmin={isAdmin} stageId={stageId} entry={editEntry} companies={companies} employees={employees} isNameClearance onClose={() => setEditEntry(null)} />}
      </div>
    )
  }

  if (isUSACanada) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Cross-Border Foreign Licensing</h3>
            <p className="text-xs text-slate-400">United States and Canadian corporate verification dossiers</p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search cross-border files..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Category</th>
                {isAdmin && <th className="py-3 px-2 text-center whitespace-nowrap w-px" title="Registered by">Reg. by</th>}
                <th className="py-3 px-4 bg-blue-50/50">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">USA</span>
                    Filing Details
                  </span>
                </th>
                <th className="py-3 px-4 bg-blue-50/50">USA Submit</th>
                <th className="py-3 px-4 bg-blue-50/50">USA Target</th>
                <th className="py-3 px-4 bg-blue-50/50">USA Issued</th>
                <th className="py-3 px-4 bg-blue-50/50">USA SLA</th>
                <th className="py-3 px-4 bg-blue-50/50">USA Days</th>
                <th className="py-3 px-4 bg-blue-50/50">USA %</th>
                <th className="py-3 px-4 bg-blue-50/50">Payment</th>
                <th className="py-3 px-4 bg-red-50/40">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">CAN</span>
                    Filing Details
                  </span>
                </th>
                <th className="py-3 px-4 bg-red-50/40">CAN Submit</th>
                <th className="py-3 px-4 bg-red-50/40">CAN Target</th>
                <th className="py-3 px-4 bg-red-50/40">CAN Issued</th>
                <th className="py-3 px-4 bg-red-50/40">CAN SLA</th>
                <th className="py-3 px-4 bg-red-50/40">CAN Days</th>
                <th className="py-3 px-4 bg-red-50/40">CAN %</th>
                <th className="py-3 px-4 bg-red-50/40">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={22} className="text-center py-12 text-slate-400">No cross-border records found</td></tr>
              ) : pageRows.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{e.company_id}</div>
                    <div className="text-slate-500 text-[11px]">{e.companies?.company_name}{e.companies?.original_company_name && <span className="block text-[10px] text-slate-400">Previously: {e.companies.original_company_name}</span>}</div>
                  </td>
                  <td className="py-3 px-4">{e.category || '—'}</td>
                  {isAdmin && ownerCell(e.company_id)}
                  <td className="py-3 px-4 bg-blue-50/20 font-medium text-blue-700">{e.usa_type || '—'}</td>
                  <td className="py-3 px-4 bg-blue-50/20">{formatDate(e.usa_submit_date)}</td>
                  <td className="py-3 px-4 bg-blue-50/20">{formatDate(e.usa_target_date)}</td>
                  <td className="py-3 px-4 bg-blue-50/20">{formatDate(e.usa_complete_date)}</td>
                  <td className="py-3 px-4 bg-blue-50/20"><StatusBadge status={e.usa_status} /></td>
                  <td className="py-3 px-4">{e.usa_days_taken ?? '—'}</td>
                  <td className="py-3 px-4">{e.usa_completion_percent != null ? e.usa_completion_percent + '%' : '—'}</td>
                  <td className="py-3 px-4 bg-blue-50/20">
                    <span className={cn('px-2 py-0.5 rounded text-[11px] font-medium', e.usa_payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500')}>
                      {e.usa_payment_status || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 bg-red-50/10 font-medium text-rose-700">{e.canada_type || '—'}</td>
                  <td className="py-3 px-4 bg-red-50/10">{formatDate(e.canada_submit_date)}</td>
                  <td className="py-3 px-4 bg-red-50/10">{formatDate(e.canada_target_date)}</td>
                  <td className="py-3 px-4 bg-red-50/10">{formatDate(e.canada_complete_date)}</td>
                  <td className="py-3 px-4 bg-red-50/10"><StatusBadge status={e.canada_status} /></td>
                  <td className="py-3 px-4">{e.canada_days_taken ?? '—'}</td>
                  <td className="py-3 px-4">{e.canada_completion_percent != null ? e.canada_completion_percent + '%' : '—'}</td>
                  <td className="py-3 px-4 bg-red-50/10">
                    <span className={cn('px-2 py-0.5 rounded text-[11px] font-medium', e.canada_payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500')}>
                      {e.canada_payment_status || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canEdit && isLocked(e) ? (<span title="Submitted — locked. Only an admin can edit." className="p-1.5 text-slate-300 inline-block"><Lock className="w-3.5 h-3.5" /></span>) : canEdit && (<button onClick={() => setEditEntry(e)} className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-400 hover:text-slate-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pager}
        {editEntry && <EditEntryModal isAdmin={isAdmin} stageId={stageId} entry={editEntry} companies={companies} employees={employees} isUSACanada onClose={() => setEditEntry(null)} />}
      </div>
    )
  }

  // Standard workflow table
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Active Processing Records</h3>
          <p className="text-xs text-slate-400">Detailed compliance lifecycle records and timeline monitoring</p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search records..."
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
      </div>

      {['9', '10', '2', '3', '4', '5', '6', '11'].includes(stageId) && (
        <div className="px-4 sm:px-6 pt-3 flex flex-wrap gap-2 border-b border-slate-100">
          {([['pending', 'Pending / Others', entries.filter(e => bdGroup(e) === 'pending').length], ...(stageId === '9' ? [['approved', 'Name Approved', entries.filter(e => bdGroup(e) === 'approved').length] as const] : []), ['completed', 'Completed', entries.filter(e => bdGroup(e) === 'completed').length]] as const).map(([k, label, n]) => (
            <button key={k} onClick={() => { setBdTab(k); setPage(1) }} className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 -mb-px transition ${bdTab === k ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {label} <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${bdTab === k ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{n}</span>
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">No.</th>
              {stageId === '9' && (<>
                <th className="py-3 px-4">Bangladesh Company Name</th>
                <th className="py-3 px-4">Name Approval</th>
                <th className="py-3 px-4">Country</th>
                {!hideRjsc() && <th className="py-3 px-4">RJSC Reg. No.</th>}
                {!hideRjsc() && <th className="py-3 px-4">Issue No</th>}
                {!hideRjsc() && <th className="py-3 px-4">Incorporation</th>}
              </>)}
              {(stageId === '3' || stageId === '10' || stageId === '11') && (<>
                <th className="py-3 px-4">Foreign Company Name</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Registration No.</th>
                {(stageId === '3' || stageId === '11') && (<>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Password</th>
                </>)}
              </>)}
              {!hideCo() && <th className="py-3 px-4">Company Name</th>}
              {!hideBd() && <th className="py-3 px-4">Authorized Contact</th>}
              {!hideBd() && <th className="py-3 px-4">License Type</th>}
              {isAdmin && <th className="py-3 px-2 text-center whitespace-nowrap w-px" title="Registered by">Reg. by</th>}
              {['1', '2', '4', '6', '7'].includes(stageId) && (<>
                <th className="py-3 px-4">Country</th>
              </>)}
              {!noDates && !hideBd() && stageId !== '7' && <th className="py-3 px-4">Status</th>}
              {!noDates && stageId !== '7' && <th className="py-3 px-4">Submission</th>}
              {!noDates && !['1', '2', '3', '4', '5', '7', '9', '10', '11'].includes(stageId) && <th className="py-3 px-4">Target Date</th>}
              {stageId === '4' && (<>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Password</th>
              </>)}
              {!noDates && <th className="py-3 px-4">Completion</th>}
              {!noDates && <th className="py-3 px-4">Elapsed</th>}
              {!noDates && !['1', '2', '7', '9'].includes(stageId) && <th className="py-3 px-4">Payment</th>}
              {['3', '10', '11'].includes(stageId) && <th className="py-3 px-4">Payment Bank</th>}
              {noDates && <th className="py-3 px-4">Submission</th>}
              {noDates && <th className="py-3 px-4">Portal Accounts</th>}
              {stageId === '5' && <th className="py-3 px-4">CR Association</th>}
              <th className="py-3 px-4">Notes</th>
              {!['4', '5', '7'].includes(stageId) && <th className="py-3 px-4">Dossier</th>}
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.length === 0 ? (
              <tr><td colSpan={26} className="text-center py-12 text-slate-400">No active files found in this workflow module.</td></tr>
            ) : pageRows.map((e, idx) => (
              <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{(cur - 1) * PAGE + idx + 1}</td>
                {(stageId === '3' || stageId === '10' || stageId === '11') && (<>
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">{e.foreign_company_name || '—'}</td>
                  <td className="py-3 px-4"><span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Flag country={e.country} />{e.country || '—'}</span></td>
                  <td className="py-3 px-4 whitespace-nowrap">{e.city || '—'}</td>
                  <td className="py-3 px-4 font-mono">{e.registration_no || '—'}</td>
                  {(stageId === '3' || stageId === '11') && (<>
                    <td className="py-3 px-4 whitespace-nowrap">{e.account_email || '—'}</td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">{e.account_username || '—'}</td>
                    <td className="py-3 px-4"><SecretCell value={e.account_password} /></td>
                  </>)}
                </>)}
                {stageId === '9' && (<>
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">{e.bd_company_name || '—'}</td>
                  <td className="py-3 px-4"><span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold border', e.approval_status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>{e.approval_status === 'Approved' ? 'Approved' : 'Pending'}</span></td>
                  <td className="py-3 px-4"><span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Flag country={e.country} />{e.country || '—'}</span></td>
                  {!hideRjsc() && <td className="py-3 px-4 font-mono">{e.rjsc_reg_no || '—'}</td>}
                  {!hideRjsc() && <td className="py-3 px-4 font-mono">{e.issue_no || '—'}</td>}
                  {!hideRjsc() && <td className="py-3 px-4 whitespace-nowrap">{formatDate(e.incorporation_date)}</td>}
                </>)}
                {!hideCo() && (
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{e.company_id}</div>
                  <div className="text-slate-500 text-[11px]">{e.companies?.company_name}{e.companies?.original_company_name && <span className="block text-[10px] text-slate-400">Previously: {e.companies.original_company_name}</span>}</div>
                  <div className="text-slate-400 text-[10px] flex items-center gap-1"><Flag country={e.companies?.country_of_origin} />{e.companies?.country_of_origin}</div>
                </td>
                )}
                {!hideBd() && (<>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-800">{companies.find(c => c.company_id === e.company_id)?.client_name || e.client_name || '—'}</div>
                  <div className="text-slate-400 text-[11px] font-mono">{companies.find(c => c.company_id === e.company_id)?.client_phone || e.client_phone || ''}</div>
                </td>
                <td className="py-3 px-4">{e.category || '—'}</td>
                </>)}
                {isAdmin && ownerCell(e.company_id)}
                {['1', '2', '4', '6', '7'].includes(stageId) && (<>
                  <td className="py-3 px-4 text-slate-600">{e.country || '—'}</td>
                </>)}
                {!noDates && !hideBd() && stageId !== '7' && (                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {e.current_stage || '—'}
                  </span>
                </td>)}
                {!noDates && stageId !== '7' && <td className="py-3 px-4">{formatDate(e.submit_date)}</td>}
                {!noDates && !['1', '2', '3', '4', '5', '7', '9', '10', '11'].includes(stageId) && <td className="py-3 px-4">{formatDate(e.target_date)}</td>}
                {stageId === '4' && (<>
                  <td className="py-3 px-4 whitespace-nowrap">{e.misa_email || '—'}</td>
                  <td className="py-3 px-4"><SecretCell value={e.misa_email_password} /></td>
                  <td className="py-3 px-4 font-mono whitespace-nowrap">{e.misa_username || '—'}</td>
                  <td className="py-3 px-4"><SecretCell value={e.misa_username_password} /></td>
                </>)}
                {!noDates && <td className="py-3 px-4">{formatDate(e.complete_date)}</td>}
                {!noDates && (<td className="py-3 px-4 font-mono font-medium text-slate-800">
                  {e.days_taken != null ? `${e.days_taken}d` : '—'}
                </td>)}
                {!noDates && !['1', '2', '7', '9'].includes(stageId) && (<td className="py-3 px-4">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium',
                      e.payment_status === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {e.payment_status || '—'}
                  </span>
                </td>)}
                {['3', '10', '11'].includes(stageId) && <td className="py-3 px-4 whitespace-nowrap">{e.payment_bank || '—'}</td>}
                {noDates && <td className="py-3 px-4">{formatDate(e.submit_date)}</td>}
                {noDates && (
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">{((e.portal_accounts || []) as any[]).slice(0, 4).map((p, i) => <PortalLogo key={i} portal={p.portal} size={22} />)}</div>
                      <span className="text-[11px] text-slate-500">{(e.portal_accounts || []).length || 'None'}</span>
                      {(e.portal_accounts || []).length > 0 && <Link href={`/dashboard/portal-accounts/${e.id}`} title="Client PDF" className="p-1 rounded text-blue-600 hover:bg-blue-50"><FileText className="w-3.5 h-3.5" /></Link>}
                    </div>
                  </td>
                )}
                {stageId === '5' && <td className="py-3 px-4">{e.cr_status ? <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold border', e.cr_status === 'Complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>{e.cr_status}</span> : '—'}</td>}
                <td className="py-3 px-4 text-slate-400 max-w-28 truncate">{e.remarks || '—'}</td>
                {!['4', '5', '7'].includes(stageId) && (
                <td className="py-3 px-4">
                  <DossierCell files={e.dossier_files} />
                </td>
                )}
                <td className="py-3 px-4 text-right">
                  {canEdit && isLocked(e) ? (<span title="Submitted — locked. Only an admin can edit." className="p-1.5 text-slate-300 inline-block"><Lock className="w-3.5 h-3.5" /></span>) : canEdit && (<button onClick={() => setEditEntry(e)} className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-400 hover:text-slate-600">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pager}
      {editEntry && <EditEntryModal isAdmin={isAdmin} stageId={stageId} entry={editEntry} companies={companies} employees={employees} onClose={() => setEditEntry(null)} />}
    </div>
  )
}

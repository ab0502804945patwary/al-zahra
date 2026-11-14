'use client'
import { useState } from 'react'
import { ExternalLink, Edit2, Search, CheckCircle2, Clock, AlertTriangle, AlertCircle, FileText } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Flag } from '@/components/ui/CountrySelect'
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
}

export default function StageTable({ stageId, entries, companies, employees, isUSACanada, isNameClearance }: Props) {
  const [editEntry, setEditEntry] = useState<any>(null)
  const [search, setSearch] = useState('')

  const filtered = entries.filter(e =>
    !search ||
    e.companies?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.company_id?.toLowerCase().includes(search.toLowerCase()) ||
    e.client_name?.toLowerCase().includes(search.toLowerCase())
  )

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
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter records..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity Structure</th>
                <th className="py-3 px-4">Clearance Ref</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Approval Date</th>
                <th className="py-3 px-4">Expiration Date</th>
                <th className="py-3 px-4">Remaining Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">CR Association</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-400">No records found</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{e.company_id}</div>
                    <div className="text-slate-500 text-[11px]">{e.companies?.company_name}</div>
                  </td>
                  <td className="py-3 px-4">{e.entity_type || '—'}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-600">{e.name_clearance_number || '—'}</td>
                  <td className="py-3 px-4">{formatDate(e.submit_date)}</td>
                  <td className="py-3 px-4">{formatDate(e.approval_date)}</td>
                  <td className="py-3 px-4">{formatDate(e.expire_date)}</td>
                  <td className="py-3 px-4">
                    {e.remaining_days != null ? (
                      <span className={cn('font-semibold', e.remaining_days <= 30 ? 'text-rose-600' : e.remaining_days <= 40 ? 'text-amber-600' : 'text-emerald-600')}>
                        {e.remaining_days} days
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4"><StatusBadge status={e.status} /></td>
                  <td className="py-3 px-4"><MilestoneBadge status={e.cr_status} /></td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setEditEntry(e)} className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-400 hover:text-slate-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editEntry && <EditEntryModal stageId={stageId} entry={editEntry} companies={companies} employees={employees} isNameClearance onClose={() => setEditEntry(null)} />}
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
              onChange={e => setSearch(e.target.value)}
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
                <th className="py-3 px-4">Priority Tier</th>
                <th className="py-3 px-4 bg-blue-50/50">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">USA</span>
                    Filing Details
                  </span>
                </th>
                <th className="py-3 px-4 bg-blue-50/50">USA Submit</th>
                <th className="py-3 px-4 bg-blue-50/50">USA Issued</th>
                <th className="py-3 px-4 bg-blue-50/50">USA SLA</th>
                <th className="py-3 px-4 bg-blue-50/50">Payment</th>
                <th className="py-3 px-4 bg-red-50/40">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">CAN</span>
                    Filing Details
                  </span>
                </th>
                <th className="py-3 px-4 bg-red-50/40">CAN Submit</th>
                <th className="py-3 px-4 bg-red-50/40">CAN Issued</th>
                <th className="py-3 px-4 bg-red-50/40">CAN SLA</th>
                <th className="py-3 px-4 bg-red-50/40">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={15} className="text-center py-12 text-slate-400">No cross-border records found</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{e.company_id}</div>
                    <div className="text-slate-500 text-[11px]">{e.companies?.company_name}</div>
                  </td>
                  <td className="py-3 px-4">{e.category || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{e.priority || '—'}</td>
                  <td className="py-3 px-4 bg-blue-50/20 font-medium text-blue-700">{e.usa_type || '—'}</td>
                  <td className="py-3 px-4 bg-blue-50/20">{formatDate(e.usa_submit_date)}</td>
                  <td className="py-3 px-4 bg-blue-50/20">{formatDate(e.usa_complete_date)}</td>
                  <td className="py-3 px-4 bg-blue-50/20"><StatusBadge status={e.usa_status} /></td>
                  <td className="py-3 px-4 bg-blue-50/20">
                    <span className={cn('px-2 py-0.5 rounded text-[11px] font-medium', e.usa_payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500')}>
                      {e.usa_payment_status || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 bg-red-50/10 font-medium text-rose-700">{e.canada_type || '—'}</td>
                  <td className="py-3 px-4 bg-red-50/10">{formatDate(e.canada_submit_date)}</td>
                  <td className="py-3 px-4 bg-red-50/10">{formatDate(e.canada_complete_date)}</td>
                  <td className="py-3 px-4 bg-red-50/10"><StatusBadge status={e.canada_status} /></td>
                  <td className="py-3 px-4 bg-red-50/10">
                    <span className={cn('px-2 py-0.5 rounded text-[11px] font-medium', e.canada_payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500')}>
                      {e.canada_payment_status || '—'}
                    </span>
                  </td>
                                    <td className="py-3 px-4 text-right">
                    <button onClick={() => setEditEntry(e)} className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-400 hover:text-slate-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editEntry && <EditEntryModal stageId={stageId} entry={editEntry} companies={companies} employees={employees} isUSACanada onClose={() => setEditEntry(null)} />}
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
            onChange={e => setSearch(e.target.value)}
            placeholder="Search records..."
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">No.</th>
              <th className="py-3 px-4">Entity Portfolio</th>
              <th className="py-3 px-4">Authorized Contact</th>
              <th className="py-3 px-4">Classification</th>
              <th className="py-3 px-4">Priority Tier</th>
              <th className="py-3 px-4">Workflow Status</th>
              <th className="py-3 px-4">Submission</th>
              <th className="py-3 px-4">Target Date</th>
              <th className="py-3 px-4">Completion</th>
              <th className="py-3 px-4">Milestone</th>
              <th className="py-3 px-4">Elapsed</th>
              <th className="py-3 px-4">SLA Compliance</th>
              <th className="py-3 px-4">Fulfillment %</th>
              <th className="py-3 px-4">Payment</th>
                            <th className="py-3 px-4">Notes</th>
              <th className="py-3 px-4">Dossier</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.length === 0 ? (
              <tr><td colSpan={17} className="text-center py-12 text-slate-400">No active files found in this workflow module.</td></tr>
            ) : filtered.map((e, idx) => (
              <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{e.company_id}</div>
                  <div className="text-slate-500 text-[11px]">{e.companies?.company_name}</div>
                  <div className="text-slate-400 text-[10px] flex items-center gap-1"><Flag country={e.companies?.country_of_origin} />{e.companies?.country_of_origin}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-800">{e.client_name || '—'}</div>
                  <div className="text-slate-400 text-[11px] font-mono">{e.client_phone || ''}</div>
                </td>
                <td className="py-3 px-4">{e.category || '—'}</td>
                <td className="py-3 px-4 text-slate-500">{e.priority || '—'}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {e.current_stage || '—'}
                  </span>
                </td>
                <td className="py-3 px-4">{formatDate(e.submit_date)}</td>
                <td className="py-3 px-4">{formatDate(e.target_date)}</td>
                <td className="py-3 px-4">{formatDate(e.complete_date)}</td>
                <td className="py-3 px-4"><MilestoneBadge status={e.overdue_status} /></td>
                <td className="py-3 px-4 font-mono font-medium text-slate-800">
                  {e.days_taken != null ? `${e.days_taken}d` : '—'}
                </td>
                <td className="py-3 px-4"><StatusBadge status={e.status} /></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-100 rounded-full h-1.5">
                      <div
                        className={cn(
                          'h-1.5 rounded-full',
                          e.status === 'Green' ? 'bg-emerald-500' : e.status === 'Yellow' ? 'bg-amber-500' : 'bg-rose-500'
                        )}
                        style={{ width: `${e.completion_percent || 0}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600">{e.completion_percent || 0}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
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
                </td>
                                <td className="py-3 px-4 text-slate-400 max-w-28 truncate">{e.remarks || '—'}</td>
                <td className="py-3 px-4">
                  {e.drive_link ? (
                    <a href={e.drive_link} target="_blank" className="p-1 hover:bg-blue-50 rounded transition inline-flex text-blue-600">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : '—'}
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => setEditEntry(e)} className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-400 hover:text-slate-600">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editEntry && <EditEntryModal stageId={stageId} entry={editEntry} companies={companies} employees={employees} onClose={() => setEditEntry(null)} />}
    </div>
  )
}

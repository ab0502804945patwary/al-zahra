'use client'
import { useState } from 'react'
import { Plus, PlayCircle, CheckCircle2, Clock, AlertCircle, AlertTriangle, Layers } from 'lucide-react'
import AddEntryModal from './AddEntryModal'

interface Props {
  stageId: string
  config: {
    step?: string
    label: string
    category?: string
    employee?: string
    hasUSACanada?: boolean
    isNameClearance?: boolean
  }
  stats: { total: number; green: number; yellow: number; red: number; completed: number; pending: number }
  companies: any[]
  employees: any[]
  eligibleIds?: string[]
  canEdit?: boolean
  eligibilityHint?: string
}

export default function StageHeader({ stageId, config, stats, companies, employees, eligibleIds, eligibilityHint, canEdit = true }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [startFor, setStartFor] = useState<string | undefined>()
  // Companies that reached this stage and are waiting for the assigned staff to start
  const waiting = canEdit && eligibleIds ? companies.filter(c => eligibleIds.includes(c.company_id) && c.service_type !== 'renewal') : []
  const kpis = [
    { label: 'Total Files', value: stats.total, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'On Time', value: stats.green, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Caution (≤3d)', value: stats.yellow, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overdue', value: stats.red, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
  ]

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            {config.step && (
              <span className="text-[11px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                PHASE {config.step}
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {config.category || 'Licensing Workflow'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{config.label}</h1>
        </div>

        {canEdit ? (
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
        ) : (
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">View only — this stage is handled by another team member</span>
        )}
      </div>

      {/* KPI metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg}`}>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">{kpi.value}</div>
                <div className="text-[11px] text-slate-500">{kpi.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {waiting.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" /></span>
            <h2 className="text-sm font-bold text-amber-900">Waiting for you ({waiting.length})</h2>
            <span className="text-[11px] text-amber-700">These companies are ready for this stage — start work on them</span>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {waiting.map(c => (
              <li key={c.company_id} className="bg-white border border-amber-200/80 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{c.company_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{c.company_id}{c.entity_type ? ` · ${c.entity_type}` : ''}</div>
                </div>
                <button
                  onClick={() => { setStartFor(c.company_id); setShowModal(true) }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold rounded-lg"
                >
                  <PlayCircle className="w-3.5 h-3.5" /> Start
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showModal && (
        <AddEntryModal
          stageId={stageId}
          initialCompanyId={startFor}
          isUSACanada={config.hasUSACanada}
          isNameClearance={config.isNameClearance}
          companies={eligibleIds ? companies.filter(c => eligibleIds.includes(c.company_id)) : companies}
          eligibilityHint={eligibilityHint}
          employees={employees}
          onClose={() => { setShowModal(false); setStartFor(undefined) }}
        />
      )}
    </>
  )
}

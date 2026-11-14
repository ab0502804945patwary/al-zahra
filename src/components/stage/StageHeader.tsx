'use client'
import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Clock, AlertCircle, AlertTriangle, Layers } from 'lucide-react'
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
  eligibilityHint?: string
}

export default function StageHeader({ stageId, config, stats, companies, employees, eligibleIds, eligibilityHint }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [enrichedCompanies, setEnrichedCompanies] = useState<any[]>(companies)

  // Sync with companies stored in localStorage so freshly registered entities appear instantly
  useEffect(() => {
    try {
      const stored = localStorage.getItem('alzahra_companies_data')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEnrichedCompanies(prev => {
            const map = new Map<string, any>(prev.map(c => [c.company_id, c]))
            parsed.forEach((c: any) => {
              if (c.company_id) {
                map.set(c.company_id, { ...map.get(c.company_id), ...c })
              }
            })
            return Array.from(map.values())
          })
        }
      }
    } catch {}
  }, [])

  const kpis = [
    { label: 'Total Files', value: stats.total, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'On Track (≤10d)', value: stats.green, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Caution (11-13d)', value: stats.yellow, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overdue (>13d)', value: stats.red, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
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

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
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

      {showModal && (
        <AddEntryModal
          stageId={stageId}
          isUSACanada={config.hasUSACanada}
          isNameClearance={config.isNameClearance}
          companies={eligibleIds ? enrichedCompanies.filter(c => eligibleIds.includes(c.company_id)) : enrichedCompanies}
          eligibilityHint={eligibilityHint}
          employees={employees}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

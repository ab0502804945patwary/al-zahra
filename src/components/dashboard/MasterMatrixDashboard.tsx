'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Search,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Layers
} from 'lucide-react'
import { Company } from '@/lib/types'
import StatusGuide from '@/components/ui/StatusGuide'
import { phaseOf } from '@/lib/stageData'

interface StageSummary {
  status: 'Green' | 'Yellow' | 'Red' | 'Pending' | 'Not Started'
  label: string
  sublabel?: string
  days?: number
}

interface CompanyMatrixRow {
  id: string
  company_id: string
  company_name: string
  country_of_origin?: string
  entity_type?: string
  isRenewal: boolean
  stages: Record<number, StageSummary>
}

interface DashboardProps {
  stageMap: Record<string, Record<number, StageSummary>>
  initialCompanies: Company[]
  kpiStats: {
    totalCompanies: number
    compliant: number
    overdue: number
    expiring: number
  }
}

export default function MasterMatrixDashboard({ initialCompanies, kpiStats, stageMap }: DashboardProps) {
  const companiesList = initialCompanies
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'new' | 'renewal' | 'attention' | 'completed'>('all')

  // Build matrix rows for each company
  const matrixRows: CompanyMatrixRow[] = useMemo(() => {
    return companiesList.map(c => {
      const real = stageMap[c.company_id] || {}
      const stages: Record<number, StageSummary> = {}
      const isRenewal = c.service_type === 'renewal'
      for (let n = 1; n <= 9; n++) {
        if (real[n]) stages[n] = real[n]
        else if (isRenewal) stages[n] = { status: 'Not Started', label: '—' } // renewal: no stage handoff
        else if (n === 3 && c.entity_type === 'Service License') stages[n] = { status: 'Not Started', label: 'N/A' } // Service License skips Stage 3
        else stages[n] = { status: 'Not Started', label: 'Not started' }
      }

      return {
        id: c.id,
        company_id: c.company_id,
        company_name: c.company_name,
        country_of_origin: c.country_of_origin,
        entity_type: c.entity_type,
        isRenewal,
        stages,
      }
    })
  }, [companiesList, stageMap])

  // Filtered rows
  const filteredRows = useMemo(() => {
    return matrixRows.filter(row => {
      const q = search.toLowerCase()
      const matchesSearch =
        !search ||
        row.company_name?.toLowerCase().includes(q) ||
        row.company_id?.toLowerCase().includes(q) ||
        row.country_of_origin?.toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (filterType === 'new' && row.isRenewal) return false
      if (filterType === 'renewal' && !row.isRenewal) return false
      if (filterType === 'attention') {
        return Object.values(row.stages).some(s => s.status === 'Red')
      }
      if (filterType === 'completed') {
        return row.stages[1]?.status === 'Green' && row.stages[2]?.status === 'Green'
      }
      return true
    })
  }, [matrixRows, search, filterType])

  return (
    <div className="space-y-6 w-full max-w-[2000px] mx-auto">
      {/* 1. Header & Quick Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Master lifecycle tracking matrix for active corporate investor licenses & statutory clearances
          </p>
        </div>
      </div>

      {/* 2. Top 4 Simple Clean Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Companies */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Active Portfolios</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{companiesList.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Registered corporate entities</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* On Track (Green) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Compliant & On Track</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{kpiStats.compliant}</p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">On time (by target date)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue (Red) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Action Needed (Overdue)</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{kpiStats.overdue}</p>
            <p className="text-[11px] text-rose-600/80 mt-0.5">Exceeded target threshold (&gt;13d)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Trade Name Expiry Radar</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{kpiStats.expiring}</p>
            <p className="text-[11px] text-amber-600/80 mt-0.5">Expiring within 60 days</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. The Core Master Matrix Table (Excel-like clarity, zero clutter) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-sm">Master Investor Lifecycle Matrix</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                Live 9-Stage Tracker
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              One central view showing all client companies across the entire statutory approval chain
            </p>
          </div>

          {/* Search & Filter pills */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search AZC code, company..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterType === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({matrixRows.length})
              </button>
              <button
                onClick={() => setFilterType('new')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterType === 'new' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                New Company ({matrixRows.filter(r => !r.isRenewal).length})
              </button>
              <button
                onClick={() => setFilterType('renewal')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterType === 'renewal' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-violet-700'
                }`}
              >
                Renewal / Other ({matrixRows.filter(r => r.isRenewal).length})
              </button>
              <button
                onClick={() => setFilterType('attention')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterType === 'attention' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                Needs Action
              </button>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <th className="py-3 px-4 font-mono">Company</th>
                <th className="py-3 px-3 text-center">1: Parent</th>
                <th className="py-3 px-3 text-center">2: BD Company</th>
                <th className="py-3 px-3 text-center">3: Activity</th>
                <th className="py-3 px-3 text-center">4: Foreign</th>
                <th className="py-3 px-3 text-center">5: Name</th>
                <th className="py-3 px-3 text-center">6: MISA</th>
                <th className="py-3 px-3 text-center">7: CR</th>
                <th className="py-3 px-3 text-center">8: Portals</th>
                <th className="py-3 px-3 text-center">9: Filing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.map(row => (
                <tr key={row.company_id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Company Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-mono font-bold text-blue-700 text-xs shrink-0">
                        {row.company_id.replace('AZC', '')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-xs truncate max-w-44">
                          {row.company_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          <span className="font-mono text-slate-500 font-semibold">{row.company_id}</span>
                          {row.country_of_origin && <span> • {row.country_of_origin}</span>}
                          {row.isRenewal && <span className="ml-1.5 px-1.5 py-px rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-semibold">Renewal / Other</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 8 Stages Badges */}
                  {[1, 9, 2, 3, 8, 4, 5, 6, 7].map(stgNum => {
                    const stg = row.stages[stgNum] || { status: 'Not Started', label: 'Queued' }

                    let badgeClass = 'bg-slate-100 text-slate-400 border-slate-200'
                    if (stg.status === 'Green') {
                      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    } else if (stg.status === 'Yellow') {
                      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    } else if (stg.status === 'Red') {
                      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold'
                    }

                    return (
                      <td key={stgNum} className="py-3 px-2 text-center">
                        <Link
                          href={`/dashboard/stage/${stgNum}`}
                          title={`Click to open Phase ${phaseOf(stgNum)}`}
                          className={`inline-block px-2 py-1 rounded-md text-[10px] border transition whitespace-nowrap ${badgeClass}`}
                        >
                          {stg.label}
                        </Link>
                      </td>
                    )
                  })}
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="text-xs">No corporate entities found matching your filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100"><StatusGuide className="border-0 p-0" /></div>
        <div className="px-5 pb-2.5 text-[10px] text-slate-400 text-right">*Click any stage badge to open that department immediately</div>
      </div>
    </div>
  )
}

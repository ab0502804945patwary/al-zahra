'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Clock3, Search, TriangleAlert } from 'lucide-react'
import { MatrixIcon } from './MoneyIcons'
import { Flag } from '@/components/ui/CountrySelect'
import { Company } from '@/lib/types'
import { phaseOf, MENU_ORDER } from '@/lib/stageData'

const SHORT: Record<string, string> = { '1': 'Parent', '9': 'BD Company', '10': 'Foreign Mother', '2': 'Activity', '3': 'Foreign Sub 1', '11': 'Foreign Sub 2', '8': 'Name', '4': 'MISA', '5': 'CR', '6': 'Portals', '7': 'Filing' }

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
  inactive?: boolean
  stages: Record<number, StageSummary>
}

interface DashboardProps {
  stageMap: Record<string, Record<number, StageSummary>>
  initialCompanies: Company[]
}

const PAGE_SIZE = 5

/** Labels that mean "this phase does not apply to the company". */
const SKIPPED = ['N/A', 'Removed', '—']

const TONE = {
  Green: { box: 'bg-emerald-50', text: 'text-emerald-700' },
  Yellow: { box: 'bg-amber-50', text: 'text-amber-700' },
  Red: { box: 'bg-rose-50', text: 'text-rose-700' },
  Pending: { box: 'bg-blue-50', text: 'text-blue-700' },
  'Not Started': { box: '', text: 'text-slate-300' },
} as const

/** What one phase cell shows: days taken when complete, the current step while open, a small dot before it starts. */
function PhaseBox({ stg, stage }: { stg: StageSummary; stage: number }) {
  const base = 'w-full h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 px-0.5'
  if (stg.status === 'Not Started') {
    return (
      <span className={base}>
        {SKIPPED.includes(stg.label) ? <span className="text-[10px] text-slate-300">N/A</span> : <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
      </span>
    )
  }
  const complete = stg.label === 'Complete'
  // Company Name Clearance (8) shows the days left until the name expires
  const validity = stage === 8 && stg.label !== 'Expired'
  const text = complete ? (stg.days != null ? `${stg.days}d` : '') : validity ? stg.label.replace(' Left', ' left') : stg.label
  const Icon = stg.status === 'Red' ? TriangleAlert : complete || validity ? Check : Clock3
  const tone = TONE[stg.status]
  return (
    <span className={`${base} ${tone.box} ${tone.text}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
      {text && <span className="max-w-full text-[9.5px] font-semibold leading-[10px] text-center break-words line-clamp-2">{text}</span>}
    </span>
  )
}

export default function MasterMatrixDashboard({ initialCompanies, stageMap }: DashboardProps) {
  const companiesList = initialCompanies
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAll, setShowAll] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'new' | 'renewal' | 'attention' | 'completed'>('new')

  // Build matrix rows for each company
  const matrixRows: CompanyMatrixRow[] = useMemo(() => {
    return companiesList.map(c => {
      const real = stageMap[c.company_id] || {}
      const stages: Record<number, StageSummary> = {}
      const isRenewal = c.service_type === 'renewal'
      for (let n = 1; n <= 11; n++) {
        if (real[n]) stages[n] = real[n]
        else if (Array.isArray((c as any).skipped_phases) && (c as any).skipped_phases.includes(String(n))) stages[n] = { status: 'Not Started', label: 'Removed' }
        else if (isRenewal) stages[n] = { status: 'Not Started', label: '—' } // renewal: no stage handoff
        else if (c.entity_type === 'Others Service' && !((c as any).selected_phases || []).includes(String(n))) stages[n] = { status: 'Not Started', label: 'N/A' }
        else if (c.entity_type !== 'Others Service' && Array.isArray((c as any).selected_phases) && [3, 9, 10, 11].includes(n) && !(c as any).selected_phases.includes(String(n))) stages[n] = { status: 'Not Started', label: 'N/A' } // not ticked on the form
        else if (!Array.isArray((c as any).selected_phases) && (n === 3 || n === 10 || n === 11) && c.entity_type === 'Service License') stages[n] = { status: 'Not Started', label: 'N/A' } // older company: Service License skips the foreign phases
        else stages[n] = { status: 'Not Started', label: 'Not started' }
      }

      return {
        id: c.id,
        company_id: c.company_id,
        company_name: c.company_name,
        country_of_origin: c.country_of_origin,
        entity_type: c.entity_type,
        isRenewal,
        inactive: c.account_status === 'Inactive',
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

  // 5 companies at a time (Next / Previous), or everything with "Show all"
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages)
  const visibleRows = showAll ? filteredRows : filteredRows.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

  // up to five page numbers around the current page
  const firstPage = Math.max(1, Math.min(curPage - 2, totalPages - 4))
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => firstPage + i)
  const stepBtn = 'h-8 px-2.5 rounded-lg flex items-center gap-1 font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-700 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-default'
  const attention = matrixRows.filter(r => Object.values(r.stages).some(x => x.status === 'Red')).length
  const tabs = [
    { key: 'new' as const, label: 'New Company', n: matrixRows.filter(r => !r.isRenewal).length },
    { key: 'attention' as const, label: 'Needs Action', n: attention },
  ]
  const firstIndex = showAll ? 0 : (curPage - 1) * PAGE_SIZE
  const th = 'py-2.5 px-1.5 text-[11px] font-medium text-slate-500 align-middle'
  const td = 'px-1.5 py-2.5 align-middle'

  return (
    <div className="w-full">
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 min-w-0">
        {/* Title, filters, search: the same header as the other dashboard cards */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MatrixIcon className="w-7 h-7 shrink-0" /> Master Investor Lifecycle Matrix
          </h2>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* the chosen filter is filled with a medium colour; the other one stays plain */}
            {tabs.map(t => {
              const on = filterType === t.key
              const alert = t.key === 'attention'
              return (
                <button
                  key={t.key}
                  onClick={() => { setFilterType(t.key); setPage(1) }}
                  aria-pressed={on}
                  className={`h-9 flex items-center gap-2 px-3.5 rounded-xl text-[13px] font-semibold border transition ${
                    on ? (alert ? 'bg-rose-500 border-rose-500 text-white' : 'bg-blue-500 border-blue-500 text-white')
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                  <span className={`min-w-6 px-1.5 py-0.5 rounded-md text-[11px] font-bold text-center ${on ? 'bg-white/25 text-white' : alert && t.n > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{t.n}</span>
                </button>
              )
            })}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search AZC code, company..."
                className="w-full h-9 pl-10 pr-3 text-[13px] text-slate-900 placeholder:text-slate-500 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[1220px] table-fixed border-separate border-spacing-0 text-left">
            <thead>
              <tr className="[&>th]:bg-slate-50 [&>th:first-child]:rounded-l-xl [&>th:last-child]:rounded-r-xl">
                <th className={`${th} w-8 text-center`}>#</th>
                <th className={`${th} w-16`}>ID</th>
                <th className={th}>Company Name</th>
                <th className={`${th} w-28`}>Country</th>
                <th className={`${th} w-[74px]`}>Status</th>
                <th className={`${th} w-28`}>Type</th>
                {MENU_ORDER.map((id, i) => (
                  <th key={id} className={`${th} w-[62px] !px-0.5 text-center leading-tight`}>
                    <span className="block text-[11px] font-semibold text-slate-800">P{i + 1}</span>
                    <span className="block text-[9.5px] text-slate-500">{SHORT[id]}{id === '8' ? ' (Validity)' : ''}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
                <tr key={row.company_id} className="[&>td]:border-b [&>td]:border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <td className={`${td} text-center text-[11px] text-slate-400 tabular-nums`}>{firstIndex + i + 1}</td>
                  <td className={`${td} text-[11px] font-semibold text-blue-700 tabular-nums`}>{row.company_id}</td>
                  <td className={td}>
                    <div title={row.company_name} className="text-[12px] font-semibold leading-snug text-slate-900 line-clamp-2">{row.company_name}</div>
                    {row.isRenewal && <span className="inline-block mt-0.5 px-1.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-semibold">Renewal Company</span>}
                  </td>
                  <td className={td}>
                    {row.country_of_origin ? (
                      <span className="flex items-center gap-1.5 min-w-0 text-[11px] text-slate-700">
                        <Flag country={row.country_of_origin} />
                        <span title={row.country_of_origin} className="leading-tight line-clamp-2">{row.country_of_origin}</span>
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className={td}>
                    <span className={`flex items-center gap-1.5 text-[11px] ${row.inactive ? 'text-slate-400' : 'text-slate-700'}`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${row.inactive ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                      {row.inactive ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td className={td}>
                    {row.entity_type
                      ? <span className="text-[11px] text-slate-700 leading-tight">{row.entity_type}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  {MENU_ORDER.map(Number).map(stgNum => {
                    const stg = row.stages[stgNum] || { status: 'Not Started' as const, label: 'Queued' }
                    const tip = `Phase ${phaseOf(stgNum)}: ${stg.label}${stg.days != null ? ` (${stg.days} days)` : ''}`
                    return (
                      <td key={stgNum} className={`${td} !px-0.5 !py-1.5`}>
                        <Link href={`/dashboard/stage/${stgNum}`} title={tip} aria-label={tip} className="block rounded-xl hover:bg-slate-100">
                          <PhaseBox stg={stg} stage={stgNum} />
                        </Link>
                      </td>
                    )
                  })}
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr><td colSpan={MENU_ORDER.length + 6} className="py-12 text-center text-xs text-slate-400">No corporate entities found matching your filter</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredRows.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <span>Showing {showAll ? 1 : (curPage - 1) * PAGE_SIZE + 1}–{showAll ? filteredRows.length : Math.min(curPage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} companies</span>
              <button onClick={() => { setShowAll(v => !v); setPage(1) }} className="font-semibold text-blue-600 hover:text-blue-800">{showAll ? 'Show 5 at a time' : `Show all (${filteredRows.length})`}</button>
            </div>
            {!showAll && (
              <nav aria-label="Pages" className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                <button onClick={() => setPage(curPage - 1)} disabled={curPage === 1} aria-label="Previous page" className={stepBtn}><ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Previous</span></button>
                {pageNumbers.map(n => (
                  <button key={n} onClick={() => setPage(n)} aria-current={n === curPage ? 'page' : undefined} className={`w-8 h-8 rounded-lg font-semibold ${n === curPage ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>{n}</button>
                ))}
                <button onClick={() => setPage(curPage + 1)} disabled={curPage === totalPages} aria-label="Next page" className={stepBtn}><span className="hidden sm:inline">Next</span><ChevronRight className="w-4 h-4" /></button>
              </nav>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

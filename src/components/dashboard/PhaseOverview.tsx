import Link from 'next/link'
import { PhaseIcon } from './MoneyIcons'

export interface PhaseRow {
  id: string
  phase: number
  label: string
  employee: string
  total: number
  green: number
  yellow: number
  red: number
  avg: number | null
}

/** Ring split by timing status; the grey part is still pending. */
function ringOf(p: PhaseRow) {
  if (!p.total) return '#e6ecf5'
  const g = (p.green / p.total) * 100
  const y = g + (p.yellow / p.total) * 100
  const r = y + (p.red / p.total) * 100
  return `conic-gradient(#10b981 0% ${g}%, #fbbf24 ${g}% ${y}%, #f43f5e ${y}% ${r}%, #cbd5e1 ${r}% 100%)`
}

/** The one thing worth saying about a phase, worst first. */
function noteOf(p: PhaseRow) {
  if (!p.total) return { text: 'No files', tone: 'bg-slate-100 text-slate-500' }
  if (p.red) return { text: `${p.red} overdue`, tone: 'bg-rose-50 text-rose-700' }
  if (p.yellow) return { text: `${p.yellow} caution`, tone: 'bg-amber-50 text-amber-700' }
  if (p.green === p.total) return { text: 'All on time', tone: 'bg-emerald-50 text-emerald-700' }
  return { text: `${p.total - p.green} pending`, tone: 'bg-blue-50 text-blue-700' }
}

/** The investor workflow drawn as a path: one step per phase, in order. */
export default function PhaseOverview({ phases }: { phases: PhaseRow[] }) {
  const sum = (k: 'total' | 'green' | 'yellow' | 'red') => phases.reduce((a, r) => a + r[k], 0)
  const chips = [
    { label: 'Files', n: sum('total'), dot: 'bg-blue-600' },
    { label: 'On time', n: sum('green'), dot: 'bg-emerald-500' },
    { label: 'Caution', n: sum('yellow'), dot: 'bg-amber-400' },
    { label: 'Overdue', n: sum('red'), dot: 'bg-rose-500' },
  ]

  return (
    <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 via-white to-sky-50 border-b border-slate-100">
        <h2 className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
          <PhaseIcon className="w-6 h-6 shrink-0" /> Phase Overview
        </h2>
        <ul className="flex flex-wrap gap-2">
          {chips.map(c => (
            <li key={c.label} className="flex items-center gap-1.5 rounded-full bg-white border border-slate-200/80 px-3 py-1 text-[11px] text-slate-600">
              <span className={`w-2 h-2 rounded-full ${c.dot}`} /> {c.label} <b className="text-slate-900">{c.n}</b>
            </li>
          ))}
        </ul>
      </div>

      <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-y-5 py-5">
        {phases.map((p, i) => {
          const note = noteOf(p)
          return (
            <li key={p.id} className="relative min-w-0">
              {/* path to the next step */}
              {i < phases.length - 1 && <span aria-hidden className="hidden xl:block absolute top-[31px] left-[calc(50%+38px)] w-[calc(100%-76px)] border-t-2 border-dashed border-blue-200 [li:nth-child(6n)>&]:!hidden" />}
              <Link
                href={`/dashboard/stage/${p.id}`}
                title={`Phase ${p.phase}: ${p.label}\n${p.employee}\nOn time ${p.green} · Caution ${p.yellow} · Overdue ${p.red}${p.avg === null ? '' : `\nAverage completion ${p.avg}%`}`}
                className="group flex flex-col items-center text-center px-2"
              >
                <span className="relative w-16 h-16 rounded-full transition-transform group-hover:-translate-y-1" style={{ background: ringOf(p) }}>
                  <span className="absolute inset-[5px] rounded-full bg-white shadow-sm flex flex-col items-center justify-center leading-none">
                    <span className={`text-lg font-bold ${p.total ? 'text-slate-900' : 'text-slate-300'}`}>{p.total}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{p.total === 1 ? 'file' : 'files'}</span>
                  </span>
                  <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">{p.phase}</span>
                </span>
                <span className="mt-3 min-h-9 text-xs font-semibold leading-snug text-slate-800 line-clamp-2 group-hover:text-blue-700">{p.label}</span>
                <span className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${note.tone}`}>{note.text}</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

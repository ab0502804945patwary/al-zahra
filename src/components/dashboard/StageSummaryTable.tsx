import Link from 'next/link'

export interface StageSummaryRow {
  id: string
  label: string
  employee: string
  total: number
  green: number
  yellow: number
  red: number
  avg: number | null
}

export default function StageSummaryTable({ rows }: { rows: StageSummaryRow[] }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">Stage-wise Processing Summary</h2>
        <p className="text-[11px] text-slate-500">Green ≤10 days · Yellow 11-13 days · Red &gt;13 days</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Stage</th>
              <th className="py-2.5 px-4 font-semibold">Employee</th>
              <th className="py-2.5 px-3 font-semibold text-center">Total</th>
              <th className="py-2.5 px-3 font-semibold text-center text-emerald-600">Green</th>
              <th className="py-2.5 px-3 font-semibold text-center text-amber-600">Yellow</th>
              <th className="py-2.5 px-3 font-semibold text-center text-rose-600">Red</th>
              <th className="py-2.5 px-4 font-semibold">Avg Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className="py-2.5 px-4 font-medium text-slate-800">
                  <Link href={`/dashboard/stage/${r.id}`} className="hover:text-blue-600">{r.label}</Link>
                </td>
                <td className="py-2.5 px-4 text-slate-600">{r.employee}</td>
                <td className="py-2.5 px-3 text-center font-semibold">{r.total}</td>
                <td className="py-2.5 px-3 text-center text-emerald-700">{r.green}</td>
                <td className="py-2.5 px-3 text-center text-amber-700">{r.yellow}</td>
                <td className="py-2.5 px-3 text-center text-rose-700">{r.red}</td>
                <td className="py-2.5 px-4">
                  {r.avg === null ? <span className="text-slate-400">—</span> : (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${r.avg}%` }} />
                      </div>
                      <span className="font-semibold text-slate-700">{r.avg}%</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

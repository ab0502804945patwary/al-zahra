/** Colour legend for the timing status (same rules on every stage and on the dashboard). */
export default function StatusGuide({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] text-slate-600 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <span className="font-semibold text-slate-800">Status Guide:</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> On Time — finished by the target date, or more than 3 days left</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Caution — 1-3 days late, or 3 days or less left</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Overdue — more than 3 days late, or target passed</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Queued — not started</span>
      </div>
      <div className="mt-1 text-[10px] text-slate-400">No target date set: up to 10 days taken is green, 11-13 days yellow, more than 13 days red.</div>
    </div>
  )
}

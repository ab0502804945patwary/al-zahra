'use client'

/** Parent Entity Verification: Audit Report and Incorporation Update, both must be ticked. */
export default function ParentChecks({ form, set }: { form: Record<string, any>; set: (k: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {([['audit_report_done', 'Audit Report'], ['incorporation_update_done', 'Incorporation Update']] as const).map(([k, label]) => (
        <label key={k} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg bg-white cursor-pointer">
          <input type="checkbox" required className="w-4 h-4 accent-emerald-600" checked={String(form[k]) === 'true'} onChange={e => set(k, e.target.checked ? 'true' : '')} />
          {label}<span className="text-rose-500 -ml-1">*</span>
        </label>
      ))}
    </div>
  )
}

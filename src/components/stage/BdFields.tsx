'use client'
import CountrySelect from '@/components/ui/CountrySelect'

const input = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

/** Bangladesh company (RJSC) details used by Stage 9, in the add and edit forms. */
export default function BdFields({ form, set }: { form: Record<string, string>; set: (k: string, v: string) => void }) {
  const L = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
    <label className="text-xs font-medium text-slate-700 mb-1 block">{children}{req && <span className="text-rose-500 ml-0.5">*</span>}</label>
  )
  return (
    <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-slate-800">Bangladesh Company (RJSC)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-3">
        <div>
          <L req>Bangladesh Company Name</L>
          <input required className={input} value={form.bd_company_name || ''} onChange={e => set('bd_company_name', e.target.value)} />
        </div>
        <div>
          <L>Status</L>
          <select className={input} value={form.approval_status || 'Pending'} onChange={e => set('approval_status', e.target.value)}>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <L>Country</L>
          <CountrySelect value={form.country || 'Bangladesh'} onChange={v => set('country', v)} />
        </div>
        <div>
          <L>RJSC Registration No.</L>
          <input className={input} value={form.rjsc_reg_no || ''} onChange={e => set('rjsc_reg_no', e.target.value)} placeholder="e.g. C-208144" />
        </div>
        <div>
          <L>Issue No</L>
          <input className={input} value={form.issue_no || ''} onChange={e => set('issue_no', e.target.value)} />
        </div>
        <div>
          <L>Incorporation Date</L>
          <input type="date" className={input} value={form.incorporation_date || ''} onChange={e => set('incorporation_date', e.target.value)} />
        </div>
        <div>
          <L>Auditor / Firm</L>
          <input className={input} value={form.auditor_firm || ''} onChange={e => set('auditor_firm', e.target.value)} />
        </div>
        <div>
          <L>RJSC Annual Return Due Date</L>
          <input type="date" className={input} value={form.rjsc_return_due_date || ''} onChange={e => set('rjsc_return_due_date', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {([['audit_report_done', 'Audit Report'], ['incorporation_update_done', 'Incorporation Update']] as const).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg bg-white cursor-pointer">
            <input type="checkbox" required className="w-4 h-4 accent-emerald-600" checked={String(form[k]) === 'true'} onChange={e => set(k, e.target.checked ? 'true' : '')} />
            {label}<span className="text-rose-500 -ml-1">*</span>
          </label>
        ))}
      </div>
    </div>
  )
}

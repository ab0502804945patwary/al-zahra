'use client'

const input = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
const AUDIT_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Overdue']

type FieldDef = { key: string; label: string; type: 'text' | 'date' | 'status'; optional?: boolean; after?: string }

const CR_FIELDS: FieldDef[] = [
  { key: 'cr_number', label: 'CR Number', type: 'text' },
  { key: 'cr_issue_date', label: 'CR Issue Date', type: 'date' },
  { key: 'cr_expire_date', label: 'CR Expiry Date', type: 'date', after: 'cr_issue_date' },
]
const AUDIT_FIELDS: FieldDef[] = [
  { key: 'sa_last_audit_date', label: 'Last Audit Date', type: 'date' },
  { key: 'sa_audit_status', label: 'Audit Status', type: 'status' },
  { key: 'sa_next_audit_due', label: 'Next Audit Due Date', type: 'date', optional: true },
  { key: 'sa_financial_year', label: 'Financial Year', type: 'text' },
]
const ALL = [...CR_FIELDS, ...AUDIT_FIELDS]

/** The values already saved on the company, to fill the form */
export function crLicenseFrom(company: any): Record<string, string> {
  return Object.fromEntries(ALL.map(f => [f.key, company?.[f.key] || '']))
}

/** Arguments for set_company_cr_info, or null when everything is blank */
export function crLicenseArgs(form: Record<string, any>) {
  if (!form.company_id || !ALL.some(f => form[f.key])) return null
  return { p_company_id: form.company_id, p: Object.fromEntries(ALL.map(f => [f.key, form[f.key] || ''])) }
}

/** Commercial Registration: CR details and Saudi audit, saved to the company profile (add and edit forms). */
export default function CrLicense({ form, set, required = false }: { form: Record<string, string>; set: (k: string, v: string) => void; required?: boolean }) {
  const field = (f: FieldDef) => {
    const need = required && !f.optional
    return (
      <div key={f.key}>
        <label className="text-xs font-medium text-slate-700 mb-1 block">{f.label}{need && <span className="text-rose-500 ml-0.5">*</span>}</label>
        {f.type === 'status' ? (
          <select required={need} className={input} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)}>
            <option value="">Select Status</option>
            {AUDIT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <input type={f.type} required={need} min={f.after ? form[f.after] || undefined : undefined} className={input} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} autoComplete="off" />
        )}
      </div>
    )
  }

  return (
    <>
      <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-4 space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-800">Commercial Registration</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Saved to the company profile. Needed once a Completion Date is entered.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{CR_FIELDS.map(field)}</div>
      </div>
      <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-800">Saudi Audit Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{AUDIT_FIELDS.map(field)}</div>
      </div>
    </>
  )
}

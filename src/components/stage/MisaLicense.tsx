'use client'

const input = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

const FIELDS = [
  { key: 'misa_license_no', label: 'MISA License No.', type: 'text' },
  { key: 'misa_issue_date', label: 'MISA Issue Date', type: 'date' },
  { key: 'misa_expire_date', label: 'MISA Expiry Date', type: 'date' },
] as const

/** The values already saved on the company, to fill the form */
export function misaLicenseFrom(company: any): Record<string, string> {
  return Object.fromEntries(FIELDS.map(f => [f.key, company?.[f.key] || '']))
}

/** Arguments for set_company_misa_license, or null when all three are blank */
export function misaLicenseArgs(form: Record<string, any>) {
  if (!form.company_id || !FIELDS.some(f => form[f.key])) return null
  return { p_company_id: form.company_id, p_no: form.misa_license_no || null, p_issue: form.misa_issue_date || null, p_expire: form.misa_expire_date || null }
}

/** MISA Investment License: license number and dates, saved to the company profile (add and edit forms). */
export default function MisaLicense({ form, set, required = false }: { form: Record<string, string>; set: (k: string, v: string) => void; required?: boolean }) {
  return (
    <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-4 space-y-3">
      <div>
        <h3 className="text-xs font-semibold text-slate-800">MISA License</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Saved to the company profile. Needed once a Completion Date is entered.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="text-xs font-medium text-slate-700 mb-1 block">{f.label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
            <input type={f.type} required={required} min={f.key === 'misa_expire_date' ? form.misa_issue_date || undefined : undefined} className={input} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} autoComplete="off" />
          </div>
        ))}
      </div>
    </div>
  )
}

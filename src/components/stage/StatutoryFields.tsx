'use client'
import { Field } from './formFields'

// These identifiers are only known at the end of the process, so they are entered in Final Dossier & Filing
// (Stage 7) and saved to the company record.
export const STATUTORY_KEYS = [
  'cr_number', 'cr_issue_date', 'cr_expire_date',
  'misa_license_no', 'misa_issue_date', 'misa_expire_date',
  'tin_number',
] as const

export function statutoryFrom(company: any): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of STATUTORY_KEYS) out[k] = company?.[k] ?? ''
  return out
}

export default function StatutoryFields() {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
      <div>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Statutory &amp; Legal Identifiers</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Saved to the company profile when you save this record.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="CR Number" name="cr_number" />
        <Field label="CR Issue Date" name="cr_issue_date" type="date" />
        <Field label="CR Expiry Date" name="cr_expire_date" type="date" />
        <Field label="MISA License No." name="misa_license_no" />
        <Field label="MISA Issue Date" name="misa_issue_date" type="date" />
        <Field label="MISA Expiry Date" name="misa_expire_date" type="date" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="TIN Number" name="tin_number" />
      </div>
    </div>
  )
}

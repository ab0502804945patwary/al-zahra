'use client'
import { useContext } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { Field, Select, FormCtx } from './formFields'
import DossierFiles from './DossierFiles'

// These identifiers are only known at the end of the process, so they are entered in Final Dossier & Filing
// (Stage 7) and saved to the company record.
export const STATUTORY_KEYS = [
  'cr_number', 'cr_issue_date', 'cr_expire_date',
  'misa_license_no', 'misa_issue_date', 'misa_expire_date',
  'tin_number',
  'sa_last_audit_date', 'sa_audit_status', 'sa_next_audit_due', 'sa_financial_year', 'sa_auditor', 'sa_audit_notes',
] as const

const AUDIT_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Overdue']

/** Files go to the company as a list (not a plain text value like the keys above). */
export const statutoryPayload = (form: Record<string, any>) => {
  const st: Record<string, any> = {}
  for (const k of STATUTORY_KEYS) st[k] = form[k] || ''
  st.sa_audit_files = Array.isArray(form.sa_audit_files) ? form.sa_audit_files : []
  return st
}

export function statutoryFrom(company: any): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of STATUTORY_KEYS) out[k] = company?.[k] ?? ''
  ;(out as any).sa_audit_files = Array.isArray(company?.sa_audit_files) ? company.sa_audit_files : []
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

/** Saudi audit information, saved to the company profile together with the legal identifiers. */
export function AuditFields() {
  const { form, set } = useContext(FormCtx) as any
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Saudi Audit Information</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Last Audit Date" name="sa_last_audit_date" type="date" />
        <Select label="Audit Status" name="sa_audit_status" options={AUDIT_STATUSES.map(v => ({ value: v, label: v }))} />
        <Field label="Next Audit Due Date" name="sa_next_audit_due" type="date" />
        <Field label="Financial Year" name="sa_financial_year" />
      </div>
      <Field label="Auditor / Audit Firm Name" name="sa_auditor" />
      <DossierFiles label="Audit Report (upload files)" folder={`${form.company_id || 'unassigned'}_audit`} value={form.sa_audit_files} onChange={v => set('sa_audit_files', v as any)} />
      <Field label="Additional Information" name="sa_audit_notes" />
    </div>
  )
}

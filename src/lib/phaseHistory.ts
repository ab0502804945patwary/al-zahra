/**
 * What the MISA phase may see from the steps before it. Foreign Mother Company ('10') is left out on purpose,
 * and so are portal logins and passwords: only the columns listed here ever leave the server.
 */
export const HISTORY_PHASES: { stage: string; fields: [column: string, label: string, type?: 'date' | 'yesno'][] }[] = [
  { stage: '1', fields: [['country', 'Country'], ['city', 'City'], ['audit_report_done', 'Audit Report', 'yesno'], ['incorporation_update_done', 'Incorporation Update', 'yesno']] },
  {
    stage: '9',
    fields: [['bd_company_name', 'Bangladesh Company Name'], ['approval_status', 'Name Approval'], ['country', 'Country'], ['rjsc_reg_no', 'RJSC Reg. No.'], ['issue_no', 'Issue No'],
      ['incorporation_date', 'Incorporation Date', 'date'], ['auditor_firm', 'Auditor / Firm'], ['rjsc_return_due_date', 'Annual Return Due', 'date']],
  },
  { stage: '2', fields: [['country', 'Country'], ['city', 'City']] },
  { stage: '3', fields: [['foreign_company_name', 'Company Name'], ['country', 'Country'], ['city', 'City'], ['registration_no', 'Registration No.'], ['payment_status', 'Payment Status'], ['payment_bank', 'Payment Bank']] },
  { stage: '11', fields: [['foreign_company_name', 'Company Name'], ['country', 'Country'], ['city', 'City'], ['registration_no', 'Registration No.'], ['payment_status', 'Payment Status'], ['payment_bank', 'Payment Bank']] },
  { stage: '8', fields: [['name_clearance_number', 'Clearance Number'], ['company_name_english', 'English Name'], ['arabic_name', 'Arabic Name'], ['entity_type', 'Entity Structure'], ['approval_date', 'Approval Date', 'date'], ['expire_date', 'Expiry Date', 'date']] },
]

/** Columns every record can show */
export const HISTORY_COMMON: [column: string, label: string, type?: 'date' | 'yesno'][] = [
  ['current_stage', 'Status'], ['submit_date', 'Submission', 'date'], ['complete_date', 'Completion', 'date'], ['remarks', 'Remarks'], ['notes', 'Notes'],
]

export interface PhaseRecord {
  stage: string
  values: Record<string, unknown>
  files: { key: string; name: string; tag?: string }[]
}

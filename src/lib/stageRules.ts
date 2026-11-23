// Single source of truth for dropdown lists and stage flow rules.
// Mirrors the client's Google Sheet ("INVESTOR LICENSE" workbook).

export const COUNTRIES = ['Bangladesh', 'Pakistan', 'India', 'Afganistan', 'Sudan']
export const CATEGORIES = ['Service License', 'Trading License', 'Service to Trade']
/** Service to Trade follows the Trading License flow (it needs Foreign Entity too). */
const needsForeign = (c?: string) => c === 'Trading License' || c === 'Service to Trade'
export const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial']
export const PRIORITIES = [
  'BD Company Submited',
  'In-Corporation Send Arju',
  'BD Company Complete',
  'USA MOTHER COMPANY',
  'EGYPT',
  'Pakistan Company',
]
export const CR_STATUSES = ['Complete', 'Pending']
export const FOREIGN_FILING_OPTIONS = [
  'USA License Submit',
  'USA License Complete',
  'UK License Submit',
  'UK License Complete',
  'MEXICO License Submit',
  'MEXICO License Complete',
]
export const CANADA_OPTIONS = ['Canada License', 'SUBMIT', 'Pending', 'Not Submitted']

const DEFAULT_PHASES = ['Document Collection', 'Govt Collection', 'Payment Pending', 'Approved']

// "Current Stage" dropdown differs by stage.
export const PHASE_OPTIONS: Record<string, string[]> = {
  '1': [...DEFAULT_PHASES, 'PENDING'],
  '2': DEFAULT_PHASES,
  '3': DEFAULT_PHASES,
  '4': ['Application Submitted', 'Under MISA Review', 'Fully Completed'],
  '5': DEFAULT_PHASES,
  '6': ['SPL', 'QIWA', 'MUQEEM', 'GOSI CERTIFICATE', 'Chamber Of Commerce', 'VAT'],
  '7': DEFAULT_PHASES,
  '9': DEFAULT_PHASES,
  '10': DEFAULT_PHASES,
  '11': DEFAULT_PHASES,
}

export const toOptions = (list: string[]) => list.map(v => ({ value: v, label: v }))

// ---- Status rules (same for every stage) ----
export const GREEN_MAX_DAYS = 10
export const YELLOW_MAX_DAYS = 13

// ---- Eligibility: which companies may enter a stage ----
type AnyEntry = { company_id?: string; complete_date?: string | null; submit_date?: string | null; usa_complete_date?: string | null; approval_date?: string | null }

export type StageEntriesMap = Record<string, AnyEntry[]>

const has = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== ''

function done(entries: AnyEntry[] | undefined, companyId: string, field: 'complete_date' | 'usa_complete_date' | 'approval_date' = 'complete_date') {
  return (entries || []).some(e => e.company_id === companyId && has(e[field]))
}

function submittedAndDone(entries: AnyEntry[] | undefined, companyId: string) {
  return (entries || []).some(e => e.company_id === companyId && has(e.submit_date) && has(e.complete_date))
}

/**
 * Stage 4: Service  -> Stages 1, 9, 2, 8 complete
 *          Trading  -> Stages 1, 9, 2, 3 (USA/UK), 8 complete
 * Stage 5: Stage4 submit + complete dates present
 * Stage 6: Stage5 submit + complete dates present
 * Stage 7: Stage6 submit + complete dates present
 * Parallel start for a new company: Service License -> Stages 1, 9 (Bangladesh company), 2, 8. Trading License -> Stages 1, 9, 2, 3, 8. Stage 3 is Trading License only.
 * Stages 1,8: open to every company.
 */
// Phases that depend on what was ticked on the Company Register form (Bangladesh Company, Foreign Mother, 1 and 2 Foreign Subsidiary)
export const OPTIONAL_PHASES = ['9', '10', '3', '11']

export function isEligibleForStage(stageId: string, company: { company_id: string; entity_type?: string; category?: string; service_type?: string; selected_phases?: string[] | null }, all: StageEntriesMap): boolean {
  // Existing companies that only need renewal skip the handoff chain entirely.
  if (company.service_type === 'renewal') return true
  const id = company.company_id
  const category = company.category || company.entity_type
  // Ticked on the form: work goes only to the phases that were ticked. Older companies (nothing saved) keep the earlier rules.
  const picked = Array.isArray(company.selected_phases) ? company.selected_phases : null
  if (picked && OPTIONAL_PHASES.includes(stageId)) return picked.includes(stageId)
  switch (stageId) {
    case '4': {
      if (picked) {
        // MISA opens when Parent, Activity, Trade Name and every ticked phase are complete
        const doneStage = (sid: string) => (sid === '3' ? done(all['3'], id, 'usa_complete_date') : done(all[sid], id))
        return done(all['1'], id) && done(all['2'], id) && done(all['8'], id, 'approval_date') && picked.filter(s => OPTIONAL_PHASES.includes(s)).every(doneStage)
      }
      // MISA opens only when every parallel step is complete:
      //   Service License: Parent (1), Bangladesh Company (9), Activity (2), Trade Name (8)
      //   Trading License: the same plus Foreign Entity (3)
      const common = done(all['1'], id) && done(all['9'], id) && done(all['2'], id) && done(all['8'], id, 'approval_date')
      if (category === 'Service License') return common
      if (needsForeign(category)) return common && done(all['3'], id, 'usa_complete_date')
      return false
    }
    case '2':
      // Starts together with Stage 1 (and 8) for every new company
      return true
    case '3':
      // Foreign licensing is only needed for Trading License (Service License skips Stage 3); starts together with Stage 1
      return needsForeign(category)
    case '10':
    case '11':
      // foreign company phases (older companies): Trading License only
      return category === 'Trading License'
    case '5': return submittedAndDone(all['4'], id)
    case '6': return submittedAndDone(all['5'], id)
    case '7': return (all['6'] || []).some(e => e.company_id === id) // Portals & Compliance has no dates: a record there is enough
    default: return true
  }
}

export const ELIGIBILITY_HINT: Record<string, string> = {
  '2': 'Starts together with Stage 1 and Trade Name Clearance.',
  '3': 'Work arrives when 1 Foreign Subsidiary Company is ticked on the Company Register form.',
  '10': 'Work arrives when Foreign Mother Company is ticked on the Company Register form.',
  '11': 'Work arrives when 2 Foreign Subsidiary Company is ticked on the Company Register form.',
  '4': 'Opens when every earlier step is complete: Parent Entity, Activity Classification, Trade Name Clearance and every phase ticked for this company.',
  '5': 'Requires Stage 4 (MISA) submit and complete dates.',
  '6': 'Requires Stage 5 (Commercial Registration) submit and complete dates.',
  '7': 'Opens once the company has a Portals & Compliance (Stage 6) record.',
}

// ---- Columns that really exist in each Supabase stage table (see supabase-schema.sql) ----
const COMMON = ['company_id', 'client_name', 'client_phone', 'category', 'priority', 'current_stage', 'submit_date', 'target_date', 'complete_date', 'payment_status', 'remarks', 'employee_id', 'drive_link', 'overdue_status', 'days_taken', 'status', 'completion_percent']
export const TABLE_COLUMNS: Record<string, string[]> = {
  '10': [...COMMON, 'foreign_company_name', 'country', 'registration_no'],
  '11': [...COMMON, 'foreign_company_name', 'country', 'registration_no'],
  '9': [...COMMON, 'bd_company_name', 'country', 'rjsc_reg_no', 'issue_no', 'incorporation_date', 'auditor_firm', 'rjsc_return_due_date'],
  '1': COMMON, '2': COMMON, '4': COMMON, '5': COMMON, '6': [...COMMON, 'portal_accounts'], '7': COMMON,
  '3': ['company_id', 'client_name', 'client_phone', 'category', 'priority', 'current_stage',
    'usa_type', 'usa_submit_date', 'usa_target_date', 'usa_complete_date', 'usa_overdue_status', 'usa_days_taken', 'usa_status', 'usa_completion_percent', 'usa_payment_status',
    'canada_type', 'canada_submit_date', 'canada_target_date', 'canada_complete_date', 'canada_overdue_status', 'canada_days_taken', 'canada_status', 'canada_completion_percent', 'canada_payment_status',
    'remarks', 'employee_id', 'drive_link'],
  '8': ['company_id', 'entity_type', 'company_name_english', 'arabic_name', 'name_clearance_number', 'submit_date', 'approval_date', 'expire_date', 'remaining_days', 'status', 'cr_status', 'notes'],
}

/** Columns the eligibility check needs, limited to those that exist in the given stage table. */
export function eligibilityColumns(stageId: string, extra: string[] = []): string {
  const wanted = ['company_id', 'submit_date', 'complete_date', 'usa_complete_date', 'approval_date', ...extra]
  const real = new Set(TABLE_COLUMNS[stageId] || [])
  return wanted.filter(c => real.has(c)).join(', ')
}

/** Keep only real columns; turn empty strings into null (DATE columns reject ""). */
export function pickColumns(stageId: string, payload: Record<string, any>) {
  const allowed = new Set(TABLE_COLUMNS[stageId] || [])
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(payload)) {
    if (!allowed.has(k)) continue
    out[k] = v === '' ? null : v
  }
  return out
}

/** Returns an error message when a complete date is earlier than its submit date. */
export function validateDates(form: Record<string, any>): string | null {
  const pairs: [string, string, string][] = [
    ['submit_date', 'complete_date', 'Completion date'],
    ['usa_submit_date', 'usa_complete_date', 'USA completion date'],
    ['canada_submit_date', 'canada_complete_date', 'Canada completion date'],
    ['submit_date', 'approval_date', 'Approval date'],
  ]
  for (const [a, b, label] of pairs) {
    if (form[a] && form[b] && new Date(form[b]) < new Date(form[a])) return `${label} cannot be earlier than the submission date.`
  }
  return null
}

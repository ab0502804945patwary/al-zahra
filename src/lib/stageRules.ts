// Single source of truth for dropdown lists and stage flow rules.
// Mirrors the client's Google Sheet ("INVESTOR LICENSE" workbook).

export const COUNTRIES = ['Bangladesh', 'Pakistan', 'India', 'Afganistan', 'Sudan']
/** Stages that show the company's Country and City (entered in stage 1, copied to the rest). */
export const COUNTRY_CITY_STAGES = ['1', '2', '4', '5', '6', '7']
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

export function isEligibleForStage(stageId: string, company: { company_id: string; entity_type?: string; category?: string; service_type?: string; selected_phases?: string[] | null; skipped_phases?: string[] | null }, all: StageEntriesMap): boolean {
  // Existing companies that only need renewal skip the handoff chain entirely.
  // They are not offered MISA, CR, Portals or Final Dossier unless they really go through the chain.
  if (company.service_type === 'renewal') return !['4', '5', '6', '7'].includes(stageId)
  const id = company.company_id
  const category = company.category || company.entity_type
  // Ticked on the form: work goes only to the phases that were ticked. Older companies (nothing saved) keep the earlier rules.
  const picked = Array.isArray(company.selected_phases) ? company.selected_phases : null
  // A phase the admin removed for this company never gets its work; the other phases are not affected.
  const skipped = Array.isArray(company.skipped_phases) ? company.skipped_phases : []
  if (skipped.includes(stageId)) return false
  // a removed phase counts as done for the phases that wait for it (MISA, CR, Portals, Final Dossier)
  const dk = (sid: string, field: 'complete_date' | 'usa_complete_date' | 'approval_date' = 'complete_date') => skipped.includes(sid) || done(all[sid], id, field)
  if (picked && OPTIONAL_PHASES.includes(stageId)) {
    if (!picked.includes(stageId)) return false
    // Bangladesh Company ticked: Foreign Mother / Foreign Subsidiary phases open only after its name is Approved
    if (['10', '3', '11'].includes(stageId) && picked.includes('9') && !skipped.includes('9')) {
      return (all['9'] || []).some(e => e.company_id === id && (e as any).approval_status === 'Approved')
    }
    return true
  }
  // Service to Trade (ticked on the form): no Parent Entity Verification and no Company Name Clearance.
  // MISA opens when Activity Classification and every ticked Foreign Subsidiary phase are complete.
  if (picked && category === 'Service to Trade') {
    if (stageId === '1' || stageId === '8') return false
    if (stageId === '4') return dk('2') && picked.filter(s => OPTIONAL_PHASES.includes(s)).every(sid => dk(sid))
  }
  switch (stageId) {
    case '1':
      // Service License (ticked on the form): Parent Entity Verification starts only after every ticked phase is complete.
      // Other license types and older companies: it starts together with the others.
      if (picked && category === 'Service License') {
        // Bangladesh Company ticked: an Approved name is enough, Foreign may still be in progress
        if (picked.includes('9') && !skipped.includes('9')) return (all['9'] || []).some(e => e.company_id === id && (e as any).approval_status === 'Approved')
        return picked.filter(s => OPTIONAL_PHASES.includes(s)).every(sid => dk(sid))
      }
      // Trading License (and Service to Trade): Parent opens when Foreign Mother is complete (Subsidiaries may still be running).
      // Without Foreign Mother ticked: when every ticked phase is complete. Bangladesh counts as done once its name is Approved.
      if (picked && needsForeign(category)) {
        if (picked.includes('10') && !skipped.includes('10')) return dk('10')
        return picked.filter(s => OPTIONAL_PHASES.includes(s)).every(sid => sid === '9' ? (skipped.includes('9') || (all['9'] || []).some(e => e.company_id === id && (e as any).approval_status === 'Approved')) : dk(sid))
      }
      return true
    case '4': {
      if (picked) {
        // MISA opens when Parent, Activity, Trade Name and every ticked phase are complete
        const doneStage = (sid: string) => (sid === '3' ? dk('3') : dk(sid))
        return dk('1') && dk('2') && dk('8', 'approval_date') && picked.filter(s => OPTIONAL_PHASES.includes(s)).every(doneStage)
      }
      // MISA opens only when every parallel step is complete:
      //   Service License: Parent (1), Bangladesh Company (9), Activity (2), Trade Name (8)
      //   Trading License: the same plus Foreign Entity (3)
      const common = dk('1') && dk('9') && dk('2') && dk('8', 'approval_date')
      if (category === 'Service License') return common
      if (needsForeign(category)) return common && dk('3')
      return false
    }
    case '2':
      // Starts together with Stage 1 (and 8) for every new company
      return true
    case '3':
      // Foreign licensing is only needed for Trading License (Service License skips Stage 3); starts together with Stage 1
      return needsForeign(category)
    case '10':
      // Service License with Bangladesh Company ticked: Foreign Company starts only after the Bangladesh name is Approved
      if (picked && category === 'Service License' && picked.includes('9') && !skipped.includes('9')) {
        return (all['9'] || []).some(e => e.company_id === id && (e as any).approval_status === 'Approved')
      }
      return category === 'Trading License'
    case '11':
      // foreign company phases (older companies): Trading License only
      return category === 'Trading License'
    case '5': return skipped.includes('4') || submittedAndDone(all['4'], id)
    case '6': return skipped.includes('5') || submittedAndDone(all['5'], id)
    case '7': return skipped.includes('6') || (all['6'] || []).some(e => e.company_id === id) // Portals & Compliance has no dates: a record there is enough
    default: return true
  }
}

export const ELIGIBILITY_HINT: Record<string, string> = {
  '1': 'Trading License: opens when Foreign Mother Company is complete. Service License: opens when the Bangladesh Company Name is Approved (Foreign Company may still be in progress); with only Foreign Company ticked, after it is complete.',
  '2': 'Starts together with Stage 1 and Company Name Clearance.',
  '3': 'Work arrives when 1 Foreign Subsidiary Company is ticked on the Company Register form.',
  '10': 'Work arrives when Foreign Mother Company is ticked on the Company Register form.',
  '11': 'Work arrives when 2 Foreign Subsidiary Company is ticked on the Company Register form.',
  '4': 'Opens when every earlier step is complete: Parent Entity, Activity Classification, Company Name Clearance and every phase ticked for this company.',
  '5': 'Requires Stage 4 (MISA) submit and complete dates.',
  '6': 'Requires Stage 5 (Commercial Registration) submit and complete dates.',
  '7': 'Opens once the company has a Portals & Compliance (Stage 6) record.',
}

// ---- Columns that really exist in each Supabase stage table (see supabase-schema.sql) ----
const COMMON = ['company_id', 'client_name', 'client_phone', 'category', 'priority', 'current_stage', 'submit_date', 'target_date', 'complete_date', 'payment_status', 'remarks', 'employee_id', 'drive_link', 'overdue_status', 'days_taken', 'status', 'completion_percent']
export const TABLE_COLUMNS: Record<string, string[]> = {
  '10': [...COMMON, 'foreign_company_name', 'country', 'city', 'registration_no', 'payment_bank'],
  '11': [...COMMON, 'foreign_company_name', 'country', 'city', 'registration_no', 'account_email', 'account_username', 'account_password'],
  '9': [...COMMON, 'approval_status', 'bd_company_name', 'country', 'rjsc_reg_no', 'issue_no', 'incorporation_date', 'auditor_firm', 'rjsc_return_due_date', 'approved_at'],
  '1': [...COMMON, 'country', 'city', 'audit_report_done', 'incorporation_update_done'], '2': [...COMMON, 'country', 'city'], '4': [...COMMON, 'country', 'city'], '5': [...COMMON, 'country', 'city', 'cr_status', 'cr_status_date'], '6': [...COMMON, 'country', 'city', 'portal_accounts'], '7': [...COMMON, 'country', 'city'],
  '3': [...COMMON, 'foreign_company_name', 'country', 'city', 'registration_no', 'account_email', 'account_username', 'account_password'],
  '8': ['company_id', 'entity_type', 'company_name_english', 'arabic_name', 'name_clearance_number', 'submit_date', 'approval_date', 'expire_date', 'remaining_days', 'status', 'cr_status', 'notes'],
}

/**
 * The day a company reached Parent Entity Verification: the day the step before it finished
 * (Foreign Mother complete / Bangladesh name Approved / the latest ticked phase). Falls back to the day the company was registered.
 */
export function parentReadyDate(company: { company_id: string; entity_type?: string; category?: string; created_at?: string; selected_phases?: string[] | null; skipped_phases?: string[] | null }, all: StageEntriesMap): string | null {
  const id = company.company_id
  const category = company.category || company.entity_type
  const picked = Array.isArray(company.selected_phases) ? company.selected_phases : null
  const skipped = Array.isArray(company.skipped_phases) ? company.skipped_phases : []
  const ticked = picked ? picked.filter(s => OPTIONAL_PHASES.includes(s) && !skipped.includes(s)) : []
  const last = (xs: (string | null | undefined)[]) => xs.filter((x): x is string => !!x).map(x => String(x).slice(0, 10)).sort().pop() || null
  const dateOf = (sid: string) => {
    const rows = (all[sid] || []).filter(e => e.company_id === id) as any[]
    return sid === '9' ? last(rows.map(e => e.approved_at || e.complete_date)) : last(rows.map(e => e.complete_date))
  }
  let sids: string[] = []
  if (picked && category === 'Service License') sids = ticked.includes('9') ? ['9'] : ticked
  else if (picked && needsForeign(category)) sids = ticked.includes('10') ? ['10'] : ticked
  const found = last(sids.map(dateOf))
  if (found) return found
  return company.created_at ? new Date(company.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' }) : null
}

/** Columns the eligibility check needs, limited to those that exist in the given stage table. */
export function eligibilityColumns(stageId: string, extra: string[] = []): string {
  const wanted = ['company_id', 'submit_date', 'complete_date', 'usa_complete_date', 'approval_date', 'approval_status', 'approved_at', ...extra]
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
    ['approval_date', 'expire_date', 'Expire date'],
  ]
  for (const [a, b, label] of pairs) {
    if (form[a] && form[b] && new Date(form[b]) < new Date(form[a])) return `${label} cannot be earlier than the submission date.`
  }
  return null
}

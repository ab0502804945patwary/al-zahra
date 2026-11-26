import { MENU_ORDER } from '@/lib/stageData'
// Who may open what: workflow stages (employees.assigned_stages) and the other modules (employees.modules).
type StaffLike = { role?: string; assigned_stage?: number | null; assigned_stages?: number[] | null; modules?: string[] | null } | null | undefined

/** The non-workflow modules an admin can give to a staff member. Order = sidebar order. */
export const MODULES: { key: string; label: string; href: string }[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { key: 'companies', label: 'Company Register', href: '/dashboard/companies' },
  { key: 'leads', label: 'Leads (New Lead & Leads list)', href: '/dashboard/leads' },
  { key: 'videos', label: 'Video Management', href: '/dashboard/videos' },
  { key: 'renewals', label: 'Renewal Companies', href: '/dashboard/renewals' },
  { key: 'customers', label: 'Customers', href: '/dashboard/customers' },
  { key: 'agents', label: 'Agents', href: '/dashboard/agents' },
  { key: 'services', label: 'Services', href: '/dashboard/services' },
  { key: 'expenses', label: 'Expenses', href: '/dashboard/expenses' },
  { key: 'reports', label: 'Reports', href: '/dashboard/reports' },
  { key: 'invoices', label: 'Invoices', href: '/dashboard/invoices' },
  { key: 'journal', label: 'Journal & Staff Cash', href: '/dashboard/journal' },
]

/**
 * Special permissions an admin can tick per staff member (stored in employees.modules, off by default).
 * Admins always have them. The database enforces them too (see db/permissions.sql).
 */
export const PERMISSIONS: { key: string; label: string }[] = [
  { key: 'perm_company_edit', label: 'Company Register: can see all and edit companies' },
  { key: 'perm_renewal_edit', label: 'Renewal Companies: can see all and edit companies' },
  { key: 'perm_invoice_edit', label: 'Invoices: can edit an invoice' },
  { key: 'perm_invoice_cancel', label: 'Invoices: can cancel an invoice' },
  { key: 'perm_expense_approve', label: 'Expenses: can approve / reject' },
  { key: 'perm_lead_delete', label: 'Leads: can delete own leads' },
  ...([
    [1, '01: Parent Entity Verification'], [9, '02: Bangladesh Company Name'], [10, '03: Foreign Mother Company'], [2, '04: Activity Classification'],
    [3, '05: 1 Foreign Subsidiary Company'], [11, '06: 2 Foreign Subsidiary Company'], [8, '07: Company Name Clearance'], [4, '08: MISA Investment Licensing'],
    [5, '09: Commercial Registration (CR)'], [6, '10: Government Portals & Compliance'], [7, '11: Final Legal Dossier & Issuance'],
  ] as [number, string][]).map(([n, name]) => ({ key: `edit_stage_${n}`, label: `Can edit phase ${name}` })),
]

/** Stage numbers a staff member is assigned to. Returns null for admins (= every stage). */
export function stagesOf(emp: StaffLike): number[] | null {
  if (!emp) return []
  if (emp.role === 'admin') return null
  if (Array.isArray(emp.assigned_stages) && emp.assigned_stages.length > 0) return emp.assigned_stages
  return emp.assigned_stage ? [emp.assigned_stage] : []
}

export function canAccessStage(emp: StaffLike, stage: number): boolean {
  const s = stagesOf(emp)
  return s === null || s.includes(stage)
}

/** Admins have every module; staff only the ones ticked for them. */
export function canAccessModule(emp: StaffLike, key: string): boolean {
  if (!emp) return false
  if (emp.role === 'admin') return true
  return Array.isArray(emp.modules) && emp.modules.includes(key)
}

/** Special permission check: admins always; staff only when ticked. */
export function canDo(emp: StaffLike, key: string): boolean {
  if (!emp) return false
  if (emp.role === 'admin') return true
  return Array.isArray(emp.modules) && emp.modules.includes(key)
}

/**
 * May this person see and edit every company of the Company Register / Renewal Companies page?
 * Needs the page's module and its edit permission (admins always). The database enforces it (db/company-edit-permission.sql).
 */
export function canEditCompanies(emp: StaffLike, page: 'companies' | 'renewals'): boolean {
  return canAccessModule(emp, page) && canDo(emp, page === 'renewals' ? 'perm_renewal_edit' : 'perm_company_edit')
}

/** Where a user lands after login: admins get the dashboard, staff their first workflow stage, else their first module. */
export function homeFor(emp: StaffLike): string {
  const s = stagesOf(emp)
  if (s === null) return '/dashboard'
  if (s.length) {
    const first = MENU_ORDER.find(id => s.includes(Number(id))) ?? String(s[0])
    return `/dashboard/stage/${first}`
  }
  const mod = MODULES.find(m => canAccessModule(emp, m.key))
  return mod ? mod.href : '/dashboard/settings'
}

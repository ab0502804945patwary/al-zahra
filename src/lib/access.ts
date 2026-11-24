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
  { key: 'perm_invoice_edit', label: 'Invoices: can edit an invoice' },
  { key: 'perm_invoice_cancel', label: 'Invoices: can cancel an invoice' },
  { key: 'perm_expense_approve', label: 'Expenses: can approve / reject' },
  { key: 'perm_lead_delete', label: 'Leads: can delete own leads' },
  ...[1, 9, 10, 2, 3, 11, 8, 4, 5, 6, 7].map(n => ({ key: `edit_stage_${n}`, label: `Workflow: can edit entries in phase (stage ${n})` })),
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

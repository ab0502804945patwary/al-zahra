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

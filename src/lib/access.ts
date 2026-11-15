// Which workflow stages a user may open / edit.
type StaffLike = { role?: string; assigned_stage?: number | null; assigned_stages?: number[] | null } | null | undefined

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

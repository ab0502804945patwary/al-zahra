import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateDaysTaken(submitDate: string | null, completeDate: string | null): number {
  if (!submitDate) return 0
  const start = new Date(submitDate)
  const end = completeDate ? new Date(completeDate) : new Date()
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function calculateOverdue(completeDate?: string | null, targetDate?: string | null): 'Completed' | 'Pending' | 'Overdue' | 'On Time' {
  if (completeDate) return 'Completed'
  if (!targetDate) return 'Pending'
  return new Date() > new Date(targetDate) ? 'Overdue' : 'On Time'
}

export function calculateStatus(days: number, greenMax = 10, yellowMax = 13): 'Green' | 'Yellow' | 'Red' {
  if (days <= greenMax) return 'Green'
  if (days <= yellowMax) return 'Yellow'
  return 'Red'
}

export function calculateCompletion(status: string): number {
  if (status === 'Green') return 100
  if (status === 'Yellow') return 60
  return 30
}

// ---- Timing rules (same for every stage) ----
// Target date given:  finished on/before target = Green; 1-3 days late = Yellow; later = Red.
//                     still running: more than 3 days left = Green; 0-3 days left = Yellow; past target = Red.
// No target date:     days taken <= 10 Green, 11-13 Yellow, more = Red.
export const NEAR_DAYS = 3

function dayNum(s: string) {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86400000
}
function todayNum() {
  const n = new Date()
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / 86400000
}

export function assessTiming(submit?: string | null, target?: string | null, complete?: string | null) {
  const today = todayNum()
  const days = submit ? Math.max(0, (complete ? dayNum(complete) : today) - dayNum(submit)) : 0
  let status: 'Green' | 'Yellow' | 'Red'
  let overdue: 'Completed' | 'Pending' | 'Overdue' | 'On Time'
  if (target) {
    const t = dayNum(target)
    if (complete) {
      const late = dayNum(complete) - t
      status = late <= 0 ? 'Green' : late <= NEAR_DAYS ? 'Yellow' : 'Red'
      overdue = 'Completed'
    } else {
      const left = t - today
      status = left < 0 ? 'Red' : left <= NEAR_DAYS ? 'Yellow' : 'Green'
      overdue = left < 0 ? 'Overdue' : 'On Time'
    }
  } else {
    status = calculateStatus(days)
    overdue = complete ? 'Completed' : 'Pending'
  }
  return { days, status, completion: calculateCompletion(status), overdue }
}

/** Fresh status/days/percent for a stored entry (running work changes with the calendar). */
export function enrichTiming<T extends Record<string, any>>(e: T): T {
  const out: Record<string, any> = { ...e }
  if (e.submit_date || e.target_date) {
    const a = assessTiming(e.submit_date, e.target_date, e.complete_date)
    out.days_taken = a.days; out.status = a.status; out.completion_percent = a.completion; out.overdue_status = a.overdue
  }
  for (const p of ['usa', 'canada']) {
    if (e[`${p}_submit_date`] || e[`${p}_target_date`]) {
      const a = assessTiming(e[`${p}_submit_date`], e[`${p}_target_date`], e[`${p}_complete_date`])
      out[`${p}_days_taken`] = a.days; out[`${p}_status`] = a.status; out[`${p}_completion_percent`] = a.completion; out[`${p}_overdue_status`] = a.overdue
    }
  }
  return out as T
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(date: string | null): string {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    const day = String(d.getUTCDate()).padStart(2, '0')
    const month = MONTHS[d.getUTCMonth()]
    const year = d.getUTCFullYear()
    return `${day} ${month} ${year}`
  } catch {
    return '—'
  }
}

export function getDaysUntilExpiry(expireDate: string | null): number {
  if (!expireDate) return 999
  const today = new Date()
  const expire = new Date(expireDate)
  return Math.floor((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function calculateNameClearance(approvalDate?: string | null) {
  if (!approvalDate) return null
  const approved = new Date(approvalDate)
  if (isNaN(approved.getTime())) return null
  const expire = new Date(approved.getTime() + 60 * 86400000)
  const remaining = Math.ceil((expire.getTime() - Date.now()) / 86400000)
  const status = remaining < 0 ? 'Expired' : remaining <= 30 ? 'Urgent' : remaining <= 40 ? 'Warning' : 'Active'
  return { expire_date: expire.toISOString().slice(0, 10), remaining_days: remaining, status }
}

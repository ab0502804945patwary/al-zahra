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

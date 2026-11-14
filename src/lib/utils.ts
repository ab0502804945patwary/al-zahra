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

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getDaysUntilExpiry(expireDate: string | null): number {
  if (!expireDate) return 999
  const today = new Date()
  const expire = new Date(expireDate)
  return Math.floor((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

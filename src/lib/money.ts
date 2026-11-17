const nf = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Amounts are in Bangladeshi Taka (BDT). */
export const bdt = (n: number | string | null | undefined) => `BDT ${nf.format(Number(n) || 0)}`

export type PayStatus = 'Unpaid' | 'Partial' | 'Paid' | 'Cancelled'

export function payStatus(total: number, paid: number, cancelled = false): PayStatus {
  if (cancelled) return 'Cancelled'
  if (paid >= total && total > 0) return 'Paid'
  if (paid > 0) return 'Partial'
  return 'Unpaid'
}

export const statusTone = (s: PayStatus) =>
  s === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
  : s === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200'
  : s === 'Cancelled' ? 'bg-slate-100 text-slate-500 border-slate-300'
  : 'bg-rose-50 text-rose-700 border-rose-200'

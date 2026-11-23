// Dropdown lists for Leads. Edit here to add or rename an option.
export const LEAD_SOURCES = ['Website', 'Facebook', 'Instagram', 'TikTok', 'YouTube', 'WhatsApp', 'Telegram', 'Google Ads', 'Social Media', 'Referral', 'Agent', 'Walk-in', 'Email', 'Other']
export const LEAD_STATUSES = ['New', 'Contacted', 'Interested', 'Quotation', 'Negotiation', 'Payment', 'Completed', 'Lost'] as const
// suggestions for "Service Required" (anything can be typed; services from the Services page are added too)
export const LEAD_SERVICES = ['MISA License', 'CR + Labor', 'Investor License', 'Renewal', 'MISA + CR', 'Trade License', 'Company Setup', 'VAT & ZATCA']

/** Overdue is not a stored status: a lead whose follow-up date has passed and is still open. */
export const isLeadOverdue = (status: string, followUp?: string | null) =>
  !!followUp && status !== 'Completed' && status !== 'Lost' && followUp < new Date().toISOString().slice(0, 10)

export const leadStatusTone = (s: string) =>
  s === 'Overdue' ? { pill: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' }
  : s === 'New' ? { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' }
  : s === 'Contacted' ? { pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
  : s === 'Interested' ? { pill: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' }
  : s === 'Quotation' ? { pill: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' }
  : s === 'Negotiation' || s === 'Payment' ? { pill: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' }
  : s === 'Completed' ? { pill: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-600' }
  : { pill: 'bg-slate-100 text-slate-500 border-slate-300', dot: 'bg-slate-400' }

export const fmtLeadDate = (d?: string | null) => (d ? d.split('-').reverse().join('-') : '—')

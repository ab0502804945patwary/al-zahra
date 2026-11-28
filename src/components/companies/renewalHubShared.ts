import { Company } from '@/lib/types'

export type Pillar = 'misa' | 'cr' | 'bd' | 'sa'
export type State = 'active' | 'due' | 'inactive' | 'none'
export type Lang = 'en' | 'bn' | 'ar'
export type Channel = 'WhatsApp' | 'Email' | 'SMS'
export type DateField = 'misa_expire_date' | 'cr_expire_date' | 'bd_next_audit_due' | 'rjsc_annual_return_due' | 'sa_next_audit_due'

export interface StateRow { company_id: string; service: Pillar; workflow: string; stage: string | null }
export interface LogRow {
  id: number
  company_id: string
  kind: 'notified' | 'completed'
  service: Pillar | null
  services: string | null
  channel: string | null
  language: string | null
  prev_due: string | null
  new_due: string | null
  created_at: string
}

/** A service counts as "Due" this many days before its date */
export const DUE_WITHIN = 45
export const SUSPENDED = 'Suspended / Inactive'
export const WORKFLOWS = ['Pending / Due', 'Notified', 'Confirmed / In Progress', 'Completed (+1 Yr)']

export interface PillarDef {
  key: Pillar
  n: number
  label: string
  short: string
  completedHint: string
  refLabel: string
  ref: (c: Company) => string | undefined
  refPrefix: string
  /** dates that belong to this pillar; the earliest one counts */
  fields: { field: DateField; doc: string }[]
  stages?: string[]
  /** full class names, so Tailwind keeps them */
  tone: { head: string; badge: string; button: string; box: string }
}

export const PILLARS: PillarDef[] = [
  {
    key: 'misa', n: 1, label: 'MISA License', short: 'MISA', completedHint: '1. MISA License', refLabel: 'MISA License No.', refPrefix: 'MISA', ref: c => c.misa_license_no,
    fields: [{ field: 'misa_expire_date', doc: 'MISA' }],
    tone: { head: 'bg-sky-50/70 text-sky-950', badge: 'bg-sky-50 text-sky-800 border-sky-200', button: 'bg-sky-600 hover:bg-sky-700', box: 'bg-sky-50/60 border-sky-200 hover:bg-sky-100/70 text-sky-900' },
  },
  {
    key: 'cr', n: 2, label: 'CR Renewal', short: 'CR', completedHint: '2. Saudi CR', refLabel: 'Saudi CR No.', refPrefix: 'CR', ref: c => c.cr_number,
    fields: [{ field: 'cr_expire_date', doc: 'CR' }],
    tone: { head: 'bg-[#eef2ff]/70 text-[#1e1b4b]', badge: 'bg-[#eef2ff] text-[#3730a3] border-[#c7d2fe]', button: 'bg-[#4f46e5] hover:bg-[#4338ca]', box: 'bg-[#eef2ff]/60 border-[#c7d2fe] hover:bg-[#e0e7ff]/70 text-[#312e81]' },
  },
  {
    key: 'bd', n: 3, label: 'BD Audit', short: 'BD Audit', completedHint: '3. RJSC / DVC', refLabel: 'BD RJSC Reg. No.', refPrefix: 'RJSC', ref: c => c.rjsc_reg_no,
    fields: [{ field: 'bd_next_audit_due', doc: 'BD Audit' }, { field: 'rjsc_annual_return_due', doc: 'RJSC Annual Return' }],
    stages: ['Not Started', 'Docs Pending', 'DVC Pending', 'Under Audit', 'DVC Filed', SUSPENDED],
    tone: { head: 'bg-emerald-50/70 text-emerald-950', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', button: 'bg-emerald-600 hover:bg-emerald-700', box: 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/70 text-emerald-900' },
  },
  {
    key: 'sa', n: 4, label: 'Saudi Audit', short: 'Saudi Audit', completedHint: '4. ZATCA / SOCPA', refLabel: 'ZATCA TIN No.', refPrefix: 'TIN', ref: c => c.tin_number,
    fields: [{ field: 'sa_next_audit_due', doc: 'Saudi Audit' }],
    stages: ['Not Started', 'Trial Balance Due', 'ZATCA Filing', 'Under Audit', 'Filed (ZATCA)', SUSPENDED],
    tone: { head: 'bg-amber-50/70 text-amber-950', badge: 'bg-amber-50 text-amber-800 border-amber-200', button: 'bg-amber-600 hover:bg-amber-700', box: 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/70 text-amber-900' },
  },
]

export const pillarOf = (key: Pillar) => PILLARS.find(p => p.key === key)!

export function daysLeft(date: string) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

export interface Service { doc: string; field: DateField; date: string; days: number | null; state: State; workflow: string; stage: string }

export function serviceOf(c: Company, p: PillarDef, rows: Map<string, StateRow>): Service {
  const first = p.fields.filter(f => c[f.field]).sort((a, b) => String(c[a.field]).localeCompare(String(c[b.field])))[0] || p.fields[0]
  const date = (c[first.field] as string | undefined) || ''
  const days = date ? daysLeft(date) : null
  const row = rows.get(`${c.id}:${p.key}`)
  const stage = row?.stage || ''
  const state: State = c.account_status === 'Inactive' || stage === SUSPENDED ? 'inactive' : days === null ? 'none' : days <= DUE_WITHIN ? 'due' : 'active'
  let workflow = row?.workflow || 'Pending / Due'
  // last year's "Completed" must not hide the next cycle once it is due again
  if (workflow === 'Completed (+1 Yr)' && state === 'due') workflow = 'Pending / Due'
  return { doc: first.doc, field: first.field, date, days, state, workflow, stage }
}

export const daysText = (d: number) => (d < 0 ? `${-d}d overdue` : d === 0 ? 'Today' : `${d}d left`)
export const daysTone = (d: number) =>
  d < 0 ? 'bg-red-50 text-red-600 border-red-200' : d <= 30 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'

export const phoneOf = (c: Company) => c.whatsapp_number || c.client_phone || c.shareholder_phone || ''

const TEMPLATES: Record<Lang, { hello: (n: string) => string; intro: string; due: string; no: string; docs: string; outro: string; items: Record<Pillar, [string, string]> }> = {
  en: {
    hello: n => `Dear ${n},\n\nGreetings from AL ZAHRA CONSULTANCY.`,
    intro: 'This is a reminder about your upcoming annual renewal and audit obligations:',
    due: 'Due', no: 'No', docs: 'Required documents:',
    outro: 'Please share the documents at your earliest convenience so we can complete your filing before the due date.\n\nBest regards,\nAL ZAHRA CONSULTANCY',
    items: {
      misa: ['MISA License Renewal', 'Mother company audited financial statements & MISA portal access'],
      cr: ['Saudi CR Renewal', 'Active National Address & Chamber of Commerce renewal'],
      bd: ['Bangladesh Company Audit', '12-month BD bank statements, vouchers & DVC filing documents'],
      sa: ['Saudi Company Audit', 'KSA bank statements, VAT returns, trial balance & invoices'],
    },
  },
  bn: {
    hello: n => `প্রিয় ${n},\n\nAL ZAHRA CONSULTANCY-এর পক্ষ থেকে শুভেচ্ছা।`,
    intro: 'আপনার কোম্পানির বাৎসরিক রিনিউয়াল ও অডিট সংক্রান্ত রিমাইন্ডার:',
    due: 'শেষ তারিখ', no: 'নং', docs: 'প্রয়োজনীয় ডকুমেন্টস:',
    outro: 'সময়মতো কাজ সম্পন্ন করতে অনুগ্রহ করে প্রয়োজনীয় কাগজপত্র দ্রুত পাঠিয়ে দিন।\n\nধন্যবাদান্তে,\nAL ZAHRA CONSULTANCY',
    items: {
      misa: ['MISA লাইসেন্স রিনিউয়াল', 'মাদার কোম্পানির অডিট রিপোর্ট ও MISA পোর্টাল এক্সেস'],
      cr: ['সৌদি CR রিনিউয়াল', 'ন্যাশনাল অ্যাড্রেস ও চেম্বার অফ কমার্স আপডেট'],
      bd: ['বাংলাদেশ কোম্পানি অডিট', '১২ মাসের ব্যাংক স্টেটমেন্ট, ভাউচার ও DVC ডকুমেন্টস'],
      sa: ['সৌদি কোম্পানি অডিট', 'সৌদি ব্যাংক স্টেটমেন্ট, ভ্যাট রিটার্ন ও ট্রায়াল ব্যালেন্স'],
    },
  },
  ar: {
    hello: n => `السادة / ${n} المحترمين،\n\nتحية طيبة من مكتب الزهراء للاستشارات (AL ZAHRA CONSULTANCY).`,
    intro: 'نذكركم بمواعيد التجديد والتدقيق السنوي المستحقة لشركتكم:',
    due: 'تاريخ الاستحقاق', no: 'رقم', docs: 'المستندات المطلوبة:',
    outro: 'يرجى تزويدنا بالمستندات المطلوبة في أقرب وقت ممكن.\n\nوتفضلوا بقبول فائق الاحترام،\nAL ZAHRA CONSULTANCY',
    items: {
      misa: ['تجديد ترخيص وزارة الاستثمار MISA', 'القوائم المالية المدققة للشركة الأم وتفويض بوابة MISA'],
      cr: ['تجديد السجل التجاري', 'العنوان الوطني الساري وتجديد اشتراك الغرفة التجارية'],
      bd: ['التدقيق السنوي لشركة بنغلاديش', 'كشوف الحسابات البنكية ومستندات التدقيق DVC'],
      sa: ['التدقيق المالي السنوي في السعودية', 'كشوف الحسابات السعودية وإقرارات ضريبة القيمة المضافة وميزان المراجعة'],
    },
  },
}

export function buildMessage(c: Company, picked: Pillar[], lang: Lang, rows: Map<string, StateRow>) {
  const t = TEMPLATES[lang]
  const chosen = PILLARS.filter(p => picked.includes(p.key))
  const lines = chosen.map(p => {
    const ref = p.ref(c)
    const { date } = serviceOf(c, p, rows)
    return `• ${t.items[p.key][0]}${ref ? ` (${t.no}: ${ref})` : ''}${date ? ` — ${t.due}: ${date}` : ''}`
  })
  const docs = chosen.map(p => `- ${t.items[p.key][1]}`)
  return [t.hello(c.company_name), t.intro, lines.join('\n'), docs.length ? `${t.docs}\n${docs.join('\n')}` : '', t.outro].filter(Boolean).join('\n\n')
}

/** Link that opens the chosen app with the message filled in; the user still presses send there */
export function sendLink(c: Company, channel: Channel, message: string) {
  const digits = phoneOf(c).replace(/\D/g, '')
  const text = encodeURIComponent(message)
  if (channel === 'Email') return c.official_email ? `mailto:${c.official_email}?subject=${encodeURIComponent('Renewal & audit reminder — ' + c.company_name)}&body=${text}` : ''
  if (!digits) return ''
  return channel === 'SMS' ? `sms:+${digits}?body=${text}` : `https://wa.me/${digits}?text=${text}`
}

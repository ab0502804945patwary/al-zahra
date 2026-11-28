'use client'
import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, MessageCircle, Mail, Phone, RefreshCw } from 'lucide-react'
import { Company } from '@/lib/types'
import OwnerTag from '@/components/ui/OwnerTag'

type Win = 'expired' | 7 | 15 | 30 | 60 | 90

interface Item {
  company: Company
  doc: string
  date: string
  days: number
}

const DOC_FIELDS: { doc: string; field: keyof Company }[] = [
  { doc: 'CR', field: 'cr_expire_date' },
  { doc: 'MISA', field: 'misa_expire_date' },
  { doc: 'RJSC Annual Return', field: 'rjsc_annual_return_due' },
  { doc: 'BD Audit', field: 'bd_next_audit_due' },
  { doc: 'Saudi Audit', field: 'sa_next_audit_due' },
]

function daysLeft(date: string) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

// same colours as the renewal hub's four services
const DOC_TONE: Record<string, string> = {
  CR: 'bg-[#eef2ff] text-[#3730a3] border-[#c7d2fe]',
  MISA: 'bg-sky-50 text-sky-800 border-sky-200',
  'RJSC Annual Return': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'BD Audit': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Saudi Audit': 'bg-amber-50 text-amber-800 border-amber-200',
}

const waLink = (n?: string) => {
  const digits = (n || '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}

export default function ExpiryAlerts({ companies: initial, isAdmin = false, owners = {}, ownerAvatars = {} }: { companies: Company[]; isAdmin?: boolean; owners?: Record<string, string>; ownerAvatars?: Record<string, string> }) {
  // admin: filter by the person who registered the company
  const [who, setWho] = useState('')
  const [docSel, setDocSel] = useState('')
  const companies = who ? initial.filter(c => (who === '__none' ? !c.created_by : c.created_by === who)) : initial
  const [win, setWin] = useState<Win>(30)
  // Day counts depend on today's date, which differs between server and browser: compute after mount only
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const all = useMemo(() => {
    const out: Item[] = []
    if (!mounted) return out
    for (const company of companies) {
      if (company.account_status === 'Inactive') continue // paused client: no expiry reminders
      for (const { doc, field } of DOC_FIELDS) {
        const date = company[field] as string | undefined
        if (!date) continue
        const days = daysLeft(date)
        if (days === null) continue
        if (docSel && doc !== docSel) continue
        out.push({ company, doc, date, days })
      }
    }
    return out.sort((a, b) => a.days - b.days)
  }, [companies, mounted, docSel])

  const inWindow = (i: Item, w: Win) => (w === 'expired' ? i.days < 0 : i.days >= 0 && i.days <= w)
  const wins: { key: Win; label: string }[] = [
    { key: 'expired', label: 'Expired' },
    { key: 7, label: '7 days' },
    { key: 15, label: '15 days' },
    { key: 30, label: '30 days' },
    { key: 60, label: '60 days' },
    { key: 90, label: '90 days' },
  ]
  const rows = all.filter(i => inWindow(i, win))

  const tone = (days: number) =>
    days < 0 ? 'bg-rose-50 text-rose-700 border-rose-200'
    : days <= 15 ? 'bg-rose-50 text-rose-700 border-rose-200'
    : days <= 30 ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200'

  const select = 'px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 font-semibold cursor-pointer'
  const contact = 'p-2 rounded-xl border transition'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 space-y-3 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0"><CalendarClock className="w-4 h-4" /></span>
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Upcoming Expiries — Contact List</h2>
              <p className="text-[11px] text-slate-500">CR, MISA, RJSC &amp; audit due dates</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select value={docSel} onChange={ev => setDocSel(ev.target.value)} aria-label="Document" className={select}>
              <option value="">All documents</option>
              {DOC_FIELDS.map(d => <option key={d.doc} value={d.doc}>{d.doc}</option>)}
            </select>
            {isAdmin && (
              <select value={who} onChange={ev => setWho(ev.target.value)} aria-label="Employee" className={select}>
                <option value="">All employees</option>
                {Object.entries(owners).filter(([id]) => initial.some(c => c.created_by === id)).sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                {initial.some(c => !c.created_by) && <option value="__none">AL ZAHRA (no person)</option>}
              </select>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {wins.map(w => {
            const n = all.filter(i => inWindow(i, w.key)).length
            const on = win === w.key
            return (
              <button
                key={String(w.key)}
                type="button"
                onClick={() => setWin(w.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${on ? 'bg-[#1e3a8a] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {w.label}
                <span className={`px-1.5 rounded-full text-[10px] font-bold ${on ? 'bg-white/20' : w.key === 'expired' && n ? 'bg-red-100 text-red-700' : 'bg-white text-slate-600'}`}>{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-auto max-h-96">
        <table className="w-full text-xs min-w-[760px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider sticky top-0">
            <tr>
              {['Company & ID', 'Service', ...(isAdmin ? ['Registered by'] : []), 'Document', 'Expiry Date', 'Days Left', 'Contact'].map(h => (
                <th key={h} className="text-left font-bold px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(i => {
              const c = i.company
              const wa = waLink(c.whatsapp_number || c.shareholder_phone)
              return (
                <tr key={`${c.company_id}-${i.doc}`} className="hover:bg-[#eff6ff]/50">
                  <td className="px-4 py-3">
                    <span className="font-bold text-[#1d4ed8] mr-2">{c.company_id}</span>
                    <span className="font-bold text-slate-800">{c.company_name}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.service_type === 'renewal'
                      ? <span className="inline-flex items-center gap-1 text-amber-700 font-semibold"><RefreshCw className="w-3 h-3" />Renewal Company</span>
                      : <span className="text-[#4338ca] font-semibold">New Company</span>}
                  </td>
                  {isAdmin && <td className="px-4 py-3"><OwnerTag name={c.created_by ? (owners[c.created_by] || 'Unknown') : null} avatar={c.created_by ? ownerAvatars[c.created_by] : null} /></td>}
                  <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${DOC_TONE[i.doc]}`}>{i.doc}</span></td>
                  <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{i.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full border text-[10.5px] font-bold ${tone(i.days)}`}>
                      {i.days < 0 ? `${Math.abs(i.days)}d overdue` : i.days === 0 ? 'Today' : `${i.days}d left`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {wa && <a href={wa} target="_blank" rel="noreferrer" title={`WhatsApp ${c.whatsapp_number || ''}`} className={`${contact} bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100`}><MessageCircle className="w-3.5 h-3.5" /></a>}
                      {c.whatsapp_number && <a href={`tel:${c.whatsapp_number}`} title="Call" className={`${contact} bg-[#eff6ff] border-[#bfdbfe] text-[#1d4ed8] hover:bg-[#dbeafe]`}><Phone className="w-3.5 h-3.5" /></a>}
                      {c.official_email && <a href={`mailto:${c.official_email}`} title={c.official_email} className={`${contact} bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200`}><Mail className="w-3.5 h-3.5" /></a>}
                      {!wa && !c.official_email && <span className="text-slate-400 italic">No contact saved</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-10 text-slate-400">Nothing in this window. Make sure CR / MISA expiry dates are filled in the company profile.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

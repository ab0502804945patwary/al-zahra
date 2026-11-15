'use client'
import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, MessageCircle, Mail, Phone, RefreshCw } from 'lucide-react'
import { Company } from '@/lib/types'

type Win = 'expired' | 7 | 15 | 30 | 60 | 90

interface Item {
  company: Company
  doc: 'CR' | 'MISA'
  date: string
  days: number
}

const DOC_FIELDS: { doc: 'CR' | 'MISA'; field: 'cr_expire_date' | 'misa_expire_date' }[] = [
  { doc: 'CR', field: 'cr_expire_date' },
  { doc: 'MISA', field: 'misa_expire_date' },
]

function daysLeft(date: string) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

const waLink = (n?: string) => {
  const digits = (n || '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}

export default function ExpiryAlerts({ companies: initial }: { companies: Company[] }) {
  const [companies, setCompanies] = useState<Company[]>(initial)
  const [win, setWin] = useState<Win>(30)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('alzahra_companies_data')
      if (stored) {
        const parsed = JSON.parse(stored) as Company[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCompanies(prev => {
            const map = new Map<string, Company>(prev.map(c => [c.company_id, c]))
            parsed.forEach(c => { if (c.company_id) map.set(c.company_id, { ...map.get(c.company_id), ...c }) })
            return Array.from(map.values())
          })
        }
      }
    } catch {}
  }, [])

  const all = useMemo(() => {
    const out: Item[] = []
    for (const company of companies) {
      for (const { doc, field } of DOC_FIELDS) {
        const date = company[field]
        if (!date) continue
        const days = daysLeft(date)
        if (days === null) continue
        out.push({ company, doc, date, days })
      }
    }
    return out.sort((a, b) => a.days - b.days)
  }, [companies])

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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-bold text-slate-900">Upcoming Expiries — Contact List</h2>
          <span className="text-[11px] text-slate-400">CR &amp; MISA licenses</span>
        </div>
        <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
          {wins.map(w => {
            const n = all.filter(i => inWindow(i, w.key)).length
            return (
              <button
                key={String(w.key)}
                onClick={() => setWin(w.key)}
                className={`px-2.5 py-1.5 rounded-md transition ${win === w.key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >{w.label} ({n})</button>
            )
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[760px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
            <tr>
              {['Company', 'Service', 'Document', 'Expiry Date', 'Days Left', 'Contact'].map(h => (
                <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(i => {
              const c = i.company
              const wa = waLink(c.whatsapp_number || c.shareholder_phone)
              return (
                <tr key={`${c.company_id}-${i.doc}`} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-900">{c.company_name}</div>
                    <div className="font-mono text-[11px] text-blue-700">{c.company_id}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    {c.service_type === 'renewal'
                      ? <span className="inline-flex items-center gap-1 text-amber-700"><RefreshCw className="w-3 h-3" />Renewal / Other</span>
                      : <span className="text-indigo-700">A2Z Setup</span>}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-700">{i.doc}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-600">{i.date}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${tone(i.days)}`}>
                      {i.days < 0 ? `${Math.abs(i.days)}d overdue` : i.days === 0 ? 'Today' : `${i.days} days`}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {wa && <a href={wa} target="_blank" rel="noreferrer" title={`WhatsApp ${c.whatsapp_number || ''}`} className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><MessageCircle className="w-3.5 h-3.5" /></a>}
                      {c.whatsapp_number && <a href={`tel:${c.whatsapp_number}`} title="Call" className="p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"><Phone className="w-3.5 h-3.5" /></a>}
                      {c.official_email && <a href={`mailto:${c.official_email}`} title={c.official_email} className="p-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"><Mail className="w-3.5 h-3.5" /></a>}
                      {!wa && !c.official_email && <span className="text-slate-300">No contact saved</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Nothing in this window. Make sure CR / MISA expiry dates are filled in the company profile.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

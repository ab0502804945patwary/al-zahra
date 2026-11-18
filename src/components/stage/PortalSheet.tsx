'use client'
import Link from 'next/link'
import { ArrowLeft, Printer, ShieldAlert } from 'lucide-react'
import { INVOICE_COMPANY as CO } from '@/lib/invoiceConfig'
import { portalByKey, type PortalAccount } from '@/lib/portals'
import PortalLogo from './PortalLogo'

export default function PortalSheet({ entry, company }: { entry: { id: string; company_id: string; portal_accounts?: PortalAccount[] | null }; company?: { company_name?: string; client_name?: string; client_phone?: string } | null }) {
  const rows = (entry.portal_accounts || []).filter(r => r.portal)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="w-full max-w-[210mm] mx-auto space-y-4 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/stage/6" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"><Printer className="w-3.5 h-3.5" /> Download PDF / Print</button>
      </div>

      <div className="print-area relative bg-white shadow-md border border-slate-200 flex flex-col min-h-[297mm] print:shadow-none print:border-0">
        <div className="h-2 bg-blue-600" />
        <div className="px-[14mm] pt-[10mm] flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-6">
            <div>
              <img src="/al_zahra_logo.svg" alt="AL ZAHRA" className="h-12 w-auto" />
              <div className="mt-2 text-[15px] font-bold text-slate-900 tracking-wide">{CO.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[26px] leading-none font-extrabold text-blue-600 tracking-tight">PORTAL ACCOUNTS</div>
              <div className="mt-2 text-xs text-slate-500">Date: {today}</div>
            </div>
          </div>

          <div className="my-6 h-px bg-slate-200" />

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">Company</div>
            <div className="mt-1.5 text-[15px] font-bold text-slate-900">{company?.company_name || entry.company_id}</div>
            <div className="mt-0.5 text-xs text-slate-600">{[entry.company_id, company?.client_name, company?.client_phone].filter(Boolean).join(' · ')}</div>
          </div>

          <table className="w-full mt-7 text-[13px]">
            <thead>
              <tr className="bg-blue-600 text-white text-[11px] uppercase tracking-wider">
                <th className="text-left py-2.5 px-3 font-semibold">Portal</th>
                <th className="text-left py-2.5 px-3 font-semibold">User name / ID</th>
                <th className="text-left py-2.5 px-3 font-semibold">Password</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i % 2 ? 'bg-slate-50' : ''}>
                  <td className="py-3 px-3"><div className="flex items-center gap-3"><PortalLogo portal={r.portal} size={34} /><span className="font-semibold text-slate-900">{portalByKey(r.portal)?.name || r.portal}</span></div></td>
                  <td className="py-3 px-3 font-mono text-slate-800 break-all">{r.username || '—'}</td>
                  <td className="py-3 px-3 font-mono text-slate-800 break-all">{r.password || '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-slate-400">No portal accounts saved yet.</td></tr>}
            </tbody>
          </table>
          <div className="h-px bg-slate-200" />

          <div className="mt-6 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Keep these details private. Do not share them with anyone outside your company. We recommend changing each password after the first sign-in.</p>
          </div>

          <div className="mt-auto pt-8 text-center text-xs font-semibold text-slate-500">{CO.thanks}</div>
        </div>
        <div className="mt-6 bg-slate-900 text-slate-200 px-[14mm] py-4 text-[11px] grid grid-cols-3 gap-4">
          {CO.offices.map(o => (<div key={o.label}><div className="font-bold text-white">{o.label}</div><div className="text-slate-300 leading-snug">{o.address}</div></div>))}
          <div>{CO.phone}</div>
        </div>
      </div>
    </div>
  )
}

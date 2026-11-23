'use client'
import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { matchesQuery } from '@/lib/search'
import { bdt } from '@/lib/money'
import JournalForm from './JournalForm'

export default function JournalClient({ entries, accounts, balances }: { entries: any[]; accounts: any[]; balances: any[] }) {
  const [adding, setAdding] = useState<'journal' | 'settle' | null>(null)
  const [tab, setTab] = useState<'entries' | 'cash'>('entries')
  const [search, setSearch] = useState('')

  const rows = useMemo(() => entries.filter((e, i) => matchesQuery(search, entries.length - i, [e.voucher_no, e.entry_type, e.description, e.reference_no, e.employee_name])), [entries, search])

  if (adding) return <JournalForm accounts={accounts} balances={balances} startAsSettlement={adding === 'settle'} onClose={() => setAdding(null)} />

  const pendingTotal = balances.reduce((s, b) => s + Number(b.pending), 0)
  const stats: [string, string][] = [
    ['Journal entries', String(entries.length)],
    ['Cash still with staff', bdt(pendingTotal)],
    ['Staff holding cash', String(balances.filter(b => Number(b.pending) > 0.004).length)],
  ]

  return (
    <div className="space-y-5 w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Journal &amp; Staff Cash</h1>
          <p className="text-xs text-slate-500 mt-0.5">Journal entries, and cash that staff hand over to the office.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding('settle')} className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100">Employee Settlement</button>
          <button onClick={() => setAdding('journal')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"><Plus className="w-4 h-4" /> Journal Entry</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(([l, v]) => <div key={l} className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm"><p className="text-xs font-medium text-slate-500">{l}</p><p className="text-lg font-bold text-slate-900 mt-1">{v}</p></div>)}
      </div>

      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
        {([['entries', 'Journal Entries'], ['cash', 'Staff Cash']] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-md transition ${tab === k ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{l}</button>)}
      </div>

      {tab === 'entries' ? (
        <>
          <div className="relative max-w-md w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search voucher, type, description, employee..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
                <tr>{['Voucher No.', 'Date', 'Type', 'Description', 'Lines', 'Amount', 'Status'].map(h => <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/70 align-top">
                    <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{e.voucher_no}</td>
                    <td className="px-3 py-2.5 text-slate-600">{e.entry_date}</td>
                    <td className="px-3 py-2.5 text-slate-700">{e.entry_type}</td>
                    <td className="px-3 py-2.5 text-slate-700">{e.description}{e.reference_no && <div className="text-[11px] text-slate-400">Ref: {e.reference_no}</div>}</td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-600">{(e.journal_lines || []).map((l: any, i: number) => <div key={i}><span className={Number(l.debit) > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>{Number(l.debit) > 0 ? 'Dr' : 'Cr'}</span> {l.accounts?.name} <span className="font-mono">{bdt(Number(l.debit) || Number(l.credit))}</span></div>)}</td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">{bdt(e.total)}</td>
                    <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${e.status === 'Posted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{e.status}</span></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="text-center py-14 text-slate-400">No journal entries yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-xs min-w-[600px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
              <tr>{['Employee', 'Cash collected', 'Handed over', 'Pending with employee'].map(h => <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balances.map(b => (
                <tr key={b.employee_name} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{b.employee_name}</td>
                  <td className="px-3 py-2.5 font-mono">{bdt(b.collected)}</td>
                  <td className="px-3 py-2.5 font-mono text-emerald-700">{bdt(b.settled)}</td>
                  <td className={`px-3 py-2.5 font-mono font-bold ${Number(b.pending) > 0.004 ? 'text-rose-600' : 'text-slate-400'}`}>{bdt(b.pending)}</td>
                </tr>
              ))}
              {balances.length === 0 && <tr><td colSpan={4} className="text-center py-14 text-slate-400">No staff yet.</td></tr>}
            </tbody>
          </table>
          <p className="px-3 py-2 text-[11px] text-slate-400 border-t border-slate-100">Counts Receive Vouchers paid in Cash, marked Completed, with that person as “Received By”. Bank and wallet receipts are not counted.</p>
        </div>
      )}
    </div>
  )
}

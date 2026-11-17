'use client'
import { useState } from 'react'
import { Plus, Search, Edit2, UserRound } from 'lucide-react'
import { matchesQuery } from '@/lib/search'
import CustomerForm, { nextCustomerCode } from './CustomerForm'

export interface Customer { id: string; customer_code: string; [k: string]: any }

const statusTone = (s?: string) =>
  s === 'Blocked' ? 'bg-rose-50 text-rose-700 border-rose-200'
  : s === 'Inactive' ? 'bg-slate-100 text-slate-500 border-slate-300'
  : 'bg-emerald-50 text-emerald-700 border-emerald-200'

export default function CustomersClient({ customers, staffNames }: { customers: Customer[]; staffNames: string[] }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Customer | 'new' | null>(null)

  if (editing) {
    return (
      <CustomerForm
        customer={editing === 'new' ? undefined : editing}
        nextCode={nextCustomerCode(customers)}
        staffNames={staffNames}
        onClose={() => setEditing(null)}
      />
    )
  }

  const filtered = customers.filter((c, i) =>
    matchesQuery(search, customers.length - i, [
      c.customer_code, c.given_name, c.surname, `${c.given_name} ${c.surname}`, c.father_name, c.phone, c.email,
      c.whatsapp, c.nid_number, c.passport_number, c.iqama_number, c.nationality, c.customer_type, c.agent, c.assigned_to,
    ])
  )

  return (
    <div className="space-y-5 w-full max-w-[2000px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customers</h1>
          <p className="text-xs text-slate-500 mt-0.5">Individual, corporate, VIP and guest customer records</p>
        </div>
        <button onClick={() => setEditing('new')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, code, phone, email, NID, passport..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <div className="text-xs text-slate-500 font-medium">Showing <span className="font-bold text-slate-800">{filtered.length}</span> of {customers.length}</div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
            <tr>{['Code', 'Customer', 'Type', 'Phone', 'Email', 'Nationality', 'Assigned To', 'Status', ''].map(h => <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/70">
                <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{c.customer_code}</td>
                <td className="px-3 py-2.5">
                  <div className="font-semibold text-slate-900">{c.given_name} {c.surname}</div>
                  {c.father_name && <div className="text-[11px] text-slate-400">S/O {c.father_name}</div>}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{c.customer_type}</td>
                <td className="px-3 py-2.5 font-mono text-slate-600">{c.phone || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{c.email || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{c.nationality || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{c.assigned_to || '—'}</td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusTone(c.status)}`}>{c.status}</span></td>
                <td className="px-3 py-2.5 text-right">
                  <button onClick={() => setEditing(c)} className="p-1.5 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-700"><Edit2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center py-14 text-slate-400"><UserRound className="w-10 h-10 mx-auto mb-2 opacity-20" />No customers yet. Click “Add Customer” to create the first one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

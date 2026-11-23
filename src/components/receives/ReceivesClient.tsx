'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Paperclip, CheckCircle2, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { matchesQuery } from '@/lib/search'
import { bdt } from '@/lib/money'
import ReceiveForm from './ReceiveForm'

export default function ReceivesClient({ vouchers, customers, invoices, staffNames, me }: { vouchers: any[]; customers: any[]; invoices: any[]; staffNames: string[]; me: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [busy, setBusy] = useState<string | null>(null)

  // invoices with what is still due on each
  const open = useMemo(() => invoices.map(i => {
    const paid = (i.payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0)
    return { id: i.id, invoice_no: i.invoice_no, customer_id: i.customer_id, customer_name: i.customer_name, phone: i.customer_phone, date: i.invoice_date, total: Number(i.total), due: Number(i.total) - paid }
  }).filter(i => i.due > 0.004), [invoices])

  const usedAccounts = useMemo(() => [...new Set(vouchers.map(v => v.account_name).filter(Boolean))] as string[], [vouchers])

  if (adding) return <ReceiveForm customers={customers} openInvoices={open} vouchers={vouchers} staffNames={staffNames} me={me} usedAccounts={usedAccounts} onClose={() => setAdding(false)} />

  const month = new Date().toISOString().slice(0, 7)
  const done = vouchers.filter(v => v.status === 'Completed')
  const todayStr = new Date().toISOString().slice(0, 10)
  const todays = done.filter(v => v.receive_date === todayStr)
  const stats: [string, string, string?][] = [
    ['Total Receive', String(vouchers.length), `${bdt(done.reduce((s, v) => s + Number(v.amount), 0))} received`],
    ["Today's Receive", String(todays.length), bdt(todays.reduce((s, v) => s + Number(v.amount), 0))],
    ['This Month', bdt(done.filter(v => String(v.receive_date).startsWith(month)).reduce((s, v) => s + Number(v.amount), 0))],
    ['Completed', String(done.length), `${vouchers.length - done.length} pending`],
    ['Still due from customers', bdt(open.reduce((s, i) => s + i.due, 0))],
  ]
  const rows = vouchers.filter((v, i) => (status === 'All' || v.status === status) && matchesQuery(search, vouchers.length - i, [v.voucher_no, v.customers?.given_name, v.customers?.surname, v.customers?.phone, v.invoices?.invoice_no, v.received_by, v.reference_no, v.account_type]))

  function exportCsv() {
    const q = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const head = ['Voucher No.', 'Date', 'Customer', 'Phone', 'Invoice', 'Account type', 'Account', 'Amount (BDT)', 'Received by', 'Reference', 'Status', 'Notes']
    const lines = [head.join(','), ...rows.map(v => [v.voucher_no, v.receive_date, v.customers ? `${v.customers.given_name} ${v.customers.surname}` : '', v.customers?.phone, v.invoices?.invoice_no || 'Auto', v.account_type, v.account_name, Number(v.amount).toFixed(2), v.received_by, v.reference_no, v.status, v.notes].map(q).join(','))]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
    a.download = 'receive-vouchers.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  async function openFile(path: string) {
    const { data } = await supabase.storage.from('receive-files').createSignedUrl(path, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener')
  }
  async function complete(id: string) {
    setBusy(id)
    const { error } = await supabase.rpc('complete_receive', { p_id: id })
    setBusy(null)
    if (error) return alert(error.message)
    router.refresh()
  }

  return (
    <div className="space-y-5 w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Receive Vouchers</h1>
          <p className="text-xs text-slate-500 mt-0.5">Money received from customers. Each voucher is taken off what the customer owes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"><Download className="w-3.5 h-3.5" /> Export</button>
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"><Plus className="w-4 h-4" /> Receive Voucher</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(([l, v, sub]) => <div key={l} className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm"><p className="text-xs font-medium text-slate-500">{l}</p><p className="text-lg font-bold text-slate-900 mt-1">{v}</p>{sub && <p className="text-[11px] text-emerald-600 mt-0.5">{sub}</p>}</div>)}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search voucher, customer, invoice, received by..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
          {['All', 'Completed', 'Pending'].map(s => <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-md transition ${status === s ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{s}</button>)}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs min-w-[1000px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
            <tr>{['Voucher No.', 'Date', 'Customer', 'Invoice', 'Account', 'Amount', 'Received By', 'Reference', 'Note', 'Files', 'Status', ''].map(h => <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(v => (
              <tr key={v.id} className="hover:bg-slate-50/70">
                <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{v.voucher_no}</td>
                <td className="px-3 py-2.5 text-slate-600">{v.receive_date}</td>
                <td className="px-3 py-2.5"><div className="font-semibold text-slate-900">{v.customers ? `${v.customers.given_name} ${v.customers.surname}` : '—'}</div><div className="text-[11px] text-slate-400 font-mono">{v.customers?.phone}</div></td>
                <td className="px-3 py-2.5 font-mono text-slate-600">{v.invoices?.invoice_no || <span className="text-slate-400 font-sans">Auto (oldest first)</span>}</td>
                <td className="px-3 py-2.5 text-slate-700">{v.account_type}{v.account_name ? <span className="text-slate-400"> · {v.account_name}</span> : ''}</td>
                <td className="px-3 py-2.5 font-mono font-semibold text-emerald-700">{bdt(v.amount)}</td>
                <td className="px-3 py-2.5 text-slate-700">{v.received_by || '—'}</td>
                <td className="px-3 py-2.5 text-slate-500">{v.reference_no || '—'}</td>
                <td className="px-3 py-2.5 text-slate-500 max-w-40 truncate" title={v.notes || ''}>{v.notes || '—'}</td>
                <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1">{(v.attachments || []).map((a: any, i: number) => <button key={a.path} onClick={() => openFile(a.path)} title={a.name} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] text-blue-600 hover:bg-blue-50"><Paperclip className="w-3 h-3" />{i + 1}</button>)}</div></td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${v.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{v.status}</span></td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">{v.status === 'Pending' && <button onClick={() => complete(v.id)} disabled={busy === v.id} title="Mark as received" className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Mark received</button>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={12} className="text-center py-14 text-slate-400">No receive vouchers yet. Click “Receive Voucher”.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

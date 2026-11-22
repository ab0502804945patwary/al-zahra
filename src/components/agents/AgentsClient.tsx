'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Search, Loader2, Save, X, Handshake } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { matchesQuery } from '@/lib/search'

interface Agent { id: string; agent_code: string; company_name?: string | null; agent_name: string; mobile?: string | null; address?: string | null; category?: string | null; remarks?: string | null }

const inputCls = 'w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400'
const SAUDI_LOCATIONS = [
  'Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Al Khobar', 'Dhahran', 'Jubail', 'Al Ahsa (Hofuf)', 'Qatif',
  'Taif', 'Yanbu', 'Rabigh', 'Tabuk', 'Abha', 'Khamis Mushait', 'Najran', 'Jazan', 'Buraidah', 'Unaizah',
  'Hail', 'Al Kharj', 'Al Majmaah', 'Sakaka', 'Arar', 'Al Bahah', 'Hafar Al Batin', 'Other',
]
const CATEGORY_OPTIONS = ['Travel Agency', 'Consultancy', 'Maktab Al Khadamat']
const EMPTY = { company_name: '', agent_name: '', mobile: '', address: '', category: '', remarks: '' }

function nextCode(agents: Agent[]) {
  let max = 0
  for (const a of agents) { const m = String(a.agent_code).match(/AGT(\d+)/i); if (m) max = Math.max(max, parseInt(m[1], 10)) }
  return `AGT${String(max + 1).padStart(4, '0')}`
}

export default function AgentsClient({ agents }: { agents: Agent[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [editing, setEditing] = useState<Agent | 'new' | null>(null)
  const [form, setForm] = useState<Record<string, string>>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // fixed options first; any older custom value already saved is kept so nothing is lost
  const categories = useMemo(() => [...CATEGORY_OPTIONS, ...new Set(agents.map(a => a.category).filter((c): c is string => !!c && !CATEGORY_OPTIONS.includes(c)))], [agents])

  function open(a: Agent | 'new') {
    setError('')
    setForm(a === 'new' ? { ...EMPTY } : { company_name: a.company_name || '', agent_name: a.agent_name, mobile: a.mobile || '', address: a.address || '', category: a.category || '', remarks: a.remarks || '' })
    setEditing(a)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.agent_name.trim()) return setError('Enter the agent name')
    setLoading(true)
    const base = { company_name: form.company_name.trim() || null, agent_name: form.agent_name.trim(), mobile: form.mobile.trim() || null, address: form.address.trim() || null, category: form.category.trim() || null, remarks: form.remarks.trim() || null, updated_at: new Date().toISOString() }
    const { error: err } = editing === 'new'
      ? await supabase.from('agents').insert([{ ...base, agent_code: nextCode(agents) }])
      : await supabase.from('agents').update(base).eq('id', (editing as Agent).id)
    setLoading(false)
    if (err) return setError(err.message)
    setEditing(null)
    router.refresh()
  }

  const filtered = agents.filter((a, i) =>
    (catFilter === 'All' || a.category === catFilter) &&
    matchesQuery(search, i + 1, [a.agent_code, a.company_name, a.agent_name, a.mobile, a.address, a.category, a.remarks])
  )

  if (editing) {
    return (
      <form onSubmit={save} className="w-full max-w-[1000px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{editing === 'new' ? 'Add Agent' : 'Edit Agent'}</h1>
            <p className="text-xs text-slate-500 font-mono">{editing === 'new' ? nextCode(agents) : editing.agent_code}</p>
          </div>
          <button type="button" onClick={() => setEditing(null)} title="Back" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Agent Name<span className="text-rose-500 ml-0.5">*</span></label>
            <input value={form.agent_name} onChange={e => setForm(p => ({ ...p, agent_name: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Company Name</label>
            <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Mobile No.</label>
            <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Agent Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls}>
              <option value="">Select category...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Address / Location</label>
            <select value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputCls}>
              <option value="">Select location (Saudi Arabia)...</option>
              {[...new Set([...SAUDI_LOCATIONS, ...(form.address && !SAUDI_LOCATIONS.includes(form.address) ? [form.address] : [])])].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Remarks</label>
            <textarea rows={3} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} className={inputCls} />
          </div>
        </div>
        {error && <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {editing === 'new' ? 'Create Agent' : 'Update Agent'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-5 w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Agents</h1>
          <p className="text-xs text-slate-500 mt-0.5">Agent collection list: who they are, how to reach them, and their category</p>
        </div>
        <button onClick={() => open('new')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"><Plus className="w-4 h-4" /> Add Agent</button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agent name, ID, company, mobile, location..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        {(
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white">
            <option>All</option>{categories.map(c => <option key={c}>{c}</option>)}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
            <tr>{['Agent ID', 'Company Name', 'Agent Name', 'Mobile No.', 'Address / Location', 'Category', 'Remarks', ''].map(h => <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-slate-50/70">
                <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{a.agent_code}</td>
                <td className="px-3 py-2.5 text-slate-700">{a.company_name || '—'}</td>
                <td className="px-3 py-2.5 font-semibold text-slate-900">{a.agent_name}</td>
                <td className="px-3 py-2.5 font-mono text-slate-600">{a.mobile || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{a.address || '—'}</td>
                <td className="px-3 py-2.5">{a.category ? <span className="px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-semibold">{a.category}</span> : '—'}</td>
                <td className="px-3 py-2.5 text-slate-500 max-w-48 truncate">{a.remarks || '—'}</td>
                <td className="px-3 py-2.5 text-right"><button onClick={() => open(a)} className="p-1.5 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-700"><Edit2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-14 text-slate-400"><Handshake className="w-10 h-10 mx-auto mb-2 opacity-20" />No agents yet. Click “Add Agent”.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Loader2, Save, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { bdt } from '@/lib/money'

interface Service { id: string; name: string; price: number; description?: string | null; is_active: boolean }

const inputCls = 'w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400'

export default function ServicesClient({ services }: { services: Service[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState<Service | 'new' | null>(null)
  const [form, setForm] = useState({ name: '', price: '', description: '', is_active: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function open(s: Service | 'new') {
    setError('')
    setForm(s === 'new' ? { name: '', price: '', description: '', is_active: true } : { name: s.name, price: String(s.price), description: s.description || '', is_active: s.is_active })
    setEditing(s)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const price = Number(form.price)
    if (!form.name.trim()) return setError('Enter the service name')
    if (!(price >= 0) || form.price === '') return setError('Enter a valid price')
    setLoading(true)
    const payload = { name: form.name.trim(), price, description: form.description.trim() || null, is_active: form.is_active, updated_at: new Date().toISOString() }
    const { error: err } = editing === 'new'
      ? await supabase.from('services').insert([payload])
      : await supabase.from('services').update(payload).eq('id', (editing as Service).id)
    setLoading(false)
    if (err) return setError(err.message)
    setEditing(null)
    router.refresh()
  }

  return (
    <div className="space-y-5 w-full max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Services</h1>
          <p className="text-xs text-slate-500 mt-0.5">Write each service once with its price. Pick them when making an invoice.</p>
        </div>
        <button onClick={() => open('new')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">{editing === 'new' ? 'New Service' : 'Edit Service'}</h2>
            <button type="button" onClick={() => setEditing(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Service Name<span className="text-rose-500 ml-0.5">*</span></label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g. MISA License Renewal" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Price (৳)<span className="text-rose-500 ml-0.5">*</span></label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={inputCls} placeholder="0.00" />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Description</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputCls} placeholder="Optional" />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="accent-blue-600" />
            Active (shows in the invoice list)
          </label>
          {error && <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Service
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs min-w-[600px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
            <tr>{['Service', 'Description', 'Price', 'Status', ''].map(h => <th key={h} className="text-left font-semibold px-3 py-2.5">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/70">
                <td className="px-3 py-2.5 font-semibold text-slate-900">{s.name}</td>
                <td className="px-3 py-2.5 text-slate-500">{s.description || '—'}</td>
                <td className="px-3 py-2.5 font-mono text-slate-800">{bdt(s.price)}</td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="px-3 py-2.5 text-right"><button onClick={() => open(s)} className="p-1.5 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-700"><Edit2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {services.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400">No services yet. Click “Add Service”.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

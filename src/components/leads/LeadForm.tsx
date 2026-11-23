'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, Loader2, Save, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CountrySelect from '@/components/ui/CountrySelect'
import ComboInput from '@/components/ui/ComboInput'
import SourceIcon from '@/components/ui/SourceIcon'
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_SERVICES } from '@/lib/leadConfig'
import { placesFor } from '@/lib/regions'
import IconSelect from '@/components/ui/IconSelect'
import Avatar from '@/components/ui/Avatar'

interface Lead { id: string; lead_date?: string | null; lead_name: string; mobile?: string | null; country?: string | null; city?: string | null; company_name?: string | null; service_required?: string | null; source?: string | null; assigned_to?: string | null; status: string; follow_up_date?: string | null; notes?: string | null }

const inputCls = 'w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-600'

export default function LeadForm({ lead, staff, serviceNames, usedSources = [], usedServices = [], readOnly = false }: { lead?: Lead; staff: { name: string; avatar: string | null }[]; serviceNames: string[]; usedSources?: string[]; usedServices?: string[]; readOnly?: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState<Record<string, string>>(() => ({
    lead_date: lead?.lead_date || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10), lead_name: lead?.lead_name || '', mobile: lead?.mobile || '', country: lead?.country || 'Saudi Arabia', city: lead?.city || '', company_name: lead?.company_name || '',
    service_required: lead?.service_required || '', source: lead?.source || '', assigned_to: lead?.assigned_to || '', status: lead?.status || 'New',
    follow_up_date: lead?.follow_up_date || '', notes: lead?.notes || '',
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  // suggestions: the defaults, the Services page, and anything typed on earlier leads
  const serviceOptions = [...new Set([...serviceNames, ...LEAD_SERVICES, ...usedServices])]
  const sourceOptions = [...new Set([...LEAD_SOURCES, ...usedSources])]
  // cities of the chosen country (a city can also be typed when the list does not have it)
  const cityOptions = (() => { const pl = placesFor(form.country); return pl ? [...new Set([...pl.cities, ...pl.regions])] : [] })()

  const L = (t: string, req = false) => <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{t}{req && <span className="text-rose-500 ml-0.5">*</span>}</label>

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.lead_name.trim()) return setError('Enter the lead name')
    if (!form.mobile.trim()) return setError('Enter the mobile number')
    setLoading(true)
    const row: Record<string, any> = {}
    for (const [k, v] of Object.entries(form)) row[k] = v.trim() === '' ? null : v.trim()
    row.updated_at = new Date().toISOString()
    const { error: err } = lead ? await supabase.from('leads').update(row).eq('id', lead.id) : await supabase.from('leads').insert([row])
    setLoading(false)
    if (err) return setError(err.message)
    router.push('/dashboard/leads')
    router.refresh()
  }

  return (
    <form onSubmit={save} className="w-full max-w-[1000px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{readOnly ? 'Lead Details' : lead ? 'Edit Lead' : 'New Lead'}</h1>
          <p className="text-xs text-slate-500">{lead ? lead.lead_name : 'Write down who asked and what they need, then follow up'}</p>
        </div>
        <div className="flex items-center gap-2">
          {readOnly && lead && <Link href={`/dashboard/leads/${lead.id}`} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"><Pencil className="w-3.5 h-3.5" /> Edit</Link>}
          <Link href="/dashboard/leads" title="Back to leads" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-5 h-5" /></Link>
        </div>
      </div>

      <fieldset disabled={readOnly} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">{L('Date')}<input type="date" value={form.lead_date} onChange={e => set('lead_date', e.target.value)} className={inputCls} /></div>
        <div>{L('Lead Name', true)}<input value={form.lead_name} onChange={e => set('lead_name', e.target.value)} className={inputCls} placeholder="Full name" /></div>
        <div>{L('Mobile', true)}<input value={form.mobile} onChange={e => set('mobile', e.target.value)} className={inputCls} placeholder="+966 5x xxx xxxx" /></div>
        <div>{L('Country')}<CountrySelect value={form.country} onChange={v => setForm(p => ({ ...p, country: v, city: '' }))} /></div>
        <div>{L('City')}<ComboInput value={form.city} onChange={v => set('city', v)} options={cityOptions} className={inputCls} placeholder="Type or pick a city" /></div>
        <div>{L('Company Name')}<input value={form.company_name} onChange={e => set('company_name', e.target.value)} className={inputCls} placeholder="Company (if any)" /></div>
        <div>{L('Service Required')}<ComboInput value={form.service_required} onChange={v => set('service_required', v)} options={serviceOptions} className={inputCls} placeholder="Type or pick a service" /></div>
        <div>{L('Source')}<ComboInput value={form.source} onChange={v => set('source', v)} options={sourceOptions} renderIcon={v => <SourceIcon source={v} />} className={inputCls} placeholder="Type or pick a source" /></div>
        <div>{L('Assigned To')}
          <IconSelect value={form.assigned_to} onChange={v => set('assigned_to', v)} placeholder="Select employee" emptyLabel="—" options={staff.map(x => ({ value: x.name, label: x.name, icon: <Avatar name={x.name} src={x.avatar} size={20} /> }))} className={inputCls} /></div>
        <div>{L('Status')}
          <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>{LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
        <div>{L('Follow-up Date')}<input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} className={inputCls} /></div>
        <div className="sm:col-span-2">{L('Notes')}<textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls} placeholder="What was discussed, price given, next step..." /></div>
      </fieldset>

      {error && <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
      {!readOnly && (
        <div className="flex gap-3">
          <Link href="/dashboard/leads" className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {lead ? 'Update Lead' : 'Save Lead'}
          </button>
        </div>
      )}
    </form>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CountrySelect from '@/components/ui/CountrySelect'
import type { Customer } from './CustomersClient'

export function nextCustomerCode(customers: Customer[]): string {
  let max = 0
  for (const c of customers) {
    const m = String(c.customer_code || '').match(/CUS(\d+)/i)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `CUS${String(max + 1).padStart(7, '0')}`
}

const TYPES = ['Individual', 'Corporate', 'VIP', 'Guest Customer']
const STATUSES = ['Active', 'Inactive', 'Blocked']
const inputCls = 'w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-slate-400'
const DATE_FIELDS = ['date_of_birth', 'platform_registered_on', 'passport_issue_date', 'passport_expiry_date']

export default function CustomerForm({ customer, nextCode, staffNames, agentNames, onClose }: { customer?: Customer; nextCode: string; staffNames: string[]; agentNames: string[]; onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, any>>(() => customer ? { ...customer } : {
    customer_code: nextCode, customer_type: 'Individual', status: 'Active', nationality: 'Bangladesh',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const text = (label: string, name: string, opts: { type?: string; required?: boolean; placeholder?: string; span?: string } = {}) => (
    <div key={name} className={opts.span}>
      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{label}{opts.required && <span className="text-rose-500 ml-0.5">*</span>}</label>
      <input type={opts.type || 'text'} value={form[name] || ''} onChange={e => set(name, e.target.value)} placeholder={opts.placeholder} className={inputCls} />
    </div>
  )
  const select = (label: string, name: string, options: string[], required = false) => (
    <div key={name}>
      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
      <select value={form[name] || ''} onChange={e => set(name, e.target.value)} className={inputCls}>
        <option value="">Select {label.toLowerCase()}...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  const radios = (label: string, name: string, options: string[]) => (
    <div key={name}>
      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{label}<span className="text-rose-500 ml-0.5">*</span></label>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {options.map(o => (
          <label key={o} className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="radio" name={name} checked={form[name] === o} onChange={() => set(name, o)} className="accent-blue-600" />{o}
          </label>
        ))}
      </div>
    </div>
  )
  const card = (title: string | null, children: React.ReactNode) => (
    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
      {title && <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-200">{title}</h3>}
      {children}
    </div>
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const missing = [
      ['given_name', 'Given Name'], ['surname', 'Surname'], ['gender', 'Gender'], ['phone', 'Phone'],
      ['email', 'Email'], ['assigned_to', 'Assigned To'],
    ].filter(([k]) => !String(form[k] || '').trim()).map(([, l]) => l)
    if (missing.length) { setError(`Please fill: ${missing.join(', ')}`); return }
    setLoading(true)
    const payload: Record<string, any> = { ...form }
    for (const k of Object.keys(payload)) if (payload[k] === '') payload[k] = null
    for (const k of DATE_FIELDS) if (!payload[k]) payload[k] = null
    delete payload.id
    delete payload.created_at
    payload.updated_at = new Date().toISOString()
    const { error: err } = customer
      ? await supabase.from('customers').update(payload).eq('id', customer.id)
      : await supabase.from('customers').insert([payload])
    setLoading(false)
    if (err) { setError(err.message.includes('duplicate') ? 'This customer code already exists.' : err.message); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{customer ? 'Edit Customer' : 'Add Customer'}</h1>
          <p className="text-xs text-slate-500">{customer ? customer.customer_code : nextCode}</p>
        </div>
        <button onClick={onClose} title="Back to customers" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {(
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              {card(null, <>
                {radios('Customer Type', 'customer_type', TYPES)}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {text('Customer Code', 'customer_code', { required: true })}
                  {text('Given Name', 'given_name', { required: true, placeholder: 'Enter given name' })}
                  {text('Surname', 'surname', { required: true, placeholder: 'Enter surname' })}
                  {text("Father's Name", 'father_name', { placeholder: "Enter father's name" })}
                  {text('Date of Birth', 'date_of_birth', { type: 'date' })}
                  {select('Gender', 'gender', ['Male', 'Female', 'Other'], true)}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Nationality</label>
                    <CountrySelect value={form.nationality} onChange={v => set('nationality', v)} />
                  </div>
                  {text('NID Number', 'nid_number', { placeholder: 'Enter NID number' })}
                  {text('Birth Certificate Number', 'birth_certificate_no', { placeholder: 'Enter birth certificate number' })}
                  {text('Iqama Number', 'iqama_number', { placeholder: 'Enter Iqama number' })}
                </div>
              </>)}
            </div>
            <div className="lg:col-span-2 space-y-4">
              {card('Contact Information', <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {text('Phone', 'phone', { required: true, placeholder: '+8801XXXXXXXXX' })}
                {text('Email', 'email', { required: true, type: 'email', placeholder: 'customer@example.com' })}
              </div>)}
              {card('Status & Assignment', <>
                {radios('Status', 'status', STATUSES)}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {select('Agent', 'agent', agentNames)}
                  {select('Assigned To', 'assigned_to', staffNames, true)}
                </div>
              </>)}
            </div>
          </div>
        )}

        {error && <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex gap-3 pt-3 border-t border-slate-200">
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {customer ? 'Update Customer' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  )
}

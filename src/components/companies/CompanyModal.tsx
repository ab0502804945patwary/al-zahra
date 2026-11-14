'use client'
import { useState } from 'react'
import {
  X,
  Loader2,
  Trash2,
  Building2,
  FileCheck,
  PhoneCall,
  Users,
  Landmark,
  Sliders,
  Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Company } from '@/lib/types'

interface Props { company?: Company; onClose: () => void }

export default function CompanyModal({ company, onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Record<string, string>>(company as any || {})
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (company) {
        await supabase.from('companies').update(form).eq('id', company.id)
      } else {
        await supabase.from('companies').insert([form])
      }
    } catch (err) {
      console.log('Saved company locally:', err)
    }
    router.refresh()
    onClose()
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this company entity and all associated records?')) return
    try {
      await supabase.from('companies').delete().eq('id', company!.id)
    } catch (err) {
      console.log('Deleted locally:', err)
    }
    router.refresh()
    onClose()
  }

  const F = ({ label, name, type = 'text', half = false }: { label: string; name: string; type?: string; half?: boolean }) => (
    <div className={half ? '' : 'col-span-2'}>
      <label className="text-xs font-medium text-slate-700 mb-1 block">{label}</label>
      <input
        type={type}
        value={form[name] || ''}
        onChange={e => set(name, e.target.value)}
        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
    </div>
  )

  const sections = [
    {
      title: 'Company Profile & Identification',
      icon: Building2,
      fields: [
        { label: 'Company Identifier (ID)', name: 'company_id', half: true },
        { label: 'Country of Origin / Nationality', name: 'country_of_origin', half: true },
        { label: 'Official Registered Name', name: 'company_name' },
        { label: 'Entity Structure / License Type', name: 'entity_type' },
      ]
    },
    {
      title: 'Statutory & Legal Identifiers',
      icon: FileCheck,
      fields: [
        { label: 'Commercial Registration (CR) Number', name: 'cr_number', half: true },
        { label: 'CR Issue Date', name: 'cr_issue_date', type: 'date', half: true },
        { label: 'CR Expiration Date', name: 'cr_expire_date', type: 'date', half: true },
        { label: 'MISA License Number', name: 'misa_license_no', half: true },
        { label: 'MISA Issue Date', name: 'misa_issue_date', type: 'date', half: true },
        { label: 'MISA Expiration Date', name: 'misa_expire_date', type: 'date', half: true },
        { label: 'Tax Identification Number (TIN)', name: 'tin_number', half: true },
        { label: 'VAT Registration Number', name: 'vat_number', half: true },
        { label: 'Chamber of Commerce Ref', name: 'chamber_registration_no', half: true },
        { label: 'GOSI / Qiwa Compliance Status', name: 'gosi_qiwa_status', half: true },
      ]
    },
    {
      title: 'Headquarters & Official Communication',
      icon: PhoneCall,
      fields: [
        { label: 'Corporate Email', name: 'official_email', type: 'email', half: true },
        { label: 'Direct WhatsApp Contact', name: 'whatsapp_number', half: true },
        { label: 'National Address / Headquarters Location', name: 'national_address' },
      ]
    },
    {
      title: 'Executive Leadership & Shareholders',
      icon: Users,
      fields: [
        { label: 'CEO / General Manager Name', name: 'ceo_gm_name', half: true },
        { label: 'National ID / Iqama Number', name: 'iqama_no', half: true },
        { label: 'Principal Shareholder Name', name: 'shareholders_name', half: true },
        { label: 'Shareholder Mobile', name: 'shareholder_phone', half: true },
      ]
    },
    {
      title: 'Banking & Treasury Accounts',
      icon: Landmark,
      fields: [
        { label: 'Depository Bank Name', name: 'bank_name', half: true },
        { label: 'Beneficiary Account Name', name: 'account_name', half: true },
        { label: 'Account Number', name: 'account_number', half: true },
        { label: 'IBAN / SWIFT Identifier', name: 'iban_swift', half: true },
      ]
    },
    {
      title: 'Administrative & Operational Controls',
      icon: Sliders,
      fields: [
        { label: 'Portal / Digital Credentials Reference', name: 'file_portal_login', half: true },
        { label: 'Operational Status', name: 'account_status', half: true },
        { label: 'Assigned Regional Office', name: 'assigned_office', half: true },
        { label: 'Cloud Document Folder (Google Drive)', name: 'drive_link', half: true },
        { label: 'Account Handler Officer', name: 'employee', half: true },
        { label: 'Confidential Internal Remarks', name: 'remarks', half: true },
      ]
    },
  ]

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {company ? 'Edit Corporate Profile' : 'Register Corporate Entity'}
            </h2>
            <p className="text-xs text-slate-400">Master record database</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {sections.map(section => {
            const SectionIcon = section.icon
            return (
              <div key={section.title} className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200/60">
                  <SectionIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{section.title}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {section.fields.map(f => <F key={f.name} {...f} />)}
                </div>
              </div>
            )
          })}

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            {company && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 border border-rose-200 text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-50 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Entity
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : (company ? 'Update Entity' : 'Create Entity Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

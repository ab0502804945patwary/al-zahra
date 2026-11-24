'use client'
import { useState } from 'react'
import { X, Loader2, Trash2 } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BdFields from './BdFields'
import ParentChecks from './ParentChecks'
import CountrySelect from '@/components/ui/CountrySelect'
import ComboInput from '@/components/ui/ComboInput'
import { placesFor } from '@/lib/regions'
import ForeignFields from './ForeignFields'
import { triggerPush } from '@/lib/pushClient'
import { FormCtx, Field, Select as Sel } from './formFields'
import PortalAccountsEditor from './PortalAccountsEditor'
import type { PortalAccount } from '@/lib/portals'
import Link from 'next/link'
import StatutoryFields, { STATUTORY_KEYS, statutoryFrom } from './StatutoryFields'
import { COUNTRY_CITY_STAGES, COUNTRIES, CATEGORIES, PAYMENT_STATUSES, PHASE_OPTIONS, FOREIGN_FILING_OPTIONS, CANADA_OPTIONS, CR_STATUSES, toOptions, pickColumns, validateDates } from '@/lib/stageRules'
import { assessExpiry, assessTiming } from '@/lib/utils'

const STAGE_TABLES: Record<string, string> = {
  '1': 'stage1_mother_company', '2': 'stage2_activity_list', '3': 'stage3_foreign_company',
  '4': 'stage4_misa_license', '5': 'stage5_commercial_registration', '6': 'stage6_other_websites',
  '7': 'stage7_file_ready', '8': 'stage8_name_clearance', '9': 'stage9_bd_company', '10': 'stage10_foreign_mother', '11': 'stage11_foreign_subsidiary_2',
}

interface Props {
  stageId: string; entry: any; companies: any[]; employees: any[]; onClose: () => void
  isUSACanada?: boolean; isNameClearance?: boolean; isAdmin?: boolean
}

import { useSecureDelete } from '@/components/ui/useSecureDelete'
export default function EditEntryModal({ stageId, entry, companies, employees, onClose, isUSACanada, isNameClearance, isAdmin = false }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { askDelete, dialog } = useSecureDelete()
  const [loading, setLoading] = useState(false)
  const [portals, setPortals] = useState<PortalAccount[]>(() => (Array.isArray((entry as any).portal_accounts) ? (entry as any).portal_accounts : []))
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<Record<string, string>>(() => (stageId === '7' ? { ...entry, ...statutoryFrom(companies.find(c => c.company_id === entry.company_id)) }
    : stageId === '1' ? (() => { const c0 = companies.find(c => c.company_id === entry.company_id); return { ...entry, country: entry.country || c0?.country_of_origin || '', city: entry.city || c0?.province || '' } })()
    : entry))
  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const comp = companies.find(c => c.company_id === form.company_id)
  const clientInfo = {
    name: comp?.client_name || comp?.ceo_gm_name || form.client_name,
    phone: comp?.client_phone || comp?.whatsapp_number || form.client_phone,
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dateError = validateDates(form)
    if (dateError) { alert(dateError); return }
    setLoading(true)
    let payload: Record<string, any> = { ...form, ...(stageId === '6' ? { portal_accounts: portals.filter(p => p.portal) } : {}), client_name: clientInfo.name || form.client_name, client_phone: clientInfo.phone || form.client_phone, category: comp?.entity_type || form.category, ...(COUNTRY_CITY_STAGES.includes(stageId) && stageId !== '1' ? { country: comp?.stage1_country || form.country, city: comp?.stage1_city || form.city } : {}) }
    if (!isUSACanada && !isNameClearance && stageId !== '6') {
      const t = assessTiming(form.submit_date, form.target_date, form.complete_date)
      payload = { ...payload, days_taken: t.days, status: t.status, completion_percent: t.completion, overdue_status: t.overdue }
    }
    if (stageId === '5') {
      const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      payload.cr_status_date = form.cr_status === 'Complete' ? (entry.cr_status === 'Complete' && entry.cr_status_date ? entry.cr_status_date : today) : null
    }
    if (isNameClearance) {
      const nc = assessExpiry(form.expire_date)
      if (nc) payload = { ...payload, ...nc }
    }

    if (isUSACanada) {
      if (form.usa_submit_date || form.usa_target_date) { const t = assessTiming(form.usa_submit_date, form.usa_target_date, form.usa_complete_date); payload.usa_status = t.status; payload.usa_days_taken = t.days; payload.usa_completion_percent = t.completion; payload.usa_overdue_status = t.overdue }
      if (form.canada_submit_date || form.canada_target_date) { const t = assessTiming(form.canada_submit_date, form.canada_target_date, form.canada_complete_date); payload.canada_status = t.status; payload.canada_days_taken = t.days; payload.canada_completion_percent = t.completion; payload.canada_overdue_status = t.overdue }
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from(STAGE_TABLES[stageId]).update(pickColumns(stageId, payload)).eq('id', entry.id)
      if (error) { alert('Could not save: ' + error.message); setLoading(false); return }
      if (stageId === '7' && form.company_id) {
        const st: Record<string, string> = {}
        for (const k of STATUTORY_KEYS) st[k] = form[k] || ''
        const { error: stErr } = await supabase.rpc('update_company_statutory', { p_company_id: form.company_id, p: st })
        if (stErr) alert('The record was saved, but the legal identifiers could not be saved to the company: ' + stErr.message)
      }
    }

    triggerPush()
    router.refresh()
    onClose()
    setLoading(false)
  }

  async function handleDelete() {
    if (!(await askDelete(STAGE_TABLES[stageId], entry.id, 'this record'))) return
    setDeleting(true)
    router.refresh()
    onClose()
  }

  return (
    <FormCtx.Provider value={{ form, set }}>
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {dialog}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900">Modify Workflow Record</h2>
            <p className="text-xs text-slate-400">Entity: {entry.company_id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {stageId === '9' && <BdFields form={form} set={set} />}
          {(stageId === '3' || stageId === '10' || stageId === '11') && <ForeignFields form={form} set={set} title={stageId === '10' ? 'Foreign Mother Company' : stageId === '3' ? '1 Foreign Subsidiary Company' : '2 Foreign Subsidiary Company'} withAccount={stageId === '3' || stageId === '11'} />}
          <Sel
            label={stageId === '9' ? 'Linked Client Company (optional)' : 'Corporate Entity'}
            name="company_id"
            options={companies.map(c => ({ value: c.company_id, label: `${c.company_id} — ${c.company_name}` }))}
          />

          {!isNameClearance && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Authorized Client Contact</label>
                  <div className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 min-h-[34px]">{clientInfo.name || '—'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Contact Phone</label>
                  <div className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 min-h-[34px] font-mono">{clientInfo.phone || '—'}</div>
                </div>
                <p className="sm:col-span-2 text-[10px] text-slate-400 -mt-1">Taken from the company profile. Edit it once in Company Register.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Licensing Category</label>
                  <div className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 min-h-[34px]">{(comp?.entity_type || form.category) || '—'}</div>
                </div>
              </div>
              {COUNTRY_CITY_STAGES.includes(stageId) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stageId === '1' ? (<>
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-1 block">Country</label>
                      <CountrySelect value={form.country || ''} onChange={v => setForm(p => ({ ...p, country: v, city: '' }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-1 block">City</label>
                      <ComboInput value={form.city || ''} onChange={v => set('city', v)} options={(() => { const pl = placesFor(form.country); return pl ? [...new Set([...pl.cities, ...pl.regions])] : [] })()} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Pick or type a city" />
                    </div>
                  </>) : (<>
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-1 block">Country</label>
                      <div className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 min-h-[34px]">{(comp?.stage1_country || form.country) || '—'}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-1 block">City</label>
                      <div className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 min-h-[34px]">{(comp?.stage1_city || form.city) || '—'}</div>
                    </div>
                  </>)}
                </div>
              )}
              {stageId === '1' && <ParentChecks form={form} set={set} />}
              {stageId !== '6' && <Sel label="Workflow Phase Status" name="current_stage" options={toOptions(PHASE_OPTIONS[stageId] || [])} />}
              {stageId === '6' && (
                <>
                  <PortalAccountsEditor value={portals} onChange={setPortals} />
                  <Link href={`/dashboard/portal-accounts/${entry.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">Open the client PDF (save this record first)</Link>
                </>
              )}
            </>
          )}

          {isUSACanada ? (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">USA</span>
                  <h3 className="text-xs font-semibold text-slate-800">United States Corporate Filing</h3>
                </div>
                <Sel label="Filing Instrument / Type" name="usa_type" options={toOptions(FOREIGN_FILING_OPTIONS)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="USA Submission Date" name="usa_submit_date" type="date" />
                  <Field label="USA Completion Date" name="usa_complete_date" type="date" />
                </div>
                <Field label="USA Target Date" name="usa_target_date" type="date" />
                <Sel
                  label="USA Payment Status"
                  name="usa_payment_status"
                  options={toOptions(PAYMENT_STATUSES)}
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">CAN</span>
                  <h3 className="text-xs font-semibold text-slate-800">Canadian Corporate Filing</h3>
                </div>
                <Sel label="Filing Instrument / Type" name="canada_type" options={toOptions(CANADA_OPTIONS)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Canada Submission Date" name="canada_submit_date" type="date" />
                  <Field label="Canada Completion Date" name="canada_complete_date" type="date" />
                </div>
                <Field label="Canada Target Date" name="canada_target_date" type="date" />
                <Sel
                  label="Canada Payment Status"
                  name="canada_payment_status"
                  options={toOptions(PAYMENT_STATUSES)}
                />
              </div>
            </>
          ) : isNameClearance ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Entity Structure" name="entity_type" />
                <Field label="Clearance Number" name="name_clearance_number" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Official English Name" name="company_name_english" required />
                <Field label="Official Arabic Name" name="arabic_name" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Submission Date" name="submit_date" type="date" disabled={!isAdmin} hint={!isAdmin ? "Fixed — only an admin can change it" : undefined} />
                <Field label="Approval Date" name="approval_date" type="date" />
                <Field label="Expire Date" name="expire_date" type="date" required hint="Remaining days and status are calculated from this date" />
                
              </div>
              <Field label="Regulatory Notes" name="notes" />
            </>
          ) : (
            <>
              {stageId !== '6' && (
                <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Submission Date" name="submit_date" type="date" disabled={!isAdmin} hint={!isAdmin ? "Fixed — only an admin can change it" : undefined} />
                <Field label="Target SLA Date" name="target_date" type="date" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Completion Date" name="complete_date" type="date" required={['1', '9', '10'].includes(stageId)} />
                <Sel
                  label="Payment Status"
                  name="payment_status"
                  options={toOptions(PAYMENT_STATUSES)}
                />
              </div>
                </>
              )}
              {stageId === '5' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Sel label="CR Association Status" name="cr_status" options={toOptions(['Pending', 'Complete'])} />
                  <p className="text-[11px] text-slate-500 self-end pb-2">Complete stops the Company Name Clearance countdown of this company.</p>
                </div>
              )}
              <Field label="Electronic Dossier Link (Google Drive)" name="drive_link" required={['1', '9', '10'].includes(stageId)} />
              <Field label="Operational Remarks" name="remarks" />
            </>
          )}

          {stageId === '7' && <StatutoryFields />}

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 border border-rose-200 text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-50 transition flex items-center gap-1.5"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
            </button>
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
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FormCtx.Provider>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, Globe, Building2, User, FileText, CheckCircle2, Sparkles } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BdFields from './BdFields'
import DossierFiles from './DossierFiles'
import { portalsComplete } from '@/lib/portals'
import MisaAccounts from './MisaAccounts'
import ParentChecks, { missingParentFile } from './ParentChecks'
import CountrySelect from '@/components/ui/CountrySelect'
import ComboInput from '@/components/ui/ComboInput'
import { placesFor } from '@/lib/regions'
import ForeignFields from './ForeignFields'
import { triggerPush } from '@/lib/pushClient'
import PortalAccountsEditor from './PortalAccountsEditor'
import type { PortalAccount } from '@/lib/portals'
import StatutoryFields, { AuditFields, BdAuditFields, statutoryPayload, statutoryFrom } from './StatutoryFields'
import { FormCtx, Field, Select } from './formFields'
import { COUNTRY_CITY_STAGES, COUNTRIES, CATEGORIES, PAYMENT_STATUSES, PHASE_OPTIONS, FOREIGN_FILING_OPTIONS, CANADA_OPTIONS, CR_STATUSES, toOptions, pickColumns, validateDates } from '@/lib/stageRules'
import { assessExpiry, assessTiming, addDaysISO } from '@/lib/utils'

const STAGE_TABLES: Record<string, string> = {
  '1': 'stage1_mother_company', '2': 'stage2_activity_list', '3': 'stage3_foreign_company',
  '4': 'stage4_misa_license', '5': 'stage5_commercial_registration', '6': 'stage6_other_websites',
  '7': 'stage7_file_ready', '8': 'stage8_name_clearance', '9': 'stage9_bd_company', '10': 'stage10_foreign_mother', '11': 'stage11_foreign_subsidiary_2',
}

const MODULE_TITLES: Record<string, string> = {
  '1': 'Parent Entity Verification',
  '2': 'Commercial Activity Classification',
  '3': 'Cross-Border Foreign Licensing',
  '4': 'MISA Investment Licensing',
  '5': 'Commercial Registration (CR)',
  '6': 'Government Portals Compliance',
  '7': 'Final Legal Dossier & Issuance',
  '8': 'Company Name Clearance',
  '9': 'Bangladesh Company Name',
  '10': 'Foreign Mother Company',
  '11': '2 Foreign Subsidiary Company',
}

interface Props {
  eligibilityHint?: string
  stageId: string; companies: any[]; employees: any[]; onClose: () => void
  initialCompanyId?: string
  isAdmin?: boolean
  isUSACanada?: boolean; isNameClearance?: boolean
}

export default function AddEntryModal({ stageId, companies, employees, onClose, isUSACanada, isNameClearance, eligibilityHint, initialCompanyId, isAdmin = false }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [portals, setPortals] = useState<PortalAccount[]>([])
  const [form, setForm] = useState<Record<string, string>>({
    submit_date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10), // today (local)
    current_stage: ['6', '7'].includes(stageId) ? '' : (PHASE_OPTIONS[stageId] || [])[0] || '',
    ...(stageId === '9' ? { country: 'Bangladesh', approval_status: 'Pending' } : {}),
    employee_id: employees.find(e => String(e.assigned_stage) === stageId)?.id || '',
  })

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  // Company Name Clearance: the expiry date is always 60 days after the Approval Date
  useEffect(() => {
    if (!isNameClearance) return
    const next = addDaysISO(form.approval_date, 60)
    setForm(prev => ((prev.expire_date || '') === next ? prev : { ...prev, expire_date: next }))
  }, [form.approval_date, isNameClearance]) // eslint-disable-line react-hooks/exhaustive-deps
  const clientInfo = { name: form.client_name, phone: form.client_phone }

  // Opened from the "Waiting for you" list: pre-select that company
  useEffect(() => { if (initialCompanyId) handleCompanySelect(initialCompanyId) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCompanySelect(selectedCompanyId: string) {
    const comp = companies.find(c => c.company_id === selectedCompanyId)
    setForm(prev => ({
      ...prev,
      company_id: selectedCompanyId,
      ...(stageId === '1' && comp?.ready_date ? { submit_date: comp.ready_date } : {}),
      client_name: comp?.client_name || comp?.ceo_gm_name || '',
      client_phone: comp?.client_phone || comp?.whatsapp_number || '',
      category: comp?.entity_type || comp?.stage1_category || 'Trading License',
      ...(COUNTRY_CITY_STAGES.includes(stageId) ? (stageId === '1'
        ? { country: prev.country || '', city: prev.city || '' }
        : { country: comp?.stage1_country || prev.country || '', city: comp?.stage1_city || prev.city || '' }) : {}),
      company_name_english: prev.company_name_english || comp?.company_name || '',
      ...(stageId === '7' ? statutoryFrom(comp) : {}),
      entity_type: prev.entity_type || comp?.entity_type || 'Trading License',
    }))
  }

  // at least one file once a Completion Date is entered (Parent Entity Verification asks per item, see ParentChecks)
  const needFiles = (['9', '10', '2', '3', '11'].includes(stageId) && !!form.complete_date)
  const fileCount = Array.isArray((form as any).dossier_files) ? (form as any).dossier_files.length : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dateError = validateDates(form)
    if (dateError) { alert(dateError); return }
    const noFile = stageId === '1' ? missingParentFile((form as any).dossier_files) : ''
    if (noFile) { alert(`Upload the ${noFile} file.`); return }
    if (needFiles && !['4', '5', '7'].includes(stageId) && fileCount === 0) { alert('Upload at least one file in the Electronic Dossier.'); return }
    setLoading(true)

    let payload: Record<string, any> = { ...form }
    if (stageId === '6') {
      payload.portal_accounts = portals.filter(p => p.portal)
      // all portals filled in = completed (no Completion Date to type)
      payload.complete_date = portalsComplete(portals) ? new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) : null
    }

    if (!isUSACanada && !isNameClearance && stageId !== '6') {
      const t = assessTiming(form.submit_date, form.target_date, form.complete_date)
      payload = { ...payload, days_taken: t.days, status: t.status, completion_percent: t.completion, overdue_status: t.overdue }
    }

    if (stageId === '5') {
      payload.cr_status_date = form.cr_status === 'Complete' ? new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) : null
    }
    if (isNameClearance) {
      const nc = assessExpiry(form.expire_date)
      payload = nc ? { ...payload, ...nc } : { ...payload, remaining_days: null }
    }

    if (isUSACanada) {
      if (form.usa_submit_date || form.usa_target_date) { const t = assessTiming(form.usa_submit_date, form.usa_target_date, form.usa_complete_date); payload.usa_status = t.status; payload.usa_days_taken = t.days; payload.usa_completion_percent = t.completion; payload.usa_overdue_status = t.overdue }
      if (form.canada_submit_date || form.canada_target_date) { const t = assessTiming(form.canada_submit_date, form.canada_target_date, form.canada_complete_date); payload.canada_status = t.status; payload.canada_days_taken = t.days; payload.canada_completion_percent = t.completion; payload.canada_overdue_status = t.overdue }
    }

    if (!isSupabaseConfigured) { alert('Database is not connected.'); setLoading(false); return }
    const { error } = await supabase.from(STAGE_TABLES[stageId]).insert([pickColumns(stageId, payload)])
    if (error) { alert('Could not save: ' + error.message); setLoading(false); return }
    if (stageId === '7' && form.company_id) {
      const st = statutoryPayload(form)
      const { error: stErr } = await supabase.rpc('update_company_statutory', { p_company_id: form.company_id, p: st })
      if (stErr) alert('The record was saved, but the legal identifiers could not be saved to the company: ' + stErr.message)
    }

    triggerPush()
    router.refresh()
    onClose()
    setLoading(false)
  }

  return (
    <FormCtx.Provider value={{ form, set }}>
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900">Add Workflow Record</h2>
            <p className="text-xs text-slate-400">{MODULE_TITLES[stageId] || 'Licensing Pipeline'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {stageId === '4' && <MisaAccounts required={!!form.complete_date} form={form} set={set} />}
          {stageId === '9' && <BdFields form={form} set={set} />}
          {(stageId === '3' || stageId === '10' || stageId === '11') && <ForeignFields requireAll={['3', '10', '11'].includes(stageId) && !!form.complete_date} requireAccount={['3', '11'].includes(stageId) ? !!form.complete_date : true} form={form} set={set} title={stageId === '10' ? 'Foreign Mother Company' : stageId === '3' ? '1 Foreign Subsidiary Company' : '2 Foreign Subsidiary Company'} withAccount={stageId === '3' || stageId === '11'} />}
          <Select
            label={stageId === '9' ? 'Linked Client Company (optional)' : 'Corporate Entity (Auto-fills client profile)'}
            name="company_id"
            required={stageId !== '9'}
            onChange={handleCompanySelect}
            options={companies.map(c => ({ value: c.company_id, label: `${c.company_id} — ${c.company_name}` }))}
          />
          {eligibilityHint && (
            <p className="text-[11px] text-slate-500 -mt-2">
              {companies.length === 0 ? 'No eligible company yet. ' : ''}{eligibilityHint}
            </p>
          )}

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
                  <div className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 min-h-[34px]">{form.category || '—'}</div>
                </div>
              </div>
              {COUNTRY_CITY_STAGES.includes(stageId) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stageId === '1' ? (<>
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-1 block">Country<span className="text-rose-500 ml-0.5">*</span></label>
                      <CountrySelect required value={form.country || ''} onChange={v => setForm(p => ({ ...p, country: v, city: '' }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-1 block">City<span className="text-rose-500 ml-0.5">*</span></label>
                      <ComboInput value={form.city || ''} onChange={v => set('city', v)} options={(() => { const pl = placesFor(form.country); return pl ? [...new Set([...pl.cities, ...pl.regions])] : [] })()} disabled={!form.country} required className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder={!form.country ? 'Select a country first' : placesFor(form.country) ? 'Pick a city from the list' : 'Type the city'} />
                    </div>
                  </>) : (<>
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-1 block">Country</label>
                      <div className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 min-h-[34px]">{form.country || '—'}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-1 block">City</label>
                      <div className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 min-h-[34px]">{form.city || '—'}</div>
                    </div>
                  </>)}
                </div>
              )}
              {stageId === '1' && <ParentChecks form={form} set={set} folder={`${form.company_id || 'unassigned'}_dossier`} onFiles={update => setForm(prev => ({ ...prev, dossier_files: update((prev as any).dossier_files || []) as any }))} />}
              {!['6', '7'].includes(stageId) && <Select label="Workflow Phase Status" name="current_stage" options={toOptions(PHASE_OPTIONS[stageId] || [])} />}
              {stageId === '6' && <Field label="Submission Date" name="submit_date" type="date" disabled hint="Set automatically to today" />}
              {stageId === '6' && <PortalAccountsEditor value={portals} onChange={setPortals} />}
            </>
          )}

          {isUSACanada ? (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">USA</span>
                  <h3 className="text-xs font-semibold text-slate-800">United States Corporate Filing</h3>
                </div>
                <Select label="Filing Instrument / Type" name="usa_type" options={toOptions(FOREIGN_FILING_OPTIONS)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="USA Submission Date" name="usa_submit_date" type="date" />
                  <Field label="USA Completion Date" name="usa_complete_date" type="date" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="USA Payment Status"
                    name="usa_payment_status"
                    options={toOptions(PAYMENT_STATUSES)}
                  />
                  <Field label="USA Target Date" name="usa_target_date" type="date" />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">CAN</span>
                  <h3 className="text-xs font-semibold text-slate-800">Canadian Corporate Filing</h3>
                </div>
                <Select label="Filing Instrument / Type" name="canada_type" options={toOptions(CANADA_OPTIONS)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Canada Submission Date" name="canada_submit_date" type="date" />
                  <Field label="Canada Completion Date" name="canada_complete_date" type="date" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Canada Payment Status"
                    name="canada_payment_status"
                    options={toOptions(PAYMENT_STATUSES)}
                  />
                  <Field label="Canada Target Date" name="canada_target_date" type="date" />
                </div>
              </div>
            </>
          ) : isNameClearance ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Entity Structure" name="entity_type" />
                <Field label="Clearance Number" name="name_clearance_number" required={!!form.approval_date} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Official English Name" name="company_name_english" required={!!form.approval_date} />
                <Field label="Official Arabic Name" name="arabic_name" required={!!form.approval_date} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Submission Date" name="submit_date" type="date" disabled={!isAdmin} hint={!isAdmin ? "Set automatically to today" : undefined} />
                <Field label="Approval Date" name="approval_date" type="date" />
                <Field label="Expire Date" name="expire_date" type="date" disabled hint="Automatic: 60 days after the Approval Date" />
                
              </div>
              <Field label="Regulatory Notes" name="notes" />
            </>
          ) : (
            <>
              {stageId !== '6' && (
                <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stageId !== '7' && <Field label="Submission Date" name="submit_date" type="date" disabled={stageId === '1' || !isAdmin} hint={stageId === '1' ? 'Set automatically: the day this company reached this phase' : !isAdmin ? 'Set automatically to today' : undefined} />}
                {!['1', '2', '3', '4', '5', '7', '9', '10', '11'].includes(stageId) && <Field label="Target SLA Date" name="target_date" type="date" />}
                {['1', '2', '3', '9', '10', '11'].includes(stageId) && <Field label="Completion Date" name="complete_date" type="date" required={stageId === '1'} hint={stageId === '2' ? 'Fill it when the work is finished: then the Drive Link is needed' : stageId === '9' ? 'Fill it when the work is finished: then RJSC no., Issue No, Incorporation Date and Drive Link are needed' : ['3', '10', '11'].includes(stageId) ? 'Fill it when the work is finished: then everything except Operational Remarks is needed' : undefined} />}
              </div>
              {!['1', '2', '3', '9', '10', '11'].includes(stageId) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Completion Date" name="complete_date" type="date" required={['1', '9', '10'].includes(stageId)} hint={['4', '5'].includes(stageId) ? 'Fill it when the work is finished: then everything except Operational Remarks is needed' : undefined} />
                {stageId !== '7' && (
                <Select
                  label="Payment Status"
                  name="payment_status"
                  required={['4', '5'].includes(stageId) && !!form.complete_date}
                  options={toOptions(PAYMENT_STATUSES)}
                />
                )}
              </div>
              )}
              {['3', '10', '11'].includes(stageId) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Payment Status"
                  name="payment_status"
                  required={['3', '10', '11'].includes(stageId) && !!form.complete_date}
                  options={toOptions(PAYMENT_STATUSES)}
                />
                <Field label="Payment Bank" name="payment_bank" required={['3', '10', '11'].includes(stageId) && !!form.complete_date} hint="Which bank the payment was made through" />
              </div>
              )}
                </>
              )}
              {stageId === '5' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select label="CR Association Status" name="cr_status" required={!!form.complete_date} options={toOptions(['Pending', 'Complete'])} />
                  <p className="text-[11px] text-slate-500 self-end pb-2">Complete stops the Company Name Clearance countdown of this company.</p>
                </div>
              )}
              {!['1', '4', '5', '7'].includes(stageId) && <DossierFiles required={needFiles} folder={`${form.company_id || 'unassigned'}_dossier`} value={(form as any).dossier_files} onChange={v => setForm(prev => ({ ...prev, dossier_files: v as any }))} />}
              <Field label="Operational Remarks" name="remarks" />
            </>
          )}

          {stageId === '7' && <StatutoryFields />}
          {stageId === '7' && <AuditFields />}
          {stageId === '7' && <BdAuditFields />}

          <div className="flex gap-3 pt-3 border-t border-slate-100">
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
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FormCtx.Provider>
  )
}

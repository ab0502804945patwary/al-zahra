'use client'
import { useState } from 'react'
import { X, Loader2, Trash2 } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BdFields from './BdFields'
import { COUNTRIES, CATEGORIES, PAYMENT_STATUSES, PRIORITIES, PHASE_OPTIONS, FOREIGN_FILING_OPTIONS, CANADA_OPTIONS, CR_STATUSES, toOptions, pickColumns, validateDates } from '@/lib/stageRules'
import { calculateNameClearance, calculateOverdue, calculateDaysTaken, calculateStatus, calculateCompletion } from '@/lib/utils'

const STAGE_TABLES: Record<string, string> = {
  '1': 'stage1_mother_company', '2': 'stage2_activity_list', '3': 'stage3_foreign_company',
  '4': 'stage4_misa_license', '5': 'stage5_commercial_registration', '6': 'stage6_other_websites',
  '7': 'stage7_file_ready', '8': 'stage8_name_clearance', '9': 'stage9_bd_company',
}

interface Props {
  stageId: string; entry: any; companies: any[]; employees: any[]; onClose: () => void
  isUSACanada?: boolean; isNameClearance?: boolean
}

import { useSecureDelete } from '@/components/ui/useSecureDelete'
export default function EditEntryModal({ stageId, entry, companies, employees, onClose, isUSACanada, isNameClearance }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { askDelete, dialog } = useSecureDelete()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<Record<string, string>>(entry)
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
    let payload: Record<string, any> = { ...form, client_name: clientInfo.name || form.client_name, client_phone: clientInfo.phone || form.client_phone, category: comp?.entity_type || form.category, ...(stageId !== '1' ? { priority: comp?.stage1_priority || form.priority } : {}) }
    if (!isUSACanada && !isNameClearance) {
      const days = calculateDaysTaken(form.submit_date, form.complete_date)
      const status = calculateStatus(days)
      const completion = calculateCompletion(status)
      const overdue = calculateOverdue(form.complete_date, form.target_date)
      payload = { ...payload, days_taken: days, status, completion_percent: completion, overdue_status: overdue }
    }
    if (isNameClearance) {
      const nc = calculateNameClearance(form.approval_date)
      if (nc) payload = { ...payload, ...nc }
    }

    if (isUSACanada) {
      const usaDays = calculateDaysTaken(form.usa_submit_date, form.usa_complete_date)
      if (form.usa_submit_date) { payload.usa_status = calculateStatus(usaDays); payload.usa_days_taken = usaDays; payload.usa_completion_percent = calculateCompletion(payload.usa_status); payload.usa_overdue_status = calculateOverdue(form.usa_complete_date, form.usa_target_date) }
      const canDays = calculateDaysTaken(form.canada_submit_date, form.canada_complete_date)
      if (form.canada_submit_date) { payload.canada_status = calculateStatus(canDays); payload.canada_days_taken = canDays; payload.canada_completion_percent = calculateCompletion(payload.canada_status); payload.canada_overdue_status = calculateOverdue(form.canada_complete_date, form.canada_target_date) }
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from(STAGE_TABLES[stageId]).update(pickColumns(stageId, payload)).eq('id', entry.id)
      if (error) { alert('Could not save: ' + error.message); setLoading(false); return }
    }

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

  const Field = ({ label, name, type = 'text' }: { label: string; name: string; type?: string }) => (
    <div>
      <label className="text-xs font-medium text-slate-700 mb-1 block">{label}</label>
      <input
        type={type}
        value={form[name] || ''}
        onChange={e => set(name, e.target.value)}
        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
    </div>
  )

  const Sel = ({ label, name, options }: { label: string; name: string; options: { value: string; label: string }[] }) => (
    <div>
      <label className="text-xs font-medium text-slate-700 mb-1 block">{label}</label>
      <select
        value={form[name] || ''}
        onChange={e => set(name, e.target.value)}
        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
      >
        <option value="">Select option...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
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
                <p className="sm:col-span-2 text-[10px] text-slate-400 -mt-1">Taken from the company profile. Edit it once in Company Directory.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Licensing Category</label>
                  <div className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 min-h-[34px]">{(comp?.entity_type || form.category) || '—'}</div>
                </div>
                {stageId === '1' ? (
                  <Sel label="Priority Tier" name="priority" options={toOptions(PRIORITIES)} />
                ) : (
                  <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Priority Tier</label>
                  <div className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 min-h-[34px]">{(comp?.stage1_priority || form.priority) || '—'}</div>
                </div>
                )}
              </div>
              <Sel label="Workflow Phase Status" name="current_stage" options={toOptions(PHASE_OPTIONS[stageId] || [])} />
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
                <Field label="Clearance Reference Number" name="name_clearance_number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Submission Date" name="submit_date" type="date" />
                <Field label="Approval Date" name="approval_date" type="date" />
                
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Sel
                  label="CR Association Status"
                  name="cr_status"
                  options={toOptions(CR_STATUSES)}
                />
              </div>
              <Field label="Regulatory Notes" name="notes" />
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Submission Date" name="submit_date" type="date" />
                <Field label="Target SLA Date" name="target_date" type="date" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Completion Date" name="complete_date" type="date" />
                <Sel
                  label="Payment Status"
                  name="payment_status"
                  options={toOptions(PAYMENT_STATUSES)}
                />
              </div>
              <Sel label="Assigned Employee" name="employee_id" options={employees.map(e => ({ value: e.id, label: e.name }))} />
              <Field label="Electronic Dossier Link (Google Drive)" name="drive_link" />
              <Field label="Operational Remarks" name="remarks" />
            </>
          )}

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
  )
}

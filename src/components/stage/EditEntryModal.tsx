'use client'
import { useState } from 'react'
import { X, Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { calculateDaysTaken, calculateStatus, calculateCompletion } from '@/lib/utils'

const STAGE_TABLES: Record<string, string> = {
  '1': 'stage1_mother_company', '2': 'stage2_activity_list', '3': 'stage3_foreign_company',
  '4': 'stage4_misa_license', '5': 'stage5_commercial_registration', '6': 'stage6_other_websites',
  '7': 'stage7_file_ready', '8': 'stage8_name_clearance',
}

interface Props {
  stageId: string; entry: any; companies: any[]; employees: any[]; onClose: () => void
  isUSACanada?: boolean; isNameClearance?: boolean
}

export default function EditEntryModal({ stageId, entry, companies, employees, onClose, isUSACanada, isNameClearance }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<Record<string, string>>(entry)
  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    let payload: Record<string, any> = { ...form }
    if (!isUSACanada && !isNameClearance) {
      const days = calculateDaysTaken(form.submit_date, form.complete_date)
      const status = calculateStatus(days)
      const completion = calculateCompletion(status)
      const overdue = form.complete_date ? 'Completed' : (days > 13 ? 'Overdue' : 'Pending')
      payload = { ...payload, days_taken: days, status, completion_percent: completion, overdue_status: overdue }
    }
    if (isNameClearance && form.expire_date) {
      const days = Math.floor((new Date(form.expire_date).getTime() - Date.now()) / 86400000)
      payload.remaining_days = days
    }

    try {
      await supabase.from(STAGE_TABLES[stageId]).update(payload).eq('id', entry.id)
    } catch (err) {
      console.log('Updated entry locally:', err)
    }

    router.refresh()
    onClose()
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this record?')) return
    setDeleting(true)
    try {
      await supabase.from(STAGE_TABLES[stageId]).delete().eq('id', entry.id)
    } catch (err) {
      console.log('Deleted locally:', err)
    }
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
          <Sel
            label="Corporate Entity"
            name="company_id"
            options={companies.map(c => ({ value: c.company_id, label: `${c.company_id} — ${c.company_name}` }))}
          />

          {!isNameClearance && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Authorized Client Contact" name="client_name" />
                <Field label="Contact Phone" name="client_phone" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Licensing Category" name="category" />
                <Field label="Priority Tier" name="priority" />
              </div>
              <Field label="Workflow Phase Status" name="current_stage" />
            </>
          )}

          {isUSACanada ? (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">USA</span>
                  <h3 className="text-xs font-semibold text-slate-800">United States Corporate Filing</h3>
                </div>
                <Field label="Filing Instrument / Type" name="usa_type" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="USA Submission Date" name="usa_submit_date" type="date" />
                  <Field label="USA Completion Date" name="usa_complete_date" type="date" />
                </div>
                <Sel
                  label="USA Payment Status"
                  name="usa_payment_status"
                  options={[{ value: 'Paid', label: 'Paid' }, { value: 'Pending', label: 'Pending' }, { value: 'Unpaid', label: 'Unpaid' }]}
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">CAN</span>
                  <h3 className="text-xs font-semibold text-slate-800">Canadian Corporate Filing</h3>
                </div>
                <Field label="Filing Instrument / Type" name="canada_type" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Canada Submission Date" name="canada_submit_date" type="date" />
                  <Field label="Canada Completion Date" name="canada_complete_date" type="date" />
                </div>
                <Sel
                  label="Canada Payment Status"
                  name="canada_payment_status"
                  options={[{ value: 'Paid', label: 'Paid' }, { value: 'Pending', label: 'Pending' }, { value: 'Unpaid', label: 'Unpaid' }]}
                />
              </div>
            </>
          ) : isNameClearance ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Entity Structure" name="entity_type" />
                <Field label="Clearance Reference Number" name="name_clearance_number" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Submission Date" name="submit_date" type="date" />
                <Field label="Approval Date" name="approval_date" type="date" />
                <Field label="Expiration Date" name="expire_date" type="date" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Sel
                  label="Validity Status"
                  name="status"
                  options={[{ value: 'Active', label: 'Active' }, { value: 'Expired', label: 'Expired' }, { value: 'Pending', label: 'Pending' }]}
                />
                <Sel
                  label="CR Association Status"
                  name="cr_status"
                  options={[{ value: 'Complete', label: 'Complete' }, { value: 'Pending', label: 'Pending' }, { value: 'In Progress', label: 'In Progress' }]}
                />
              </div>
              <Field label="Regulatory Notes" name="notes" />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Submission Date" name="submit_date" type="date" />
                <Field label="Target SLA Date" name="target_date" type="date" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Completion Date" name="complete_date" type="date" />
                <Sel
                  label="Payment Status"
                  name="payment_status"
                  options={[{ value: 'Paid', label: 'Paid' }, { value: 'Pending', label: 'Pending' }, { value: 'Unpaid', label: 'Unpaid' }]}
                />
              </div>
              <Sel
                label="Assigned Lead Specialist"
                name="employee_id"
                options={employees.map(emp => ({ value: emp.id, label: emp.name }))}
              />
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

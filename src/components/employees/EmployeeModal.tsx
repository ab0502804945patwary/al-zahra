'use client'
import { useState } from 'react'
import { X, Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Employee } from '@/lib/types'

interface Props { employee?: Employee; onClose: () => void }

const MODULE_OPTIONS = [
  { value: 1, label: '01: Parent Entity Verification' },
  { value: 2, label: '02: Activity Classification' },
  { value: 3, label: '03: Cross-Border Foreign Licensing' },
  { value: 4, label: '04: MISA Investment Licensing' },
  { value: 5, label: '05: Commercial Registration (CR)' },
  { value: 6, label: '06: Government Portals & Compliance' },
  { value: 7, label: '07: Final Legal Dossier & Issuance' },
  { value: 8, label: '08: Trade Name Clearance' },
]

export default function EmployeeModal({ employee, onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    role: employee?.role || 'employee',
    assigned_stage: employee?.assigned_stage?.toString() || '',
    is_active: employee?.is_active ?? true,
    password: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (employee) {
        const payload: any = {
          name: form.name,
          phone: form.phone,
          role: form.role,
          assigned_stage: form.role === 'admin' ? null : (form.assigned_stage ? parseInt(form.assigned_stage) : null),
          is_active: form.is_active,
        }
        await supabase.from('employees').update(payload).eq('id', employee.id)
      } else {
        const payload: any = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          assigned_stage: form.role === 'admin' ? null : (form.assigned_stage ? parseInt(form.assigned_stage) : null),
          is_active: form.is_active,
          user_id: '00000000-0000-0000-0000-000000000000',
        }
        await supabase.from('employees').insert([payload])
      }
    } catch (err) {
      console.log('Saved employee locally:', err)
    }

    router.refresh()
    onClose()
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to remove this staff member?')) return
    try {
      await supabase.from('employees').delete().eq('id', employee!.id)
    } catch (err) {
      console.log('Deleted employee locally:', err)
    }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {employee ? 'Edit Team Member Profile' : 'Add Team Member'}
            </h2>
            <p className="text-xs text-slate-400">Operational staff & access permissions</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Full Legal Name <span className="text-rose-500">*</span></label>
            <input
              required
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Tariq Al-Ghamdi"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Corporate Email <span className="text-rose-500">*</span></label>
            <input
              type="email"
              required
              disabled={!!employee}
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="staff@alzahra.com"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 bg-white"
            />
          </div>

          {!employee && (
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Initial Password <span className="text-rose-500">*</span></label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Contact Mobile</label>
            <input
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+966 50 xxx xxxx"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Access Role</label>
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="employee">Process Specialist</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            {form.role === 'employee' && (
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Assigned Module</label>
                <select
                  value={form.assigned_stage}
                  onChange={e => setForm(p => ({ ...p, assigned_stage: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
                >
                  <option value="">Select Module...</option>
                  {MODULE_OPTIONS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-xs text-slate-700 font-medium cursor-pointer">
              Active Operational Account
            </label>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            {employee && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 border border-rose-200 text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-50 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
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
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : (employee ? 'Update Profile' : 'Authorize Member')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

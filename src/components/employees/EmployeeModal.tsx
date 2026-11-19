'use client'
import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import {
  X,
  Loader2,
  Trash2,
  Camera,
  UploadCloud,
  Link as LinkIcon,
  Check,
  Image as ImageIcon
} from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Employee, SalaryType } from '@/lib/types'
import MultiSelect from '@/components/ui/MultiSelect'
import { MODULES } from '@/lib/access'

interface Props {
  employee?: Employee
  onClose: () => void
  onSave?: (employee: Employee) => void
  onDelete?: (id: string) => void
}

const MODULE_OPTIONS = [
  { value: 1, label: '01: Parent Entity Verification' },
  { value: 9, label: '02: Bangladesh Company Name' },
  { value: 2, label: '03: Activity Classification' },
  { value: 3, label: '04: Cross-Border Foreign Licensing' },
  { value: 8, label: '05: Trade Name Clearance' },
  { value: 4, label: '06: MISA Investment Licensing' },
  { value: 5, label: '07: Commercial Registration (CR)' },
  { value: 6, label: '08: Government Portals & Compliance' },
  { value: 7, label: '09: Final Legal Dossier & Issuance' },
]

import { useSecureDelete } from '@/components/ui/useSecureDelete'
export default function EmployeeModal({ employee, onClose, onSave, onDelete }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { askDelete, dialog } = useSecureDelete()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [imageError, setImageError] = useState('')

  const [avatarUrl, setAvatarUrl] = useState<string>(employee?.avatar_url || '')
  const [urlInput, setUrlInput] = useState<string>(employee?.avatar_url || '')

  const [form, setForm] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    role: employee?.role || 'employee',
    assigned_stages: [
      ...(employee?.assigned_stages?.length ? employee.assigned_stages : (employee?.assigned_stage ? [employee.assigned_stage] : [])).map(String),
      ...(employee?.modules || []).map(k => 'm:' + k),
    ] as string[],
    designation: employee?.designation || '',
    department: employee?.department || '',
    office_location: employee?.office_location || 'Riyadh HQ - Al Olaya',
    salary_type: (employee?.salary?.salary_type || 'monthly_fixed') as SalaryType,
    base_salary: employee?.salary?.base_salary ? String(employee.salary.base_salary) : '',
    is_active: employee?.is_active ?? true,
    password: '',
  })

  // Resize and compress image on client-side to keep it fast & lightweight (~40KB)
  function compressImage(file: File, maxWidth = 360, maxHeight = 360): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          let { width, height } = img
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(img.src)
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          resolve(dataUrl)
        }
        img.onerror = (err) => reject(err)
      }
      reader.onerror = (err) => reject(err)
    })
  }

  async function handleFileSelected(file: File) {
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (JPG, PNG, WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image file size must be less than 5MB.')
      return
    }

    setImageError('')
    setUploadingImage(true)

    try {
      const compressedDataUrl = await compressImage(file)

      try {
        const fileExt = file.name.split('.').pop() || 'jpg'
        const fileName = `emp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true })

        if (!error && data) {
          const { data: publicData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

          if (publicData?.publicUrl) {
            setAvatarUrl(publicData.publicUrl)
            setUrlInput(publicData.publicUrl)
            setUploadingImage(false)
            return
          }
        }
      } catch (storageErr) {
        console.log('Storage upload skipped or not configured, using direct image data:', storageErr)
      }

      setAvatarUrl(compressedDataUrl)
      setUrlInput(compressedDataUrl)
    } catch (err: any) {
      setImageError('Failed to process image. Please try another file.')
    } finally {
      setUploadingImage(false)
    }
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelected(file)
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelected(file)
    }
  }

  function handleApplyUrl() {
    if (!urlInput.trim()) {
      setImageError('Please enter a valid image URL')
      return
    }
    setImageError('')
    setAvatarUrl(urlInput.trim())
  }

  function handleRemovePhoto() {
    setAvatarUrl('')
    setUrlInput('')
    setImageError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const stageList = form.role === 'admin' ? [] : form.assigned_stages.filter(v => !v.startsWith('m:')).map(Number).sort((x, y) => x - y)
    const moduleList = form.role === 'admin' ? [] : form.assigned_stages.filter(v => v.startsWith('m:')).map(v => v.slice(2))
    const assignedStageNum = stageList.length ? stageList[0] : null

    const baseAmount = parseFloat(form.base_salary) || 0

    const savedData: Employee = {
      id: employee ? employee.id : `emp-${Date.now()}`,
      user_id: employee?.user_id || `u-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      role: form.role as any,
      assigned_stage: assignedStageNum || undefined,
      assigned_stages: stageList,
      modules: moduleList,
      is_active: form.is_active,
      avatar_url: avatarUrl.trim() || undefined,
      designation: form.designation.trim() || undefined,
      department: form.department.trim() || undefined,
      office_location: form.office_location || 'Riyadh HQ - Al Olaya',
      joining_date: employee?.joining_date || new Date().toISOString().split('T')[0],
      salary: {
        salary_type: form.salary_type,
        base_salary: baseAmount,
        currency: 'SAR',
        housing_allowance: employee?.salary?.housing_allowance ?? 0,
        transport_allowance: employee?.salary?.transport_allowance ?? 0,
        food_allowance: employee?.salary?.food_allowance ?? 0,
        commission_rate: employee?.salary?.commission_rate || '',
        bank_name: employee?.salary?.bank_name || '',
        account_number: employee?.salary?.account_number || '',
        iban: employee?.salary?.iban || '',
        payment_cycle: 'monthly',
        payment_status: employee?.salary?.payment_status || 'Paid',
      },
      tasks: employee?.tasks || [],
      reviews: employee?.reviews || [],
      created_at: employee?.created_at || new Date().toISOString(),
    }

    if (isSupabaseConfigured) {
      try {
        if (employee) {
          const payload: any = {
            name: form.name,
            phone: form.phone,
            role: form.role,
            assigned_stage: assignedStageNum,
            assigned_stages: stageList,
            modules: moduleList,
            is_active: form.is_active,
            avatar_url: avatarUrl || null,
            designation: form.designation.trim() || null,
            department: form.department.trim() || null,
            office_location: form.office_location || null,
            salary: savedData.salary,
          }
          const { error } = await supabase.from('employees').update(payload).eq('id', employee.id)
          if (error) { alert('Could not save: ' + error.message); setLoading(false); return }
        } else {
          const res = await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              password: form.password,
              phone: form.phone,
              role: form.role,
              assigned_stage: assignedStageNum,
              assigned_stages: stageList,
              modules: moduleList,
              is_active: form.is_active,
              avatar_url: avatarUrl || null,
              designation: form.designation.trim() || null,
              department: form.department.trim() || null,
              office_location: form.office_location || null,
              salary: savedData.salary,
            }),
          })
          if (!res.ok) {
            const { error } = await res.json().catch(() => ({ error: 'Could not create staff login.' }))
            alert(error)
            setLoading(false)
            return
          }
        }
      } catch (err: any) {
        alert('Could not save: ' + (err?.message || 'network error'))
        setLoading(false)
        return
      }
    }

    onSave?.(savedData)

    router.refresh()
    onClose()
  }

  async function handleDelete() {
    if (!(await askDelete('employees', employee!.id, 'this staff member and their login'))) return
    onDelete?.(employee!.id)
    router.refresh()
    onClose()
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {dialog}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {employee ? 'Edit Team Member Profile' : 'Add Team Member'}
            </h2>
            <p className="text-xs text-slate-400">Operational staff, role, profile photo & compensation</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Profile Photo Upload Section */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                Profile Photo (Image Upload)
              </label>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    imageTab === 'upload'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    imageTab === 'url'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="flex items-center gap-4">
              {/* Photo Preview Box */}
              <div className="relative group shrink-0">
                {avatarUrl ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md relative bg-white">
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Remove Photo"
                      className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition rounded-2xl text-xs font-medium gap-1"
                    >
                      <Trash2 className="w-4 h-4 text-rose-300" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-7 h-7 text-slate-300 stroke-[1.5]" />
                    <span className="text-[10px] text-slate-400 mt-1">No Photo</span>
                  </div>
                )}
              </div>

              {/* Upload controls / Dropzone */}
              <div className="flex-1 min-w-0">
                {imageTab === 'upload' ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-300 hover:border-blue-400 bg-white'
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="flex items-center justify-center gap-2 py-1 text-xs text-blue-600 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing image...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-700 font-semibold mb-0.5">
                          <UploadCloud className="w-4 h-4 text-blue-600" />
                          <span>{avatarUrl ? 'Choose different photo' : 'Upload photo'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Click to browse or drag & drop (JPG, PNG, WebP)
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="url"
                          placeholder="https://example.com/photo.jpg"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">Direct image URL from web/CDN</p>
                  </div>
                )}

                {avatarUrl && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Image selected
                    </span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-medium transition hover:underline"
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {imageError && (
              <p className="text-xs text-rose-600 font-medium mt-2 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
                {imageError}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Tariq Al-Ghamdi"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Corporate Email */}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">
              Corporate Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              disabled={!!employee}
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="staff@alzahra.com"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 bg-white"
            />
          </div>

          {/* Initial Password (new staff only) */}
          {!employee && (
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                Initial Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          )}

          {/* Contact Mobile */}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Contact Mobile</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+966 50 xxx xxxx"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Role & Module Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Access Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as any }))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="employee">Process Specialist</option>
              </select>
            </div>

            {form.role === 'employee' && (
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Assigned Modules (one or more)</label>
                <MultiSelect
                  options={[
                    ...MODULE_OPTIONS.map(m => ({ value: String(m.value), label: m.label, group: 'Workflow phases' })),
                    ...MODULES.map(m => ({ value: 'm:' + m.key, label: m.label, group: 'Other modules' })),
                  ]}
                  value={form.assigned_stages}
                  onChange={next => setForm(p => ({ ...p, assigned_stages: next }))}
                  placeholder="Select what this person can open..."
                />
              </div>
            )}
          </div>

          {/* Job Title & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Job Title / Designation</label>
              <input
                value={form.designation}
                onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
                placeholder="e.g. Licensing Officer"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Department</label>
              <input
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="e.g. Legal Operations"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Salary Structure Section */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-3">
            <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
              Salary & Compensation Structure
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Salary Type</label>
                <select
                  value={form.salary_type}
                  onChange={(e) => setForm((p) => ({ ...p, salary_type: e.target.value as any }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="monthly_fixed">Monthly Fixed</option>
                  <option value="commission_based">Commission Based</option>
                  <option value="hybrid">Hybrid: Base + Commission</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="per_task">Per File / Dossier</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Base Salary (SAR)</label>
                <input
                  type="number"
                  value={form.base_salary}
                  onChange={(e) => setForm((p) => ({ ...p, base_salary: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-xs text-slate-700 font-medium cursor-pointer">
              Active Operational Account
            </label>
          </div>

          {/* Action Buttons */}
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
              disabled={loading || uploadingImage}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : employee ? (
                'Update Profile'
              ) : (
                'Authorize Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

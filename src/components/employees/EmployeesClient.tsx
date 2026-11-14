'use client'
import { useState, useEffect } from 'react'
import {
  Plus,
  Edit2,
  Users,
  Shield,
  User,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Layers,
  ShieldCheck,
  Briefcase
} from 'lucide-react'
import { Employee } from '@/lib/types'
import EmployeeModal from './EmployeeModal'
import { cn } from '@/lib/utils'

interface Props { employees: Employee[] }

const MODULE_NAMES: Record<number, string> = {
  1: 'Parent Entity Verification',
  2: 'Commercial Activity Classification',
  3: 'Cross-Border Foreign Licensing',
  4: 'MISA Investment Licensing',
  5: 'Commercial Registration (CR)',
  6: 'Government Portals & Compliance',
  7: 'Final Legal Dossier & Issuance',
  8: 'Trade Name Clearance',
}

export default function EmployeesClient({ employees: initialEmployees }: Props) {
  const [employeesList, setEmployeesList] = useState<Employee[]>(initialEmployees)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Employee | null>(null)

  // Local storage synchronization to preserve additions and edits in local/demo mode
  useEffect(() => {
    try {
      const stored = localStorage.getItem('alzahra_employees_data')
      if (stored) {
        const parsed = JSON.parse(stored) as Employee[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with initial, prioritizing stored custom items
          setEmployeesList(prev => {
            const map = new Map<string, Employee>(prev.map(e => [e.id, e]))
            parsed.forEach(item => map.set(item.id, item))
            return Array.from(map.values())
          })
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e)
    }
  }, [])

  function handleSave(savedEmp: Employee) {
    setEmployeesList(prev => {
      const index = prev.findIndex(e => e.id === savedEmp.id)
      let updated: Employee[]
      if (index >= 0) {
        updated = [...prev]
        updated[index] = savedEmp
      } else {
        updated = [savedEmp, ...prev]
      }
      try {
        localStorage.setItem('alzahra_employees_data', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  function handleDelete(id: string) {
    setEmployeesList(prev => {
      const updated = prev.filter(e => e.id !== id)
      try {
        localStorage.setItem('alzahra_employees_data', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Team & Access Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage operational staff, module leadership, and administrative permissions</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Personnel', value: employeesList.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'System Administrators', value: employeesList.filter(e => e.role === 'admin').length, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active Personnel', value: employeesList.filter(e => e.is_active).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.bg}`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Employee cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {employeesList.map(emp => (
          <div
            key={emp.id}
            className={cn(
              'bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden',
              emp.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'
            )}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar rendering: photo if uploaded, otherwise gradient initial */}
                  {emp.avatar_url ? (
                    <div className="w-11 h-11 rounded-xl overflow-hidden ring-1 ring-slate-200/80 shadow-sm shrink-0 bg-slate-100">
                      <img
                        src={emp.avatar_url}
                        alt={emp.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement
                          target.style.display = 'none'
                          if (target.parentElement) {
                            target.parentElement.classList.add(
                              'flex',
                              'items-center',
                              'justify-center',
                              'text-white',
                              'font-bold',
                              emp.role === 'admin' ? 'bg-indigo-600' : 'bg-blue-600'
                            )
                            target.parentElement.innerText = emp.name.charAt(0)
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-sm shrink-0',
                        emp.role === 'admin'
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600'
                          : 'bg-gradient-to-br from-blue-600 to-cyan-600'
                      )}
                    >
                      {emp.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{emp.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {emp.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                          <Shield className="w-2.5 h-2.5" /> Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                          <Briefcase className="w-2.5 h-2.5" /> Specialist
                        </span>
                      )}
                      {emp.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                          <XCircle className="w-2.5 h-2.5" /> Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(emp)}
                  className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-400 hover:text-slate-600"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.phone}</span>
                  </div>
                )}
                {emp.assigned_stage ? (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-medium">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      Module: {MODULE_NAMES[emp.assigned_stage]}
                    </span>
                  </div>
                ) : null}
                {emp.role === 'admin' && (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 bg-indigo-50/60 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-md text-[11px] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Cross-Module Full Authorization
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <EmployeeModal
          onClose={() => setShowAdd(false)}
          onSave={handleSave}
        />
      )}
      {selected && (
        <EmployeeModal
          employee={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

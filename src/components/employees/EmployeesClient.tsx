'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  Briefcase,
  DollarSign,
  FileText,
  ArrowRight
} from 'lucide-react'
import { Employee, SalaryType } from '@/lib/types'
import EmployeeModal from './EmployeeModal'
import { cn } from '@/lib/utils'
import { phaseOf } from '@/lib/stageData'
import { useRouter } from 'next/navigation'

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
  9: 'Bangladesh Company Name',
}

const SALARY_TYPE_BADGES: Record<SalaryType, string> = {
  monthly_fixed: 'Monthly Fixed',
  commission_based: 'Commission Based',
  hybrid: 'Base + Commission',
  hourly: 'Hourly Rate',
  per_task: 'Per File/Case',
}

export default function EmployeesClient({ employees: initialEmployees }: Props) {
  const router = useRouter()
  const [employeesList, setEmployeesList] = useState<Employee[]>(initialEmployees)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Employee | null>(null)

  // Server data is the source of truth; refresh after every change
  useEffect(() => { setEmployeesList(initialEmployees) }, [initialEmployees])

  function handleSave(savedEmp: Employee) {
    setEmployeesList(prev => {
      const index = prev.findIndex(e => e.id === savedEmp.id)
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = { ...prev[index], ...savedEmp }
        return updated
      }
      return [savedEmp, ...prev]
    })
    router.refresh()
  }

  function handleDelete(id: string) {
    setEmployeesList(prev => prev.filter(e => e.id !== id))
    router.refresh()
  }

  return (
    <div className="space-y-6 w-full max-w-[2000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Team & Access Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage operational staff, module leadership, work performance, and compensation</p>
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
        {employeesList.map(emp => {
          const tasksCount = emp.tasks?.length || 0
          const completedCount = emp.tasks?.filter(t => t.status === 'Completed').length || 0
          const salaryType = emp.salary?.salary_type || 'monthly_fixed'
          const baseSalary = emp.salary?.base_salary || 6500

          return (
            <div
              key={emp.id}
              className={cn(
                'bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between',
                emp.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'
              )}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Link href={`/dashboard/employees/${emp.id}`} className="flex items-center gap-3 group">
                    {/* Avatar rendering: photo if uploaded, otherwise gradient initial */}
                    {emp.avatar_url ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-slate-200/80 shadow-sm shrink-0 bg-slate-100 group-hover:ring-blue-500 transition">
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
                          'w-12 h-12 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-sm shrink-0 group-hover:opacity-90 transition',
                          emp.role === 'admin'
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600'
                            : 'bg-gradient-to-br from-blue-600 to-cyan-600'
                        )}
                      >
                        {emp.name.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition flex items-center gap-1.5">
                        {emp.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
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
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => setSelected(emp)}
                    title="Quick Edit"
                    className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-400 hover:text-slate-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Salary & Task Mini Highlights */}
                <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">COMPENSATION</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {SALARY_TYPE_BADGES[salaryType] || salaryType}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono font-medium">
                      {baseSalary.toLocaleString()} SAR
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">TASKS & DOSSIERS</span>
                    <span className="font-semibold text-slate-800 block">
                      {tasksCount > 0 ? `${completedCount}/${tasksCount} Completed` : 'No tasks assigned'}
                    </span>
                    <span className="text-[10px] text-blue-600 font-medium">
                      {tasksCount > 0 ? `${Math.round((completedCount / tasksCount) * 100)}% Complete` : 'Assign task'}
                    </span>
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
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
                  {(emp.assigned_stages?.length ? emp.assigned_stages : (emp.assigned_stage ? [emp.assigned_stage] : [])).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[...(emp.assigned_stages?.length ? emp.assigned_stages : [emp.assigned_stage as number])].sort((a, b) => phaseOf(a) - phaseOf(b)).map((st) => (
                        <span key={st} className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-medium truncate max-w-full">
                          <Layers className="w-3 h-3 text-blue-600 shrink-0" />
                          {MODULE_NAMES[st]}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Bottom Card Footer Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <Link
                  href={`/dashboard/employees/${emp.id}`}
                  className="flex-1 py-1.5 px-3 bg-white hover:bg-blue-600 text-slate-700 hover:text-white font-semibold rounded-lg text-xs transition border border-slate-200 hover:border-blue-600 text-center flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>View Dossier & Work History</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )
        })}
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

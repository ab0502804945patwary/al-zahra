'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  Briefcase,
  Mail,
  Phone,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  CreditCard,
  DollarSign,
  TrendingUp,
  Shield,
  Layers,
  MapPin,
  FileText,
  UserCheck,
  Percent,
  Plus,
  Edit3,
  Star,
  ExternalLink,
  ChevronRight,
  Landmark,
  X,
  Loader2
} from 'lucide-react'
import { Employee, EmployeeTask, SalaryDetails, PerformanceReview, SalaryType } from '@/lib/types'
import { STAGE_MODULE_NAMES } from '@/lib/employeeData'
import { phaseOf } from '@/lib/stageData'
import EmployeeModal from './EmployeeModal'

interface Props {
  initialEmployee: Employee
}

const SALARY_TYPE_LABELS: Record<SalaryType, { label: string; desc: string; badgeColor: string }> = {
  monthly_fixed: {
    label: 'Monthly Fixed Salary',
    desc: 'Fixed monthly compensation with standard employment benefits',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  commission_based: {
    label: 'Commission Based',
    desc: 'Pure incentive structure per completed license or dossier clearance',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  hybrid: {
    label: 'Hybrid: Base + Commission',
    desc: 'Guaranteed base wage combined with performance incentives',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  hourly: {
    label: 'Hourly Rate',
    desc: 'Compensation based on logged operational hours',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  per_task: {
    label: 'Per File / Dossier',
    desc: 'Compensation disbursed upon handover of each approved client file',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  }
}

export default function StaffProfileClient({ initialEmployee }: Props) {
  const [employee, setEmployee] = useState<Employee>(initialEmployee)
  const [activeTab, setActiveTab] = useState<'tasks' | 'salary' | 'performance'>('tasks')
  const [taskFilter, setTaskFilter] = useState<'all' | 'completed' | 'in_progress' | 'delayed'>('all')

  // Modals
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showEditSalary, setShowEditSalary] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddReview, setShowAddReview] = useState(false)

  // Salary Edit Form State
  const [salaryForm, setSalaryForm] = useState<SalaryDetails>(
    employee.salary || {
      salary_type: 'monthly_fixed',
      base_salary: 6000,
      currency: 'SAR',
      housing_allowance: 1500,
      transport_allowance: 500,
      food_allowance: 300,
      commission_rate: '',
      bank_name: 'Al Rajhi Bank',
      account_number: '',
      iban: '',
      payment_cycle: 'monthly',
      payment_status: 'Paid',
    }
  )

  // New Task Form State
  const [newTaskForm, setNewTaskForm] = useState({
    company_id: 'AZC806',
    company_name: 'Red Sea Medical Supplies',
    country_of_origin: 'Egypt',
    stage_id: employee.assigned_stage || 1,
    task_title: '',
    status: 'In Progress' as EmployeeTask['status'],
    health: 'Green' as EmployeeTask['health'],
    completion_percent: 50,
    execution_notes: '',
  })

  // New Review Form State
  const [newReviewForm, setNewReviewForm] = useState({
    reviewer_name: 'System Administrator (Manager)',
    overall_rating: 4.8,
    speed_score: 4.7,
    accuracy_score: 4.9,
    compliance_score: 4.8,
    communication_score: 4.6,
    feedback: '',
  })

  async function persistEmployeeUpdate(updatedEmp: Employee) {
    setEmployee(updatedEmp)
    // Only real columns are stored in the database
    const { error } = await createClient().from('employees').update({
      name: updatedEmp.name, phone: updatedEmp.phone ?? null, avatar_url: updatedEmp.avatar_url ?? null,
    }).eq('id', updatedEmp.id)
    if (error) alert('Could not save: ' + error.message)
  }

  // Task metrics calculation ("ke koto gulo kaj korlo na korlo")
  const tasks = employee.tasks || []
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'Completed').length
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length
  const delayedTasks = tasks.filter(t => t.status === 'Delayed').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Filtered task list
  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'completed') return t.status === 'Completed'
    if (taskFilter === 'in_progress') return t.status === 'In Progress'
    if (taskFilter === 'delayed') return t.status === 'Delayed'
    return true
  })

  // Total compensation calculation ("salary type sob kichu")
  const sal = employee.salary || {
    salary_type: 'monthly_fixed',
    base_salary: 6000,
    currency: 'SAR',
    housing_allowance: 1500,
    transport_allowance: 500,
    food_allowance: 300,
    commission_rate: '',
    payment_status: 'Paid',
  }

  const grossMonthly =
    (sal.base_salary || 0) +
    (sal.housing_allowance || 0) +
    (sal.transport_allowance || 0) +
    (sal.food_allowance || 0)

  function handleSaveSalary(e: React.FormEvent) {
    e.preventDefault()
    const updated = {
      ...employee,
      salary: salaryForm
    }
    persistEmployeeUpdate(updated)
    setShowEditSalary(false)
  }

  function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    const newTask: EmployeeTask = {
      id: `task-${Date.now()}`,
      company_id: newTaskForm.company_id,
      company_name: newTaskForm.company_name,
      country_of_origin: newTaskForm.country_of_origin,
      stage_id: newTaskForm.stage_id,
      stage_name: STAGE_MODULE_NAMES[newTaskForm.stage_id] || `Module ${newTaskForm.stage_id}`,
      task_title: newTaskForm.task_title || `Operation for ${newTaskForm.company_name}`,
      status: newTaskForm.status,
      health: newTaskForm.health,
      submit_date: new Date().toISOString().split('T')[0],
      completion_percent: newTaskForm.status === 'Completed' ? 100 : newTaskForm.completion_percent,
      days_taken: 1,
      execution_notes: newTaskForm.execution_notes || 'Assigned to officer',
    }

    const updatedTasks = [newTask, ...(employee.tasks || [])]
    persistEmployeeUpdate({ ...employee, tasks: updatedTasks })
    setShowAddTask(false)
    setNewTaskForm({
      company_id: 'AZC806',
      company_name: 'Red Sea Medical Supplies',
      country_of_origin: 'Egypt',
      stage_id: employee.assigned_stage || 1,
      task_title: '',
      status: 'In Progress',
      health: 'Green',
      completion_percent: 50,
      execution_notes: '',
    })
  }

  function handleCreateReview(e: React.FormEvent) {
    e.preventDefault()
    const newRev: PerformanceReview = {
      id: `rev-${Date.now()}`,
      reviewer_name: newReviewForm.reviewer_name,
      date: new Date().toISOString().split('T')[0],
      overall_rating: newReviewForm.overall_rating,
      speed_score: newReviewForm.speed_score,
      accuracy_score: newReviewForm.accuracy_score,
      compliance_score: newReviewForm.compliance_score,
      communication_score: newReviewForm.communication_score,
      feedback: newReviewForm.feedback,
    }

    const updatedReviews = [newRev, ...(employee.reviews || [])]
    persistEmployeeUpdate({ ...employee, reviews: updatedReviews })
    setShowAddReview(false)
    setNewReviewForm({
      reviewer_name: 'System Administrator (Manager)',
      overall_rating: 4.8,
      speed_score: 4.7,
      accuracy_score: 4.9,
      compliance_score: 4.8,
      communication_score: 4.6,
      feedback: '',
    })
  }

  return (
    <div className="space-y-6 w-full max-w-[2000px] mx-auto pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/employees"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-xs hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Team Roster
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-800">Staff Dossier</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-blue-600 font-mono font-medium">{employee.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditSalary(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition"
          >
            <DollarSign className="w-3.5 h-3.5" /> Edit Salary & Benefits
          </button>
          <button
            onClick={() => setShowEditProfile(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile Photo & Details
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* High-res Avatar */}
            <div className="relative shrink-0">
              {employee.avatar_url ? (
                <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-slate-100 shadow-md bg-slate-50 border border-slate-200">
                  <img
                    src={employee.avatar_url}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shadow-md ${
                    employee.role === 'admin'
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600'
                      : 'bg-gradient-to-br from-blue-600 to-cyan-600'
                  }`}
                >
                  {employee.name.charAt(0)}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] text-white ${
                  employee.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
                title={employee.is_active ? 'Active' : 'Inactive'}
              >
                ✓
              </span>
            </div>

            {/* Profile Meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{employee.name}</h1>
                {employee.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    <Shield className="w-3 h-3" /> System Administrator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                    <Briefcase className="w-3 h-3" /> Process Specialist
                  </span>
                )}
                {employee.is_active ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Active Operational
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200">
                    Inactive
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-slate-600">
                {employee.designation || 'Specialist Officer'} &bull;{' '}
                <span className="text-slate-500">{employee.department || 'Investor Licensing Wing'}</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 mt-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline truncate">
                    {employee.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{employee.phone || '+966 50 000 0000'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{employee.office_location || 'Riyadh Regional HQ'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Joined: {employee.joining_date || '2024-03-01'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Stage Module Pill */}
          {employee.assigned_stage && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-center min-w-[240px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Primary Jurisdiction
              </span>
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {phaseOf(employee.assigned_stage)}
                </div>
                <span className="leading-tight">{STAGE_MODULE_NAMES[employee.assigned_stage]}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Performance Cards ("ke koto gulo kaj korlo na korlo") */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> Assigned Tasks
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalTasks}</div>
          <div className="text-[10px] text-slate-400 mt-1">Total Assigned Tasks</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed Tasks
          </div>
          <div className="text-2xl font-bold text-emerald-600">{completedTasks}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            {completionRate}% Success Rate
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-600 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> In Progress
          </div>
          <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
          <div className="text-[10px] text-blue-500 mt-1">Active Operations</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-600 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Overdue / Pending
          </div>
          <div className="text-2xl font-bold text-rose-600">{delayedTasks}</div>
          <div className="text-[10px] text-rose-500 mt-1">
            {delayedTasks > 0 ? 'Requires Follow-up' : 'All on Track'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-600 mb-1 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Monthly Package
          </div>
          <div className="text-xl font-bold text-slate-900">
            {grossMonthly.toLocaleString()} <span className="text-xs text-slate-400 font-normal">SAR</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            Status: {sal.payment_status || 'Paid'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 mb-1 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500" /> Quality Rating
          </div>
          <div className="text-2xl font-bold text-amber-600 flex items-center gap-1">
            {employee.reviews?.[0]?.overall_rating || 4.7}
            <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
          </div>
          <div className="text-[10px] text-amber-600 mt-1">Quality Assessment</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'tasks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Work & Task Ledger</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {totalTasks}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('salary')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'salary'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Salary & Compensation</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            {sal.salary_type.replace('_', ' ')}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'performance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Performance & Quality Review</span>
        </button>
      </div>

      {/* TAB 1: Work & Task Tracker ("ke koto gulo kaj korlo na korlo kivab korlo") */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setTaskFilter('all')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  taskFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Tasks ({totalTasks})
              </button>
              <button
                onClick={() => setTaskFilter('completed')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  taskFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-emerald-700'
                }`}
              >
                Completed ({completedTasks})
              </button>
              <button
                onClick={() => setTaskFilter('in_progress')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  taskFilter === 'in_progress'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-blue-700'
                }`}
              >
                In Progress ({inProgressTasks})
              </button>
              <button
                onClick={() => setTaskFilter('delayed')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  taskFilter === 'delayed'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-rose-700'
                }`}
              >
                Overdue / Pending ({delayedTasks})
              </button>
            </div>

            <button
              onClick={() => setShowAddTask(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" /> Log New Work Task
            </button>
          </div>

          {/* Tasks Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Entity / Company</th>
                    <th className="py-3 px-4">Operation & Module</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Completion %</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4">Completed / Days</th>
                    <th className="py-3 px-4">Execution Quality / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No tasks found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{t.company_name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                              {t.company_id}
                            </span>
                            <span className="text-[10px] text-slate-400">{t.country_of_origin}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">{t.task_title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-400" />
                            {t.stage_name}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {t.status === 'Completed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          )}
                          {t.status === 'In Progress' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3 h-3" /> In Progress
                            </span>
                          )}
                          {t.status === 'Delayed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" /> Delayed
                            </span>
                          )}
                          {t.status === 'Under Review' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Under Review
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full ${
                                  t.completion_percent === 100
                                    ? 'bg-emerald-500'
                                    : t.status === 'Delayed'
                                    ? 'bg-rose-500'
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: `${t.completion_percent}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-slate-600 font-semibold">
                              {t.completion_percent}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                          {t.submit_date}
                        </td>

                        <td className="py-3 px-4">
                          {t.complete_date ? (
                            <div>
                              <span className="font-mono text-[11px] text-emerald-600 font-semibold block">
                                {t.complete_date}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Took {t.days_taken} days
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-rose-600 font-semibold">
                              {t.days_taken} days active
                              <span className="block text-[10px] text-slate-400 font-normal">
                                Target: {t.target_date || 'N/A'}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                            {t.execution_notes || '-'}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Salary & Compensation ("salary type sob kichu") */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          {/* Salary Structure Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Contractual Compensation Framework
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {SALARY_TYPE_LABELS[sal.salary_type]?.label || sal.salary_type}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {SALARY_TYPE_LABELS[sal.salary_type]?.desc}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Payout Status: {sal.payment_status || 'Paid'}
                </span>
                <button
                  onClick={() => setShowEditSalary(true)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                >
                  Adjust Salary Structure
                </button>
              </div>
            </div>

            {/* Compensation Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Base Salary
                </span>
                <div className="text-2xl font-bold text-slate-900">
                  {(sal.base_salary || 0).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">{sal.currency}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Monthly standard base</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Housing Allowance
                </span>
                <div className="text-2xl font-bold text-slate-900">
                  {(sal.housing_allowance || 0).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">{sal.currency}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">25% allowance allocation</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Transport Allowance
                </span>
                <div className="text-2xl font-bold text-slate-900">
                  {(sal.transport_allowance || 0).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">{sal.currency}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Company mobility subsidy</span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                <span className="text-[11px] font-bold text-blue-700 block mb-1">
                  Total Monthly Gross Package
                </span>
                <div className="text-2xl font-extrabold text-blue-900">
                  {grossMonthly.toLocaleString()}{' '}
                  <span className="text-xs font-semibold text-blue-600">{sal.currency}</span>
                </div>
                <span className="text-[10px] text-blue-600/80 mt-1 block font-medium">
                  Disbursed on 1st of every month
                </span>
              </div>
            </div>

            {/* Commission & Incentive Clause if applicable */}
            {sal.commission_rate && (
              <div className="mt-4 p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start gap-3">
                <Award className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-purple-900">
                    Performance Incentive & Commission Formula:
                  </span>
                  <p className="text-purple-700 mt-0.5">{sal.commission_rate}</p>
                </div>
              </div>
            )}
          </div>

          {/* Banking & Remittance Info */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-600" />
              Corporate Payroll & Bank Remittance Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                  Designated Bank
                </span>
                <span className="text-slate-800 text-sm font-semibold">{sal.bank_name || 'Al Rajhi Bank'}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                  Account Number
                </span>
                <span className="text-slate-800 font-mono">{sal.account_number || '482019382019'}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                  Official IBAN
                </span>
                <span className="text-slate-800 font-mono text-[11px] truncate block">
                  {sal.iban || 'SA44 8000 0412 8765 4321 01'}
                </span>
              </div>
            </div>
          </div>

          {/* Historical Salary Slips / Payout Log */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Salary Disbursement Ledger
              </h3>
              <span className="text-xs text-slate-400">Payroll Cycle: Monthly</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Pay Period</th>
                  <th className="py-3 px-4">Base Salary</th>
                  <th className="py-3 px-4">Allowances</th>
                  <th className="py-3 px-4">Incentives / Bonus</th>
                  <th className="py-3 px-4">Net Disbursed</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  {
                    period: 'October 2026',
                    base: sal.base_salary,
                    allowance: (sal.housing_allowance || 0) + (sal.transport_allowance || 0),
                    bonus: 500,
                    date: '2026-10-31',
                    status: 'Paid',
                  },
                  {
                    period: 'September 2026',
                    base: sal.base_salary,
                    allowance: (sal.housing_allowance || 0) + (sal.transport_allowance || 0),
                    bonus: 750,
                    date: '2026-09-30',
                    status: 'Paid',
                  },
                  {
                    period: 'August 2026',
                    base: sal.base_salary,
                    allowance: (sal.housing_allowance || 0) + (sal.transport_allowance || 0),
                    bonus: 0,
                    date: '2026-08-31',
                    status: 'Paid',
                  },
                ].map((s, idx) => {
                  const net = s.base + s.allowance + s.bonus
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">{s.period}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {s.base.toLocaleString()} {sal.currency}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {s.allowance.toLocaleString()} {sal.currency}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-medium">
                        +{s.bonus.toLocaleString()} {sal.currency}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {net.toLocaleString()} {sal.currency}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{s.date}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Disbursed
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Performance & Quality Review ("kivab korlo") */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Quality Breakdown Bars */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Performance Dimensions & Operational Metrics
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluated across speed, legal accuracy, compliance, and client interaction
                </p>
              </div>

              <button
                onClick={() => setShowAddReview(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Appraisal Review
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {[
                { label: 'Turnaround Speed & Punctuality', score: 92, rating: '4.6 / 5.0' },
                { label: 'Legal & Notary Accuracy', score: 98, rating: '4.9 / 5.0' },
                { label: 'Ministry Portal Compliance', score: 95, rating: '4.8 / 5.0' },
                { label: 'Client Communication & Updates', score: 88, rating: '4.4 / 5.0' },
              ].map(dim => (
                <div key={dim.label} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{dim.label}</span>
                    <span className="text-blue-600">{dim.rating}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supervisor Feedback Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Supervisor Appraisals & Quality Audit Logs
            </h3>

            <div className="space-y-4">
              {(employee.reviews || []).map(r => (
                <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs">{r.reviewer_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{r.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{r.overall_rating} / 5.0</span>
                    </div>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">{r.feedback}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Edit Profile & Photo */}
      {showEditProfile && (
        <EmployeeModal
          employee={employee}
          onClose={() => setShowEditProfile(false)}
          onSave={persistEmployeeUpdate}
        />
      )}

      {/* MODAL 2: Adjust Salary Structure */}
      {showEditSalary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Update Compensation & Salary Type
                </h2>
                <p className="text-xs text-slate-400">Contractual terms for {employee.name}</p>
              </div>
              <button
                onClick={() => setShowEditSalary(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Salary Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={salaryForm.salary_type}
                  onChange={e => setSalaryForm(p => ({ ...p, salary_type: e.target.value as SalaryType }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="monthly_fixed">Monthly Fixed</option>
                  <option value="commission_based">Commission Based</option>
                  <option value="hybrid">Hybrid: Base + Commission</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="per_task">Per File / Dossier</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">
                    Base Salary <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={salaryForm.base_salary}
                      onChange={e => setSalaryForm(p => ({ ...p, base_salary: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      SAR
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">
                    Housing Allowance
                  </label>
                  <input
                    type="number"
                    value={salaryForm.housing_allowance || 0}
                    onChange={e => setSalaryForm(p => ({ ...p, housing_allowance: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">
                    Transport Allowance
                  </label>
                  <input
                    type="number"
                    value={salaryForm.transport_allowance || 0}
                    onChange={e => setSalaryForm(p => ({ ...p, transport_allowance: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">
                    Payment Status
                  </label>
                  <select
                    value={salaryForm.payment_status || 'Paid'}
                    onChange={e => setSalaryForm(p => ({ ...p, payment_status: e.target.value as any }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Commission / Bonus Formula
                </label>
                <input
                  value={salaryForm.commission_rate || ''}
                  onChange={e => setSalaryForm(p => ({ ...p, commission_rate: e.target.value }))}
                  placeholder="e.g. SAR 250 per cleared license"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Bank Name</label>
                  <input
                    value={salaryForm.bank_name || ''}
                    onChange={e => setSalaryForm(p => ({ ...p, bank_name: e.target.value }))}
                    placeholder="e.g. Al Rajhi Bank"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Account Number / IBAN</label>
                  <input
                    value={salaryForm.iban || ''}
                    onChange={e => setSalaryForm(p => ({ ...p, iban: e.target.value }))}
                    placeholder="SA44 8000 ..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditSalary(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Save Salary Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Log New Task */}
      {showAddTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Assign Work Task</h2>
                <p className="text-xs text-slate-400">Log an operational dossier for {employee.name}</p>
              </div>
              <button
                onClick={() => setShowAddTask(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={newTaskForm.company_name}
                  onChange={e => setNewTaskForm(p => ({ ...p, company_name: e.target.value }))}
                  placeholder="e.g. Gulf Trading Corporation"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Company ID</label>
                  <input
                    value={newTaskForm.company_id}
                    onChange={e => setNewTaskForm(p => ({ ...p, company_id: e.target.value }))}
                    placeholder="AZC809"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Status</label>
                  <select
                    value={newTaskForm.status}
                    onChange={e => setNewTaskForm(p => ({ ...p, status: e.target.value as any }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Task Title / Specific Operation
                </label>
                <input
                  value={newTaskForm.task_title}
                  onChange={e => setNewTaskForm(p => ({ ...p, task_title: e.target.value }))}
                  placeholder="e.g. Foreign notary verification & clearance"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Execution Notes & Remarks
                </label>
                <textarea
                  rows={3}
                  value={newTaskForm.execution_notes}
                  onChange={e => setNewTaskForm(p => ({ ...p, execution_notes: e.target.value }))}
                  placeholder="Details on document quality, delay reasons, or progress..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Add Performance Review */}
      {showAddReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add Manager Appraisal</h2>
                <p className="text-xs text-slate-400">Quality evaluation for {employee.name}</p>
              </div>
              <button
                onClick={() => setShowAddReview(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Overall Rating (1 - 5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  required
                  value={newReviewForm.overall_rating}
                  onChange={e => setNewReviewForm(p => ({ ...p, overall_rating: parseFloat(e.target.value) || 5 }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Feedback / Observations</label>
                <textarea
                  rows={4}
                  required
                  value={newReviewForm.feedback}
                  onChange={e => setNewReviewForm(p => ({ ...p, feedback: e.target.value }))}
                  placeholder="Comment on work velocity, legal accuracy, compliance and client communication..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddReview(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Post Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

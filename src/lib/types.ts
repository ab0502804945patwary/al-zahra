export type UserRole = 'admin' | 'employee'

export type SalaryType =
  | 'monthly_fixed'
  | 'commission_based'
  | 'hourly'
  | 'hybrid'
  | 'per_task'

export interface SalaryDetails {
  salary_type: SalaryType
  base_salary: number
  currency: string
  housing_allowance?: number
  transport_allowance?: number
  food_allowance?: number
  commission_rate?: string
  bank_name?: string
  account_number?: string
  iban?: string
  payment_cycle?: 'monthly' | 'biweekly' | 'weekly'
  last_paid_date?: string
  next_pay_date?: string
  payment_status?: 'Paid' | 'Processing' | 'Pending'
}

export interface EmployeeTask {
  id: string
  company_id: string
  company_name: string
  country_of_origin?: string
  stage_id: number
  stage_name: string
  task_title: string
  status: 'Completed' | 'In Progress' | 'Delayed' | 'Under Review'
  health: 'Green' | 'Yellow' | 'Red'
  submit_date: string
  target_date?: string
  complete_date?: string
  days_taken?: number
  completion_percent: number
  quality_score?: number // 1 to 5
  execution_notes?: string
}

export interface PerformanceReview {
  id: string
  reviewer_name: string
  date: string
  overall_rating: number // 1 to 5
  speed_score: number
  accuracy_score: number
  compliance_score: number
  communication_score: number
  feedback: string
}

export interface Employee {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  assigned_stage?: number
  /** All stages this staff member may work on (admins have access to every stage) */
  assigned_stages?: number[]
  modules?: string[]
  is_active: boolean
  avatar_url?: string
  department?: string
  designation?: string
  joining_date?: string
  national_id?: string
  office_location?: string
  salary?: SalaryDetails
  tasks?: EmployeeTask[]
  reviews?: PerformanceReview[]
  created_at: string
}

export interface Company {
  id: string
  company_id: string
  country_of_origin?: string
  province?: string
  company_name: string
  entity_type?: string
  rjsc_issue_no?: string
  rjsc_auditor?: string
  rjsc_company_type?: string
  rjsc_reg_no?: string
  rjsc_incorporation_date?: string
  rjsc_annual_return_due?: string
  bd_last_audit_date?: string
  bd_audit_status?: string
  bd_next_audit_due?: string
  bd_auditor?: string
  bd_financial_year?: string
  bd_audit_report?: string
  bd_audit_notes?: string
  sa_last_audit_date?: string
  sa_audit_status?: string
  sa_next_audit_due?: string
  sa_auditor?: string
  sa_financial_year?: string
  sa_audit_report?: string
  sa_audit_notes?: string
  client_name?: string
  client_phone?: string
  client_present_address?: string
  present_country?: string
  present_city?: string
  /** auth user id of whoever registered the company (staff see only their own in the directory) */
  created_by?: string | null
  /** 'a2z' = A2Z handles the full setup flow; 'renewal' = existing company, renewal only */
  service_type?: 'a2z' | 'renewal' | string
  cr_number?: string
  cr_issue_date?: string
  cr_expire_date?: string
  misa_license_no?: string
  misa_issue_date?: string
  misa_expire_date?: string
  tin_number?: string
  vat_number?: string
  chamber_registration_no?: string
  gosi_qiwa_status?: string
  official_email?: string
  whatsapp_number?: string
  national_address?: string
  ceo_gm_name?: string
  iqama_no?: string
  shareholders_name?: string
  shareholder_phone?: string
  shareholders?: any[]
  original_company_name?: string | null
  selected_phases?: string[] | null
  skipped_phases?: string[] | null
  admin_name?: string
  admin_iqama_no?: string
  admin_iqama_expiry?: string
  admin_mobile?: string
  admin_email?: string
  admin_access_setup?: string
  doc_checks?: Record<string, any>
  company_documents?: any[]
  bank_name?: string
  account_name?: string
  account_number?: string
  iban_swift?: string
  file_portal_login?: string
  account_status?: string
  assigned_office?: string
  drive_link?: string
  remarks?: string
  created_at: string
}

export interface StageEntry {
  id: string
  company_id: string
  client_name?: string
  client_phone?: string
  category?: string
  priority?: string
  current_stage?: string
  submit_date?: string
  target_date?: string
  complete_date?: string
  days_taken?: number
  status?: string
  completion_percent?: number
  overdue_status?: string
  assigned_to?: string
  remarks?: string
  
  // Specific stage fields
  usa_type?: string
  usa_submit_date?: string
  usa_complete_date?: string
  usa_status?: string
  usa_payment_status?: string
  canada_type?: string
  canada_submit_date?: string
  canada_complete_date?: string
  canada_status?: string
  canada_payment_status?: string
  
  name_clearance_number?: string
  approval_date?: string
  expire_date?: string
  remaining_days?: number
  cr_status?: string
  entity_type?: string

  created_at?: string
  companies?: Company
  employees?: Employee
}

export interface StageConfig {
  id: number
  title: string
  step: string
  description: string
  color: string
}

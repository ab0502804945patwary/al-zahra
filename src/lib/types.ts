export type UserRole = 'admin' | 'employee'

export interface Employee {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  assigned_stage?: number
  is_active: boolean
  avatar_url?: string
  created_at: string
}

export interface Company {
  id: string
  company_id: string
  country_of_origin?: string
  company_name: string
  entity_type?: string
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
  payment_status?: string
  remarks?: string
  employee_id?: string
  drive_link?: string
  overdue_status?: string
  days_taken?: number
  status?: 'Green' | 'Yellow' | 'Red'
  completion_percent?: number
  created_at: string
  companies?: Company
  employees?: Employee
}

export interface Stage3Entry extends StageEntry {
  usa_type?: string
  usa_submit_date?: string
  usa_target_date?: string
  usa_complete_date?: string
  usa_overdue_status?: string
  usa_days_taken?: number
  usa_status?: string
  usa_completion_percent?: number
  usa_payment_status?: string
  canada_type?: string
  canada_submit_date?: string
  canada_target_date?: string
  canada_complete_date?: string
  canada_overdue_status?: string
  canada_days_taken?: number
  canada_status?: string
  canada_completion_percent?: number
  canada_payment_status?: string
}

export interface NameClearance {
  id: string
  company_id: string
  entity_type?: string
  company_name_english?: string
  arabic_name?: string
  name_clearance_number?: string
  submit_date?: string
  approval_date?: string
  expire_date?: string
  remaining_days?: number
  status?: string
  cr_status?: string
  notes?: string
  created_at: string
  companies?: Company
}

export interface DashboardStats {
  totalCompanies: number
  totalStageEntries: number
  greenCount: number
  yellowCount: number
  redCount: number
  pendingCount: number
  completedCount: number
  avgCompletion: number
  expiringLicenses: number
  stageStats: {
    stage: number
    name: string
    employee: string
    total: number
    green: number
    yellow: number
    red: number
    avgCompletion: number
  }[]
}

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StageTable from '@/components/stage/StageTable'
import StageHeader from '@/components/stage/StageHeader'

export const dynamic = 'force-dynamic'

export const STAGE_CONFIG: Record<string, {
  step: string
  table: string
  label: string
  category: string
  employee: string
  hasUSACanada?: boolean
  isNameClearance?: boolean
}> = {
  '1': {
    step: '01',
    table: 'stage1_mother_company',
    label: 'Parent Entity Verification',
    category: 'Corporate Eligibility & Attestation',
    employee: 'Shahariar Hossain Rakib'
  },
  '2': {
    step: '02',
    table: 'stage2_activity_list',
    label: 'Commercial Activity Classification',
    category: 'ISIC4 Activity Mapping',
    employee: 'Abdul Kaium'
  },
  '3': {
    step: '03',
    table: 'stage3_foreign_company',
    label: 'Foreign Entity Clearance',
    category: 'Cross-Border Licensing (USA & Canada)',
    employee: 'Arju Hossain',
    hasUSACanada: true
  },
  '4': {
    step: '04',
    table: 'stage4_misa_license',
    label: 'MISA Investment License',
    category: 'Ministry of Investment Portal',
    employee: 'Md Miraj'
  },
  '5': {
    step: '05',
    table: 'stage5_commercial_registration',
    label: 'Commercial Registration (CR)',
    category: 'Ministry of Commerce Statutory CR',
    employee: 'Md Ishak'
  },
  '6': {
    step: '06',
    table: 'stage6_other_websites',
    label: 'Government Portals & Compliance',
    category: 'Qiwa, Muqeem, GOSI & Chamber',
    employee: 'Md Azad'
  },
  '7': {
    step: '07',
    table: 'stage7_file_ready',
    label: 'Final Legal Dossier & Issuance',
    category: 'Corporate File Handover',
    employee: 'Md Azad'
  },
  '8': {
    step: '08',
    table: 'stage8_name_clearance',
    label: 'Commercial Trade Name Clearance',
    category: 'Official Name Reservation',
    employee: 'System Administrator',
    isNameClearance: true
  },
}

const FALLBACK_STAGE_ENTRIES: Record<string, any[]> = {
  '1': [
    {
      id: 's1-1',
      company_id: 'AZC801',
      category: 'Trading License',
      priority: 'USA MOTHER COMPANY',
      current_stage: 'Approved',
      submit_date: '2026-07-02',
      complete_date: '2026-07-10',
      days_taken: 8,
      status: 'Green',
      completion_percent: 100,
      overdue_status: 'Completed',
      remarks: 'Attestation verified by Sharif',
      companies: { company_name: 'Steel Com', country_of_origin: 'Afghanistan' },
      employees: { name: 'Shahariar Hossain Rakib' }
    },
    {
      id: 's1-2',
      company_id: 'AZC802',
      client_name: 'Belayet Hossain',
      client_phone: '0569158296',
      category: 'Trading License',
      priority: 'BD Company Complete',
      current_stage: 'Approved',
      submit_date: '2026-07-03',
      complete_date: '2026-09-26',
      days_taken: 85,
      status: 'Red',
      completion_percent: 30,
      overdue_status: 'Completed',
      remarks: 'Document review by Monjurul Hoq',
      companies: { company_name: 'al tamayyuz sharikat taj Trading', country_of_origin: 'Bangladesh' },
      employees: { name: 'Shahariar Hossain Rakib' }
    }
  ],
  '2': [
    {
      id: 's2-1',
      company_id: 'AZC801',
      client_phone: '0502176551',
      category: 'Trading License',
      priority: 'USA MOTHER COMPANY',
      current_stage: 'Approved',
      submit_date: '2026-07-10',
      complete_date: '2026-07-20',
      days_taken: 10,
      status: 'Green',
      completion_percent: 100,
      overdue_status: 'Completed',
      companies: { company_name: 'Steel Com', country_of_origin: 'Afghanistan' },
      employees: { name: 'Abdul Kaium' }
    },
    {
      id: 's2-2',
      company_id: 'AZC802',
      client_name: 'Belayet Hossain',
      client_phone: '0569158296',
      category: 'Trading License',
      priority: 'BD Company Complete',
      current_stage: 'Approved',
      submit_date: '2026-07-26',
      complete_date: '2026-08-03',
      days_taken: 8,
      status: 'Green',
      completion_percent: 100,
      overdue_status: 'Completed',
      companies: { company_name: 'al tamayyuz sharikat taj Trading', country_of_origin: 'Bangladesh' },
      employees: { name: 'Abdul Kaium' }
    }
  ],
  '3': [
    {
      id: 's3-1',
      company_id: 'AZC801',
      category: 'Trading License',
      priority: 'USA MOTHER COMPANY',
      usa_type: 'Delaware LLC Certificate',
      usa_submit_date: '2026-08-01',
      usa_complete_date: '2026-07-15',
      usa_status: 'Red',
      usa_payment_status: 'Paid',
      canada_type: 'Federal Incorporation',
      canada_submit_date: '2026-07-15',
      canada_complete_date: '2026-07-15',
      canada_status: 'Green',
      canada_payment_status: 'Paid',
      companies: { company_name: 'Steel Com', country_of_origin: 'Afghanistan' },
      employees: { name: 'Arju Hossain' }
    },
    {
      id: 's3-2',
      company_id: 'AZC802',
      client_name: 'Belayet Hossain',
      client_phone: '0569158296',
      category: 'Trading License',
      priority: 'BD Company Complete',
      usa_type: 'Wyoming Corporate Registration',
      usa_submit_date: '2026-08-01',
      usa_complete_date: '2026-08-04',
      usa_status: 'Green',
      usa_payment_status: 'Paid',
      canada_type: 'Ontario Extra-Provincial',
      canada_submit_date: '2026-08-05',
      canada_complete_date: '2026-08-05',
      canada_status: 'Green',
      canada_payment_status: 'Paid',
      companies: { company_name: 'al tamayyuz sharikat taj Trading', country_of_origin: 'Bangladesh' },
      employees: { name: 'Arju Hossain' }
    }
  ],
  '4': [
    {
      id: 's4-1',
      company_id: 'AZC801',
      category: 'Trading License',
      priority: 'USA MOTHER COMPANY',
      current_stage: 'Application Submitted',
      submit_date: '2026-08-26',
      complete_date: '2026-09-12',
      days_taken: 17,
      status: 'Red',
      completion_percent: 30,
      overdue_status: 'Completed',
      companies: { company_name: 'Steel Com', country_of_origin: 'Afghanistan' },
      employees: { name: 'Md Miraj' }
    },
    {
      id: 's4-2',
      company_id: 'AZC802',
      client_name: 'Belayet Hossain',
      client_phone: '0569158296',
      category: 'Trading License',
      priority: 'BD Company Complete',
      current_stage: 'Application Under Review',
      submit_date: '2026-08-08',
      complete_date: null,
      days_taken: 97,
      status: 'Red',
      completion_percent: 30,
      overdue_status: 'Pending',
      companies: { company_name: 'al tamayyuz sharikat taj Trading', country_of_origin: 'Bangladesh' },
      employees: { name: 'Md Miraj' }
    }
  ],
  '8': [
    {
      id: 's8-1',
      company_id: 'AZC801',
      entity_type: 'Trading License',
      name_clearance_number: 'NC-2026-0801',
      submit_date: '2026-08-20',
      approval_date: '2026-11-01',
      expire_date: '2026-12-31',
      remaining_days: 48,
      status: 'Active',
      cr_status: 'Complete',
      companies: { company_name: 'Steel Com', country_of_origin: 'Afghanistan' }
    },
    {
      id: 's8-2',
      company_id: 'AZC802',
      entity_type: 'Trading License',
      name_clearance_number: 'NC-2026-0802',
      submit_date: '2026-11-10',
      remaining_days: 60,
      status: 'Active',
      cr_status: 'Pending',
      companies: { company_name: 'al tamayyuz sharikat taj Trading', country_of_origin: 'Bangladesh' }
    }
  ]
}

const FALLBACK_COMPANIES = [
  { company_id: 'AZC801', company_name: 'Steel Com', country_of_origin: 'Afghanistan' },
  { company_id: 'AZC802', company_name: 'al tamayyuz sharikat taj Trading', country_of_origin: 'Bangladesh' }
]

const FALLBACK_EMPLOYEES = [
  { id: 'e1', name: 'Shahariar Hossain Rakib', assigned_stage: 1 },
  { id: 'e2', name: 'Abdul Kaium', assigned_stage: 2 },
  { id: 'e3', name: 'Arju Hossain', assigned_stage: 3 },
  { id: 'e4', name: 'Md Miraj', assigned_stage: 4 },
  { id: 'e5', name: 'Md Ishak', assigned_stage: 5 },
  { id: 'e6', name: 'Md Azad', assigned_stage: 6 }
]

export default async function StagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const config = STAGE_CONFIG[id]
  if (!config) notFound()

  const supabase = await createClient()

  let entries: any[] = []
  let companies: any[] = []
  let employees: any[] = []

  try {
    if (config.isNameClearance) {
      const { data } = await supabase
        .from(config.table)
        .select('*, companies(company_name, country_of_origin)')
        .order('created_at', { ascending: false })
      if (data && data.length > 0) entries = data
    } else {
      const { data } = await supabase
        .from(config.table)
        .select('*, companies(company_name, country_of_origin), employees(name)')
        .order('created_at', { ascending: false })
      if (data && data.length > 0) entries = data
    }

    const { data: cData } = await supabase.from('companies').select('company_id, company_name, country_of_origin').order('company_id')
    if (cData && cData.length > 0) companies = cData

    const { data: eData } = await supabase.from('employees').select('id, name, assigned_stage')
    if (eData && eData.length > 0) employees = eData
  } catch (e) {
    console.error('Error fetching stage data:', e)
  }

  // Use fallback if empty
  if (entries.length === 0 && FALLBACK_STAGE_ENTRIES[id]) {
    entries = FALLBACK_STAGE_ENTRIES[id]
  }
  if (companies.length === 0) companies = FALLBACK_COMPANIES
  if (employees.length === 0) employees = FALLBACK_EMPLOYEES

  const stats = {
    total: entries.length,
    green: entries.filter(e => (e.status || e.usa_status) === 'Green').length,
    yellow: entries.filter(e => (e.status || e.usa_status) === 'Yellow').length,
    red: entries.filter(e => (e.status || e.usa_status) === 'Red').length,
    completed: entries.filter(e => e.overdue_status === 'Completed').length,
    pending: entries.filter(e => e.overdue_status === 'Pending').length,
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <StageHeader
        stageId={id}
        config={config}
        stats={stats}
        companies={companies}
        employees={employees}
      />
      <StageTable
        stageId={id}
        entries={entries}
        companies={companies}
        employees={employees}
        isUSACanada={config.hasUSACanada}
        isNameClearance={config.isNameClearance}
      />
    </div>
  )
}

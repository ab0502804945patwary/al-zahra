import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import MasterMatrixDashboard from '@/components/dashboard/MasterMatrixDashboard'
import { Company } from '@/lib/types'

export const dynamic = 'force-dynamic'

const FALLBACK_COMPANIES: Company[] = [
  {
    id: '1',
    company_id: 'AZC801',
    country_of_origin: 'Afghanistan',
    company_name: 'Steel Com',
    entity_type: 'Trading License',
    cr_number: 'CR-801-4432',
    misa_license_no: 'MISA-2026-801',
    account_status: 'Active',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    company_id: 'AZC802',
    country_of_origin: 'Bangladesh',
    company_name: 'al tamayyuz sharikat taj Trading',
    entity_type: 'Trading License',
    ceo_gm_name: 'Belayet Hossain',
    account_status: 'Active',
    created_at: '2026-01-01T00:00:00.000Z',
  },
]

export default async function DashboardPage() {
  let companies: Company[] = FALLBACK_COMPANIES
  const kpiStats = {
    totalCompanies: 2,
    compliant: 4,
    overdue: 4,
    expiring: 1,
  }

  if (isSupabaseConfigured) {
    const supabase = await createClient()
    try {
      const { data } = await supabase.from('companies').select('*').order('company_id')
      if (data && data.length > 0) {
        companies = data
        kpiStats.totalCompanies = data.length
      }
    } catch {}
  }

  return (
    <MasterMatrixDashboard
      initialCompanies={companies}
      kpiStats={kpiStats}
    />
  )
}

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import CompaniesClient from '@/components/companies/CompaniesClient'
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
    tin_number: '31098471200003',
    vat_number: '31098471200003',
    account_status: 'Active',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    company_id: 'AZC802',
    country_of_origin: 'Bangladesh',
    company_name: 'al tamayyuz sharikat taj Trading',
    entity_type: 'Trading License',
    ceo_gm_name: 'Belayet Hossain',
    whatsapp_number: '0569158296',
    account_status: 'Active',
    created_at: new Date().toISOString()
  }
]

export default async function CompaniesPage() {
  const supabase = await createClient()
  try {
    const { data: companies } = await supabase.from('companies').select('*').order('company_id')
    if (companies && companies.length > 0) {
      return <CompaniesClient companies={companies} />
    }
  } catch (e) {
    console.error('Error fetching companies:', e)
  }

  return <CompaniesClient companies={FALLBACK_COMPANIES} />
}

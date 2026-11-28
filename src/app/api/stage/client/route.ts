import { NextResponse } from 'next/server'
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { getSessionInfo } from '@/lib/session'
import { canAccessStage } from '@/lib/access'
import { STAGE_CONFIG } from '@/lib/stageData'
import { phaseStaffAllows } from '@/lib/stageRules'
import { isWaitingInStage } from '@/lib/notifications'
import { HISTORY_COMMON, HISTORY_PHASES, type PhaseRecord } from '@/lib/phaseHistory'

export const dynamic = 'force-dynamic'

/** What the client popup of a workflow phase shows. Bank details and portal logins are left out on purpose. */
const FIELDS = [
  'company_id', 'company_name', 'original_company_name', 'country_of_origin', 'entity_type', 'account_status', 'service_type', 'selected_phases', 'created_at',
  'client_name', 'client_phone', 'present_country', 'present_city', 'client_present_address', 'whatsapp_number', 'official_email', 'national_address',
  'shareholders', 'shareholders_name', 'shareholder_phone',
  'admin_name', 'admin_iqama_no', 'admin_iqama_expiry', 'admin_mobile', 'admin_email', 'admin_access_setup', 'ceo_gm_name', 'iqama_no',
  'doc_checks', 'company_documents',
  'cr_number', 'cr_issue_date', 'cr_expire_date', 'misa_license_no', 'misa_issue_date', 'misa_expire_date',
  'tin_number', 'vat_number', 'chamber_registration_no', 'gosi_qiwa_status',
  'rjsc_reg_no', 'rjsc_incorporation_date', 'rjsc_annual_return_due', 'rjsc_issue_no', 'rjsc_auditor', 'rjsc_company_type',
  'bd_last_audit_date', 'bd_audit_status', 'bd_next_audit_due', 'bd_financial_year', 'bd_auditor', 'bd_audit_report', 'bd_audit_notes',
  'sa_last_audit_date', 'sa_audit_status', 'sa_next_audit_due', 'sa_financial_year', 'sa_auditor', 'sa_audit_report', 'sa_audit_notes', 'sa_audit_files',
]

/**
 * POST { stage, company_id } -> { company, phases }   (phases: earlier work and files, MISA phase only)
 * Only for admins and staff assigned to that phase, and only for a company that has a record in it or is waiting for it.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })

  const { user, employee: me } = await getSessionInfo()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const stage = String(body?.stage || '')
  const companyId = String(body?.company_id || '')
  if (!Object.hasOwn(STAGE_CONFIG, stage) || !companyId) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  if (!me || me.is_active === false || !canAccessStage(me, Number(stage))) {
    return NextResponse.json({ error: 'You cannot see client information of this phase.' }, { status: 403 })
  }

  const db = await createServiceClient()
  const entry = await db.from(STAGE_CONFIG[stage].table).select('company_id').eq('company_id', companyId).limit(1)
  if (entry.error) return NextResponse.json({ error: 'Could not load the client information.' }, { status: 500 })
  if (!entry.data?.length && !(await isWaitingInStage(stage, companyId))) {
    return NextResponse.json({ error: 'This company has not reached this phase.' }, { status: 404 })
  }

  const { data, error } = await db.from('companies').select('*').eq('company_id', companyId).maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load the client information.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Company not found.' }, { status: 404 })
  if (me.role !== 'admin' && !phaseStaffAllows(data, stage, user.id)) {
    return NextResponse.json({ error: 'This company is given to other staff in this phase.' }, { status: 403 })
  }

  const company = Object.fromEntries(FIELDS.map(k => [k, (data as Record<string, unknown>)[k] ?? null]))
  let phases: PhaseRecord[] = []
  if (stage === '4') {
    const results = await Promise.all(HISTORY_PHASES.map(p => db.from(STAGE_CONFIG[p.stage].table).select('*').eq('company_id', companyId)))
    if (results.some(r => r.error)) return NextResponse.json({ error: 'Could not load the earlier phases.' }, { status: 500 })
    phases = HISTORY_PHASES.flatMap((p, i) => ((results[i].data || []) as Record<string, any>[]).map(row => ({
      stage: p.stage,
      values: Object.fromEntries([...p.fields, ...HISTORY_COMMON].map(([column]) => [column, row[column] ?? null])),
      files: Array.isArray(row.dossier_files) ? row.dossier_files.filter((f: any) => f?.key).map((f: any) => ({ key: f.key, name: f.name, tag: f.tag })) : [],
    })))
  }
  return NextResponse.json({ company, phases }, { headers: { 'Cache-Control': 'no-store' } })
}

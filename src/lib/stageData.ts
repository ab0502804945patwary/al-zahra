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
    step: '03',
    table: 'stage2_activity_list',
    label: 'Commercial Activity Classification',
    category: 'ISIC4 Activity Mapping',
    employee: 'Abdul Kaium'
  },
  '3': {
    step: '04',
    table: 'stage3_foreign_company',
    label: '1 Foreign Subsidiary Company',
    category: 'Foreign Subsidiary Company',
    employee: 'Arju Hossain'
  },
  '4': {
    step: '06',
    table: 'stage4_misa_license',
    label: 'MISA Investment License',
    category: 'Ministry of Investment Portal',
    employee: 'Md Miraj'
  },
  '5': {
    step: '07',
    table: 'stage5_commercial_registration',
    label: 'Commercial Registration (CR)',
    category: 'Ministry of Commerce Statutory CR',
    employee: 'Md Ishak'
  },
  '6': {
    step: '08',
    table: 'stage6_other_websites',
    label: 'Government Portals & Compliance',
    category: 'Qiwa, Muqeem, GOSI & Chamber',
    employee: 'Md Azad'
  },
  '7': {
    step: '09',
    table: 'stage7_file_ready',
    label: 'Final Legal Dossier & Issuance',
    category: 'Corporate File Handover',
    employee: 'Md Azad'
  },
  '9': {
    step: '02',
    table: 'stage9_bd_company',
    label: 'Bangladesh Company Name',
    category: 'RJSC Registration & Annual Return',
    employee: 'Operations'
  },
  '10': {
    step: '00',
    table: 'stage10_foreign_mother',
    label: 'Foreign Mother Company',
    category: 'Foreign Parent Company',
    employee: 'Operations'
  },
  '11': {
    step: '00',
    table: 'stage11_foreign_subsidiary_2',
    label: '2 Foreign Subsidiary Company',
    category: 'Foreign Subsidiary Company',
    employee: 'Operations'
  },
  '8': {
    step: '05',
    table: 'stage8_name_clearance',
    label: 'Company Name Clearance',
    category: 'Official Name Reservation',
    employee: 'System Administrator',
    isNameClearance: true
  },
}

/** Order of the workflow menu. Phase numbers follow this order (stage ids and URLs stay the same). */
export const MENU_ORDER = ['1', '9', '10', '2', '3', '11', '8', '4', '5', '6', '7']
// the "PHASE 0X" number of every stage follows its place in the menu
MENU_ORDER.forEach((id, i) => { if (STAGE_CONFIG[id]) STAGE_CONFIG[id].step = String(i + 1).padStart(2, '0') })
export const phaseOf = (stageId: string | number) => {
  const i = MENU_ORDER.indexOf(String(stageId))
  return i < 0 ? Number(stageId) : i + 1
}

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

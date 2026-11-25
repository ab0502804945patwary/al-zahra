// Government portals handled in Stage 6 (Portals & Compliance).
// To use a real logo, put an image in public/portals/<key>.png and set `logo` below; until then a coloured badge is shown.
export interface PortalDef { key: string; name: string; short: string; color: string; logo?: string }

export const PORTALS: PortalDef[] = [
  { key: 'SPL', name: 'SPL (National Address)', short: 'SPL', color: '#0d7a5f', logo: '/portals/spl.svg' },
  { key: 'MISA', name: 'Ministry of Investment (MISA)', short: 'MISA', color: '#006d46', logo: '/portals/misa.svg' },
  { key: 'QIWA', name: 'QIWA', short: 'Q', color: '#6b3fa0', logo: '/portals/qiwa.svg' },
  { key: 'MUQEEM', name: 'MUQEEM', short: 'M', color: '#b4541a', logo: '/portals/muqeem.svg' },
  { key: 'GOSI CERTIFICATE', name: 'GOSI', short: 'G', color: '#1b6fb5', logo: '/portals/gosi.svg' },
  { key: 'MOC', name: 'Ministry of Commerce', short: 'MC', color: '#03534c', logo: '/portals/moc.svg' },
  { key: 'Chamber Of Commerce', name: 'Chamber of Commerce', short: 'CC', color: '#8a6d1a' },
  { key: 'VAT', name: 'VAT (ZATCA)', short: 'VAT', color: '#a3263c', logo: '/portals/zatca.svg' },
  { key: 'GMAIL', name: 'Gmail', short: 'G', color: '#ea4335', logo: '/portals/gmail.svg' },
  { key: 'ABSHER', name: 'Absher', short: 'A', color: '#1a7f5a', logo: '/portals/absher.svg' },
]

export interface PortalAccount { portal: string; username: string; password: string; note?: string }

export const portalByKey = (key: string) => PORTALS.find(p => p.key === key)

/** A portal line counts when it has both a user name and a password (or "Login with Nafath"). */
export const portalFilled = (a?: PortalAccount) => !!a && a.username.trim() !== '' && a.password.trim() !== ''

/** How many of the portals in the list already have their account filled in. */
export function portalsDone(accounts: PortalAccount[]) {
  return PORTALS.filter(p => portalFilled((accounts || []).find(a => a.portal === p.key))).length
}

/** Portals & Compliance is complete when every portal in the list has its account. */
export const portalsComplete = (accounts: PortalAccount[]) => portalsDone(accounts) === PORTALS.length

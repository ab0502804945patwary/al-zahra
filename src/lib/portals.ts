// Government portals handled in Stage 6 (Portals & Compliance).
// To use a real logo, put an image in public/portals/<key>.png and set `logo` below; until then a coloured badge is shown.
export interface PortalDef { key: string; name: string; short: string; color: string; logo?: string }

export const PORTALS: PortalDef[] = [
  { key: 'SPL', name: 'SPL (National Address)', short: 'SPL', color: '#0d7a5f' },
  { key: 'QIWA', name: 'QIWA', short: 'Q', color: '#6b3fa0' },
  { key: 'MUQEEM', name: 'MUQEEM', short: 'M', color: '#b4541a' },
  { key: 'GOSI CERTIFICATE', name: 'GOSI Certificate', short: 'G', color: '#1b6fb5' },
  { key: 'Chamber Of Commerce', name: 'Chamber of Commerce', short: 'CC', color: '#8a6d1a' },
  { key: 'VAT', name: 'VAT (ZATCA)', short: 'VAT', color: '#a3263c' },
]

export interface PortalAccount { portal: string; username: string; password: string; note?: string }

export const portalByKey = (key: string) => PORTALS.find(p => p.key === key)

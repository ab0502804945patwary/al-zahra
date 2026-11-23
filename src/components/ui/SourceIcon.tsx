import { Globe, Users, UserRound, Footprints, Share2, Mail, MoreHorizontal, Megaphone, Handshake } from 'lucide-react'
import { BRAND_ICONS } from '@/lib/brandIcons'

// lead source name (lower case) -> brand logo key, or a plain icon for sources that are not a brand
const BRAND: Record<string, keyof typeof BRAND_ICONS> = {
  facebook: 'facebook', whatsapp: 'whatsapp', 'google ads': 'googleads', google: 'googleads', instagram: 'instagram', tiktok: 'tiktok',
  youtube: 'youtube', telegram: 'telegram', snapchat: 'snapchat', x: 'x', twitter: 'x', gmail: 'gmail',
}
const PLAIN: Record<string, { icon: any; color: string }> = {
  website: { icon: Globe, color: '#3d5fab' },
  'social media': { icon: Share2, color: '#7c3aed' },
  referral: { icon: Handshake, color: '#0d9488' },
  agent: { icon: UserRound, color: '#b45309' },
  'walk-in': { icon: Footprints, color: '#475569' },
  email: { icon: Mail, color: '#dc2626' },
  other: { icon: MoreHorizontal, color: '#64748b' },
}

/** Logo for a lead source: the real brand logo (Facebook, WhatsApp, Google Ads…) or a clean icon in a tinted tile. */
export default function SourceIcon({ source, size = 18 }: { source?: string | null; size?: number }) {
  const key = String(source || '').trim().toLowerCase()
  const brand = BRAND[key] && BRAND_ICONS[BRAND[key]]
  if (brand) {
    return (
      <span className="inline-flex items-center justify-center shrink-0 rounded-md" style={{ width: size + 6, height: size + 6, background: `#${brand.hex}14` }} title={brand.title}>
        <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={brand.title} fill={`#${brand.hex}`}><path d={brand.path} /></svg>
      </span>
    )
  }
  const plain = PLAIN[key]
  const Icon = plain?.icon || (key ? Megaphone : Users)
  const color = plain?.color || '#64748b'
  return (
    <span className="inline-flex items-center justify-center shrink-0 rounded-md" style={{ width: size + 6, height: size + 6, background: `${color}14` }}>
      <Icon style={{ width: size - 3, height: size - 3, color }} />
    </span>
  )
}

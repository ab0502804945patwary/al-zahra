import { portalByKey } from '@/lib/portals'

/** Small logo for a portal: the image from public/portals when configured, otherwise a coloured badge. */
export default function PortalLogo({ portal, size = 32 }: { portal: string; size?: number }) {
  const p = portalByKey(portal)
  if (!p) return <span style={{ width: size, height: size }} className="inline-flex items-center justify-center rounded-lg bg-slate-200 text-slate-500 text-[10px] font-bold shrink-0">?</span>
  if (p.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.logo} alt={p.name} style={{ width: size, height: size }} className="object-contain rounded-md shrink-0" />
  }
  return (
    <span
      style={{ width: size, height: size, background: p.color, fontSize: Math.max(9, size * 0.34) }}
      className="inline-flex items-center justify-center rounded-lg text-white font-extrabold tracking-tight shrink-0"
      aria-label={p.name}
    >{p.short}</span>
  )
}

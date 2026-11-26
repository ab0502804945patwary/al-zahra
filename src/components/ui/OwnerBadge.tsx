'use client'
import { useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'

export interface Owner {
  name: string
  avatar_url?: string | null
  designation?: string | null
  department?: string | null
  email?: string | null
  phone?: string | null
  office_location?: string | null
}

function Photo({ owner, size }: { owner: Owner | null; size: string }) {
  if (owner?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={owner.avatar_url} alt="" className={`${size} rounded-full object-cover ring-1 ring-slate-200 shrink-0`} />
  }
  if (owner) return <span className={`${size} rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0`}>{owner.name.trim().charAt(0).toUpperCase()}</span>
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/al_zahra_icon.svg" alt="" className={`${size} rounded-full object-contain bg-white ring-1 ring-slate-200 p-0.5 shrink-0`} />
}

/** Narrow form of OwnerTag for tables: only the photo, the staff details open on hover (or tap). No person = AL ZAHRA. */
export default function OwnerBadge({ owner }: { owner: Owner | null }) {
  const [open, setOpen] = useState(false)
  const name = owner?.name || 'AL ZAHRA'
  const rows = owner
    ? [['Designation', owner.designation], ['Department', owner.department], ['Phone', owner.phone], ['E-mail', owner.email], ['Office', owner.office_location]].filter(r => r[1])
    : []

  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          {/* preventDefault keeps the tooltip from closing on click, so a tap on a phone opens it */}
          <button type="button" aria-label={`Registered by ${name}`} onClick={e => { e.preventDefault(); setOpen(true) }}
            className="inline-flex rounded-full align-middle focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <Photo owner={owner} size="w-7 h-7" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="right" sideOffset={8} collisionPadding={8} className="z-50 max-w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
            <div className="flex items-center gap-2.5">
              <Photo owner={owner} size="w-10 h-10" />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Registered by</div>
                <div className="font-semibold text-slate-900 break-words">{name}</div>
              </div>
            </div>
            {rows.length > 0 && (
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-slate-100 pt-2">
                {rows.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-slate-400">{label}</dt>
                    <dd className="text-slate-700 break-all">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

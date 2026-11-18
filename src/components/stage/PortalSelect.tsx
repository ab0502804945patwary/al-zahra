'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PORTALS, portalByKey } from '@/lib/portals'
import PortalLogo from './PortalLogo'

/** Dropdown that shows each portal's logo together with its name. */
export default function PortalSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const current = portalByKey(value)

  return (
    <div className="relative" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false) }}>
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-2 px-3 py-1.5 min-h-[38px] text-xs border border-slate-200 rounded-lg bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
        {current ? (
          <span className="flex items-center gap-2 min-w-0"><PortalLogo portal={current.key} size={22} /><span className="font-medium text-slate-800 truncate">{current.name}</span></span>
        ) : <span className="text-slate-400">Select portal...</span>}
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      {open && (
        <ul className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-72 overflow-y-auto">
          {PORTALS.map(p => (
            <li key={p.key}>
              <button type="button" onClick={() => { onChange(p.key); setOpen(false) }} className={`w-full flex items-center gap-3 px-3 py-2 text-left text-xs hover:bg-slate-50 ${p.key === value ? 'bg-blue-50' : ''}`}>
                <span className="w-14 flex justify-center shrink-0"><PortalLogo portal={p.key} size={26} /></span>
                <span className="font-medium text-slate-800">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

'use client'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

export interface MultiOption { value: string; label: string; group?: string }

/** Dropdown where one or more options can be ticked. Shows the picked ones as small tags. */
export default function MultiSelect({ options, value, onChange, placeholder = 'Select one or more...' }: {
  options: MultiOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  const picked = options.filter(o => value.includes(o.value))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full min-h-[34px] px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
      >
        <span className="flex flex-wrap gap-1 min-w-0">
          {picked.length === 0 && <span className="text-slate-400">{placeholder}</span>}
          {picked.map(o => (
            <span key={o.value} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-1.5 py-0.5 text-[11px] font-medium max-w-full">
              <span className="truncate">{o.label}</span>
              <span
                role="button"
                aria-label={`Remove ${o.label}`}
                onClick={e => { e.stopPropagation(); toggle(o.value) }}
                className="hover:text-rose-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </span>
            </span>
          ))}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-1 w-full bg-white border border-slate-200 rounded-lg max-h-56 overflow-y-auto py-1">
          {options.map((o, i) => {
            const on = value.includes(o.value)
            const heading = o.group && o.group !== options[i - 1]?.group
            return (
              <div key={o.value}>
              {heading && <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">{o.group}</div>}
              <button
                type="button"
                onClick={() => toggle(o.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left ${on ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                  {on && <Check className="w-3 h-3 text-white" />}
                </span>
                {o.label}
              </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

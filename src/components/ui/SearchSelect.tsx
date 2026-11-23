'use client'
import { useMemo, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

export interface SearchOption { value: string; label: string; hint?: string; keywords?: string }

/** Dropdown with a search box: type a name, a mobile number or an invoice number and the list shrinks. */
export default function SearchSelect({ value, onChange, options, placeholder = 'Select...', emptyLabel, className = '' }: {
  value: string
  onChange: (v: string) => void
  options: SearchOption[]
  placeholder?: string
  emptyLabel?: string // text for the "nothing selected" entry at the top (e.g. "All invoices")
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const current = options.find(o => o.value === value)
  const digits = (s: string) => s.replace(/\D/g, '')

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return options
    const td = digits(t).replace(/^0+/, '')
    return options.filter(o => {
      const hay = `${o.label} ${o.hint || ''} ${o.keywords || ''}`.toLowerCase()
      return hay.includes(t) || (td.length >= 3 && digits(hay).replace(/^0+/, '').includes(td))
    })
  }, [options, q])

  return (
    <div className="relative" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setOpen(false); setQ('') } }}>
      <button type="button" onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between gap-2 text-left ${className}`}>
        <span className={`truncate ${current ? 'text-slate-900' : 'text-slate-400'}`}>
          {current ? <>{current.label}{current.hint && <span className="text-slate-400"> {current.hint}</span>}</> : (emptyLabel || placeholder)}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, mobile, invoice no..." className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1 text-sm">
            {emptyLabel && !q && (
              <li><button type="button" onClick={() => { onChange(''); setOpen(false) }} className={`w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-500 ${!value ? 'bg-blue-50' : ''}`}>{emptyLabel}</button></li>
            )}
            {shown.map(o => (
              <li key={o.value}>
                <button type="button" onClick={() => { onChange(o.value); setOpen(false); setQ('') }} className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 hover:bg-slate-50 ${o.value === value ? 'bg-blue-50' : ''}`}>
                  <span className="truncate text-slate-800">{o.label}{o.hint && <span className="text-slate-400"> {o.hint}</span>}</span>
                  {o.value === value && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="px-3 py-4 text-center text-xs text-slate-400">Nothing matches “{q}”</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

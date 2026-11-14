'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { COUNTRY_LIST, countryCode, flagUrl } from '@/lib/countries'

export function Flag({ country, className = '' }: { country?: string | null; className?: string }) {
  const code = countryCode(country)
  if (!code) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl(code)}
      srcSet={`${flagUrl(code, 40)} 2x`}
      alt={code}
      width={20}
      height={15}
      className={`inline-block rounded-[2px] object-cover shrink-0 ${className}`}
    />
  )
}

export default function CountrySelect({
  value,
  onChange,
  required = false,
}: {
  value?: string
  onChange: (v: string) => void
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const list = COUNTRY_LIST.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="flex items-center gap-2 truncate">
          {value ? <><Flag country={value} />{value}</> : <span className="text-slate-400">Select country...</span>}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      {required && <input tabIndex={-1} required value={value || ''} onChange={() => {}} className="absolute inset-0 opacity-0 pointer-events-none" />}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg">
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search country..."
            className="w-full px-3 py-2 text-xs border-b border-slate-100 focus:outline-none"
          />
          <ul className="max-h-56 overflow-y-auto py-1">
            {list.length === 0 && <li className="px-3 py-2 text-xs text-slate-400">No match</li>}
            {list.map(c => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => { onChange(c.name); setOpen(false); setQ('') }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-slate-50 ${c.name === value ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                >
                  <Flag country={c.name} />{c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

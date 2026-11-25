'use client'
import { useMemo, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'

/** Text box with a suggestion list that opens right under it. Anything typed is kept as the value. */
export default function ComboInput({ value, onChange, options, placeholder, className, renderIcon, disabled = false, required = false }: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  className?: string
  /** optional small logo/icon drawn for the typed value and for each option */
  renderIcon?: (value: string) => React.ReactNode
  disabled?: boolean
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const q = value.trim().toLowerCase()
  const shown = useMemo(() => options.filter(o => !q || o.toLowerCase().includes(q)), [options, q])
  const isNew = q !== '' && !options.some(o => o.toLowerCase() === q)

  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        required={required}
        className={`${className || ''} pr-9 ${renderIcon ? 'pl-11' : ''} ${disabled ? 'bg-slate-50 cursor-not-allowed' : ''}`}
      />
      {renderIcon && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">{renderIcon(value)}</span>}
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      {open && (shown.length > 0 || isNew) && (
        <ul className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm">
          {isNew && (
            <li onMouseDown={e => { e.preventDefault(); setOpen(false) }} className="px-3 py-2 text-blue-700 bg-blue-50 cursor-pointer flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Use “{value.trim()}”
            </li>
          )}
          {shown.map(o => (
            <li key={o} onMouseDown={e => { e.preventDefault(); onChange(o); setOpen(false) }} className="px-3 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2.5">{renderIcon && renderIcon(o)}{o}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

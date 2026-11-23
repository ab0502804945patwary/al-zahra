'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface IconOption { value: string; label: string; icon?: React.ReactNode }

/**
 * Drop-down where every option has a small picture (brand icon, profile photo...).
 * The list is placed on top of the page so a table never clips it.
 */
export default function IconSelect({ value, onChange, options, placeholder = 'Select', emptyLabel, className = '' }: {
  value: string
  onChange: (v: string) => void
  options: IconOption[]
  placeholder?: string
  emptyLabel?: string // when set, the list starts with an entry that clears the choice
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const current = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (btn.current?.contains(e.target as Node) || list.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const hide = (e: Event) => { if (!list.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', () => setOpen(false))
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', hide, true)
    }
  }, [open])

  function toggle() {
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect()
      setPos({ left: r.left, top: r.bottom + 4, width: Math.max(r.width, 190) })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button ref={btn} type="button" onClick={toggle} className={`${className} flex items-center justify-between gap-2 text-left`}>
        <span className="flex items-center gap-2 min-w-0">
          {current ? <>{current.icon}<span className="truncate">{current.label}</span></> : value ? <span className="truncate">{value}</span> : <span className="text-slate-400">{placeholder}</span>}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>
      {open && pos && (
        <div ref={list} style={{ position: 'fixed', left: pos.left, top: pos.top, width: pos.width }} className="z-[70] bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto">
          {emptyLabel && (
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="w-full px-3 py-2 text-xs text-left text-slate-400 hover:bg-slate-50">{emptyLabel}</button>
          )}
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left ${o.value === value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {o.icon}<span className="truncate">{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

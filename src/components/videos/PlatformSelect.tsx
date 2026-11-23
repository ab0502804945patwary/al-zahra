'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import SourceIcon from '@/components/ui/SourceIcon'

/** Drop-down of fixed platforms, each with its real brand icon. The list is placed on top of the page so a table never clips it. */
export default function PlatformSelect({ value, onChange, options, className = '' }: { value: string; onChange: (v: string) => void; options: string[]; className?: string }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (btn.current?.contains(e.target as Node) || list.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const hide = () => setOpen(false)
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [open])

  function toggle() {
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect()
      setPos({ left: r.left, top: r.bottom + 4, width: Math.max(r.width, 170) })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button ref={btn} type="button" onClick={toggle} className={`${className} flex items-center justify-between gap-2 text-left`}>
        <span className="flex items-center gap-2 min-w-0">
          {value ? <><SourceIcon source={value} size={14} /><span className="truncate">{value}</span></> : <span className="text-slate-400">Select platform</span>}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>
      {open && pos && (
        <div ref={list} style={{ position: 'fixed', left: pos.left, top: pos.top, width: pos.width }} className="z-[70] bg-white border border-slate-200 rounded-lg shadow-lg py-1">
          {options.map(o => (
            <button
              key={o}
              type="button"
              onClick={() => { onChange(o); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left ${o === value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <SourceIcon source={o} size={16} />{o}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

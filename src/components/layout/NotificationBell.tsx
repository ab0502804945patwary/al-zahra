'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck } from 'lucide-react'
import type { AppNotification } from '@/lib/notifications'

const SEEN_KEY = 'alzahra_seen_notifications'
const POLL_MS = 20000

function beep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx()
    const play = (freq: number, start: number) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, ctx.currentTime + start)
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.25)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + start)
      o.stop(ctx.currentTime + start + 0.3)
    }
    play(880, 0)
    play(1175, 0.18)
    setTimeout(() => ctx.close(), 800)
  } catch {}
}

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')
  } catch {
    return []
  }
}

export default function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [seen, setSeen] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const known = useRef<Set<string> | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const { items: next } = (await res.json()) as { items: AppNotification[] }
      const prev = known.current
      // sound only for items that appeared after the first load and were never marked read
      if (prev && next.some(n => !prev.has(n.key) && !readSeen().includes(n.key))) beep()
      known.current = new Set(next.map(n => n.key))
      setItems(next)
    } catch {}
  }, [])

  useEffect(() => {
    setSeen(readSeen())
    load()
    const t = setInterval(load, POLL_MS)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', onFocus)
    }
  }, [load])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const unread = items.filter(n => !seen.includes(n.key))

  function markAll() {
    const next = Array.from(new Set([...seen, ...items.map(n => n.key)]))
    setSeen(next)
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(next))
    } catch {}
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <span className="text-xs font-bold text-slate-800">Notifications</span>
            {unread.length > 0 && (
              <button onClick={markAll} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1">
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 && <li className="px-4 py-6 text-center text-xs text-slate-400">No pending work</li>}
            {items.map(n => {
              const isNew = !seen.includes(n.key)
              return (
                <li key={n.key}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="flex gap-2.5 px-4 py-3 hover:bg-slate-50">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isNew ? 'bg-rose-500' : 'bg-slate-200'}`} />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-slate-800">{n.message}</span>
                      <span className="block text-[11px] text-slate-400">{n.stageLabel}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState } from 'react'
import { BellRing, Copy, Mail, MessageCircle, Phone, Send, Smartphone, X } from 'lucide-react'
import { Company } from '@/lib/types'
import { Channel, Lang, PILLARS, Pillar, StateRow, buildMessage, daysText, phoneOf, sendLink, serviceOf } from './renewalHubShared'

interface Props {
  /** one company, or several for a batch reminder */
  companies: Company[]
  focus: Pillar | null
  rows: Map<string, StateRow>
  onSent: (company: Company, picked: Pillar[], channel: Channel, lang: Lang) => void
  onClose: () => void
}

const CHANNELS: { key: Channel; icon: typeof Mail }[] = [
  { key: 'WhatsApp', icon: MessageCircle },
  { key: 'Email', icon: Mail },
  { key: 'SMS', icon: Smartphone },
]

export default function RenewalNotifyDrawer({ companies, focus, rows, onSent, onClose }: Props) {
  const bulk = companies.length > 1
  const first = companies[0]
  const [picked, setPicked] = useState<Pillar[]>(() => {
    if (focus) return [focus]
    if (bulk) return PILLARS.map(p => p.key)
    const near = PILLARS.filter(p => { const s = serviceOf(first, p, rows); return s.days !== null && s.days <= 60 }).map(p => p.key)
    return near.length ? near : ['misa']
  })
  const [channel, setChannel] = useState<Channel>('WhatsApp')
  const [lang, setLang] = useState<Lang>('en')
  const [edited, setEdited] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState<string[]>([])

  // a new choice of services or language writes the message again
  function rewrite() { setEdited(null); setCopied(false) }

  const messageFor = (c: Company) => (!bulk && edited !== null ? edited : buildMessage(c, picked, lang, rows))
  const message = messageFor(first)

  function send(c: Company) {
    const href = sendLink(c, channel, messageFor(c))
    if (!href) return
    if (channel === 'WhatsApp') window.open(href, '_blank', 'noopener,noreferrer')
    else window.location.assign(href)
    onSent(c, picked, channel, lang)
    setDone(prev => [...prev, c.id])
    if (!bulk) onClose()
  }

  async function copy() {
    try { await navigator.clipboard.writeText(message); setCopied(true) } catch { alert('Could not copy the message') }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/45" onClick={onClose}>
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center"><BellRing className="w-5 h-5" /></span>
            <div>
              <h2 className="text-base font-bold text-slate-800">Notify Client</h2>
              <p className="text-xs text-slate-500 font-medium">{bulk ? `Batch reminder (${companies.length} companies)` : `${first.company_name} • ${first.company_id}`}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {!bulk && (
            <div className="bg-[#eff6ff]/70 border border-[#bfdbfe]/70 rounded-2xl p-4 space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PILLARS.map(p => (
                  <div key={p.key}>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">{p.refPrefix}</span>
                    <span className="font-bold text-slate-800 font-mono">{p.ref(first) || '—'}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[#bfdbfe]/70 flex flex-wrap justify-between gap-2 text-slate-700 font-semibold">
                <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-600" />{phoneOf(first) || 'No phone saved'}</span>
                <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#2563eb]" />{first.official_email || 'No email saved'}</span>
              </div>
            </div>
          )}

          <div>
            <div className="font-bold text-slate-700 mb-2">Services Included in Reminder</div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {PILLARS.map(p => {
                const s = bulk ? null : serviceOf(first, p, rows)
                return (
                  <label key={p.key} className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-[#93c5fd] cursor-pointer">
                    <input type="checkbox" checked={picked.includes(p.key)} onChange={e => { const on = e.target.checked; setPicked(prev => (on ? [...prev, p.key] : prev.filter(k => k !== p.key))); rewrite() }} className="mt-0.5 w-4 h-4" />
                    <span>
                      <span className="font-bold text-slate-800 block">{p.n}. {p.label}</span>
                      <span className="text-[11px] text-slate-500">{!s ? 'Filled per company' : s.date ? `${s.date} · ${daysText(s.days ?? 0)}` : 'No date saved'}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <span className="block font-bold text-slate-700 mb-1.5">Delivery Channel</span>
              <div className="grid grid-cols-3 gap-1.5">
                {CHANNELS.map(ch => (
                  <button key={ch.key} type="button" onClick={() => setChannel(ch.key)} className={`flex items-center justify-center gap-1 py-2 rounded-xl border-2 text-[11px] font-bold ${channel === ch.key ? 'border-[#1e3a8a] bg-[#eff6ff] text-[#1e3a8a]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <ch.icon className="w-3.5 h-3.5" />{ch.key}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="block font-bold text-slate-700 mb-1.5">Template Language</span>
              <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
                {([['en', 'English'], ['bn', 'Bangla'], ['ar', 'Arabic']] as const).map(([k, label]) => (
                  <button key={k} type="button" onClick={() => { setLang(k); rewrite() }} className={`py-1.5 rounded-lg font-semibold ${lang === k ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-600'}`}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {bulk ? (
            <div>
              <div className="font-bold text-slate-700 mb-1">Send one by one</div>
              <p className="text-slate-500 mb-2">Each button opens {channel} with that company&apos;s message. Press send there.</p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {companies.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="font-semibold text-slate-800">{c.company_id} · {c.company_name}</span>
                    {sendLink(c, channel, 'x')
                      ? <button type="button" onClick={() => send(c)} className="px-3 py-1.5 rounded-lg bg-[#1e3a8a] text-white font-semibold shrink-0">{done.includes(c.id) ? 'Open again' : 'Open'}</button>
                      : <span className="text-slate-400 shrink-0">No contact saved</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-700">Message Preview</span>
                <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1d4ed8] hover:underline"><Copy className="w-3 h-3" />{copied ? 'Copied' : 'Copy Message'}</button>
              </div>
              <textarea value={message} onChange={e => setEdited(e.target.value)} dir={lang === 'ar' ? 'rtl' : 'ltr'} rows={11} aria-label="Message" className="w-full p-3.5 leading-relaxed text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]" />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5 text-xs">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/70">{bulk ? 'Close' : 'Cancel'}</button>
          {!bulk && (
            <button type="button" onClick={() => send(first)} disabled={!sendLink(first, channel, 'x') || !picked.length} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white disabled:opacity-40">
              <Send className="w-3.5 h-3.5" />Send &amp; Log Notification
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

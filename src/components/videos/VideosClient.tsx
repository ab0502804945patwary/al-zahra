'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Download, ExternalLink, FileText, Loader2, Pencil, Plus, Printer, Trash2, Video, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ComboInput from '@/components/ui/ComboInput'
import SourceIcon from '@/components/ui/SourceIcon'
import IconSelect from '@/components/ui/IconSelect'
import Avatar from '@/components/ui/Avatar'
import { useSecureDelete } from '@/components/ui/useSecureDelete'
import { matchesQuery } from '@/lib/search'

export interface VideoRow {
  id: string; posted_on: string; publish_date?: string | null; posted_time?: string | null; channel_name?: string | null; headline?: string | null; platform: string
  employee_name?: string | null; video_creator?: string | null; url?: string | null
}

// the four platforms used for videos
const PLATFORMS = ['TikTok', 'Facebook', 'YouTube', 'Instagram']
const inputCls = 'w-full px-2.5 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400'
const sel = 'px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500'

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const nowTime = () => new Date().toTimeString().slice(0, 5)
const dmy = (d?: string | null) => (d ? d.split('-').reverse().join('-') : '—')
const ampm = (t?: string | null) => {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  return `${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

type Draft = { posted_on: string; publish_date: string; posted_time: string; channel_name: string; headline: string; platform: string; employee_name: string; video_creator: string; url: string }

export default function VideosClient({ videos, staff, meName }: { videos: VideoRow[]; staff: { name: string; avatar: string | null }[]; meName: string }) {
  const router = useRouter()
  const supabase = createClient()
  const { askDelete, dialog } = useSecureDelete()

  const [employee, setEmployee] = useState('')
  const [editor, setEditor] = useState('')
  const [platform, setPlatform] = useState('')
  const [channel, setChannel] = useState('')
  const [month, setMonth] = useState(today().slice(0, 7))
  const [last7, setLast7] = useState(false)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<string | null>(null) // 'new' or a row id
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const channels = useMemo(() => [...new Set(videos.map(v => v.channel_name).filter(Boolean) as string[])].sort(), [videos])
  const avatarOf = useMemo(() => new Map(staff.map(x => [x.name, x.avatar] as const)), [staff])
  const people = useMemo(() => [...new Set([...staff.map(x => x.name), ...videos.flatMap(v => [v.employee_name, v.video_creator]).filter(Boolean) as string[]])].sort(), [staff, videos])
  const personOptions = useMemo(() => people.map(n => ({ value: n, label: n, icon: <Avatar name={n} src={avatarOf.get(n)} size={20} /> })), [people, avatarOf])
  const who = (n?: string | null) => n ? <span title={n} aria-label={n} role="img" className="inline-flex cursor-default"><Avatar name={n} src={avatarOf.get(n)} size={28} /></span> : <>—</>

  const sevenAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) })()
  const rows = useMemo(() => videos.filter(v =>
    (!employee || v.employee_name === employee) &&
    (!editor || v.video_creator === editor) &&
    (!platform || v.platform === platform) &&
    (!channel || v.channel_name === channel) &&
    (last7 ? v.posted_on >= sevenAgo : (!month || v.posted_on.startsWith(month))) &&
    matchesQuery(search, 0, [v.channel_name, v.headline, v.platform, v.employee_name, v.video_creator, v.url])
  ), [videos, employee, editor, platform, channel, month, last7, search, sevenAgo])

  const byPlatform = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of rows) m.set(v.platform, (m.get(v.platform) || 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  function startNew() {
    setError('')
    setDraft({ posted_on: today(), publish_date: today(), posted_time: nowTime(), channel_name: '', headline: '', platform: '', employee_name: meName, video_creator: meName, url: '' })
    setEditing('new')
  }
  function startEdit(v: VideoRow) {
    setError('')
    setDraft({ posted_on: v.posted_on, publish_date: v.publish_date || '', posted_time: (v.posted_time || '').slice(0, 5), channel_name: v.channel_name || '', headline: v.headline || '', platform: v.platform, employee_name: v.employee_name || '', video_creator: v.video_creator || '', url: v.url || '' })
    setEditing(v.id)
  }
  function cancel() { setEditing(null); setDraft(null); setError('') }

  async function save() {
    if (!draft) return
    setError('')
    if (!draft.platform.trim()) return setError('Choose the platform')
    if (!draft.posted_on) return setError('Choose the editing date')
    if (draft.url.trim() && !/^https?:\/\/\S+$/i.test(draft.url.trim())) return setError('The URL must start with http:// or https://')
    setSaving(true)
    const row = {
      posted_on: draft.posted_on, publish_date: draft.publish_date || null, posted_time: draft.posted_time || null, channel_name: draft.channel_name.trim() || null, headline: draft.headline.trim() || null, platform: draft.platform.trim(),
      employee_name: draft.employee_name || null, video_creator: draft.video_creator || null, url: draft.url.trim() || null, updated_at: new Date().toISOString(),
    }
    const { error: err } = editing === 'new' ? await supabase.from('videos').insert([row]) : await supabase.from('videos').update(row).eq('id', editing!)
    setSaving(false)
    if (err) return setError(err.message)
    cancel()
    router.refresh()
  }

  async function remove(v: VideoRow) {
    if (!(await askDelete('videos', v.id, 'this video entry'))) return
    router.refresh()
  }

  function csv() {
    const esc = (x: unknown) => `"${String(x ?? '').replace(/"/g, '""')}"`
    const lines = [['SL', 'Editing Date', 'Publish Date', 'Publish Time', 'Channel', 'Headline', 'Platform', 'Video Creator', 'Video Editor', 'URL'].map(esc).join(',')]
    rows.forEach((v, i) => lines.push([i + 1, dmy(v.posted_on), dmy(v.publish_date), ampm(v.posted_time), v.channel_name, v.headline, v.platform, v.employee_name, v.video_creator, v.url].map(esc).join(',')))
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `video-report-${last7 ? 'last-7-days' : month || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function printReport() {
    const w = window.open('', '_blank')
    if (!w) return
    const picked = [platform, channel, employee && `Creator: ${employee}`, editor && `Editor: ${editor}`].filter(Boolean).map(x => ' — ' + x).join('')
    const title = `Video report — ${last7 ? 'last 7 days' : month || 'all'}${picked}`
    const esc = (x: unknown) => String(x ?? '—').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
      body{font-family:Arial,sans-serif;padding:24px;color:#0f172a} h1{font-size:18px;margin:0 0 4px} p{margin:0 0 14px;color:#475569;font-size:12px}
      table{border-collapse:collapse;width:100%;font-size:12px} th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left} th{background:#f1f5f9}
      .sum{margin:0 0 14px;font-size:12px}</style></head><body>
      <h1>AL ZAHRA Consultancy — ${esc(title)}</h1><p>Total videos: ${rows.length}</p>
      <div class="sum">${byPlatform.map(([p, n]) => `${esc(p)}: <b>${n}</b>`).join(' &nbsp;·&nbsp; ')}</div>
      <table><thead><tr><th>SL</th><th>Editing Date</th><th>Publish Date</th><th>Publish Time</th><th>Channel</th><th>Headline</th><th>Platform</th><th>Video Creator</th><th>Video Editor</th><th>URL</th></tr></thead><tbody>
      ${rows.map((v, i) => `<tr><td>${i + 1}</td><td>${dmy(v.posted_on)}</td><td>${dmy(v.publish_date)}</td><td>${ampm(v.posted_time)}</td><td>${esc(v.channel_name)}</td><td>${esc(v.headline)}</td><td>${esc(v.platform)}</td><td>${esc(v.employee_name)}</td><td>${esc(v.video_creator)}</td><td>${esc(v.url)}</td></tr>`).join('')}
      </tbody></table><script>window.onload=function(){window.print()}</script></body></html>`)
    w.document.close()
  }

  const set = (k: keyof Draft, v: string) => setDraft(d => (d ? { ...d, [k]: v } : d))

  const editorRow = (key: string, no: string) => draft && (
    <tr key={key} className="bg-blue-50/40 align-top">
      <td className="px-2 py-2 text-slate-500">{no}</td>
      <td className="px-2 py-2"><input type="date" aria-label="Editing date" value={draft.posted_on} onChange={e => set('posted_on', e.target.value)} className={inputCls} /></td>
      <td className="px-2 py-2"><input type="date" aria-label="Publish date" value={draft.publish_date} onChange={e => set('publish_date', e.target.value)} className={inputCls} /></td>
      <td className="px-2 py-2"><input type="time" aria-label="Publish time" value={draft.posted_time} onChange={e => set('posted_time', e.target.value)} className={inputCls} /></td>
      <td className="px-2 py-2 min-w-[150px]"><ComboInput value={draft.channel_name} onChange={v => set('channel_name', v)} options={channels} className={inputCls} placeholder="Channel name" /></td>
      <td className="px-2 py-2 min-w-[200px]"><input aria-label="Headline" value={draft.headline} onChange={e => set('headline', e.target.value)} placeholder="Video headline" className={inputCls} /></td>
      <td className="px-2 py-2 min-w-[150px]"><IconSelect value={draft.platform} onChange={v => set('platform', v)} placeholder="Select platform" options={(draft.platform && !PLATFORMS.includes(draft.platform) ? [...PLATFORMS, draft.platform] : PLATFORMS).map(p => ({ value: p, label: p, icon: <SourceIcon source={p} size={16} /> }))} className={`${inputCls} bg-white`} /></td>
      <td className="px-2 py-2 min-w-[170px]"><IconSelect value={draft.employee_name} onChange={v => set('employee_name', v)} placeholder="Select creator" emptyLabel="—" options={personOptions} className={`${inputCls} bg-white`} /></td>
      <td className="px-2 py-2 min-w-[170px]"><IconSelect value={draft.video_creator} onChange={v => set('video_creator', v)} placeholder="Select editor" emptyLabel="—" options={personOptions} className={`${inputCls} bg-white`} /></td>
      <td className="px-2 py-2 min-w-[190px]"><input value={draft.url} onChange={e => set('url', e.target.value)} placeholder="https://..." className={inputCls} /></td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1.5">
          <button onClick={save} disabled={saving} title="Save" className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-60">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}</button>
          <button onClick={cancel} title="Cancel" className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-md"><X className="w-3.5 h-3.5" /></button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="w-full max-w-[1500px] mx-auto space-y-4">
      {dialog}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><Video className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Video Management</h1>
            <p className="text-xs text-slate-500">Who posted which video, on which channel and platform</p>
          </div>
        </div>
        <button onClick={startNew} disabled={editing !== null} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-sm">
          <Plus className="w-4 h-4" /> Add Video
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search channel, headline, name, URL..." className={`${sel} w-64`} />
        <div className="w-44"><IconSelect value={platform} onChange={setPlatform} placeholder="All platforms" emptyLabel="All platforms" options={[...new Set([...PLATFORMS, ...videos.map(v => v.platform)])].map(p => ({ value: p, label: p, icon: <SourceIcon source={p} size={16} /> }))} className={`${sel} w-full`} /></div>
        <select value={channel} onChange={e => setChannel(e.target.value)} aria-label="Channel name" className={`${sel} w-48`}>
          <option value="">All channels</option>
          {channels.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="w-52"><IconSelect value={employee} onChange={setEmployee} placeholder="All video creators" emptyLabel="All video creators" options={personOptions} className={`${sel} w-full`} /></div>
        <div className="w-52"><IconSelect value={editor} onChange={setEditor} placeholder="All video editors" emptyLabel="All video editors" options={personOptions} className={`${sel} w-full`} /></div>
        <input type="month" value={month} disabled={last7} onChange={e => setMonth(e.target.value)} className={`${sel} disabled:opacity-50`} />
        <button onClick={() => setLast7(v => !v)} className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border ${last7 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
          7 Day Report
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={csv} disabled={!rows.length} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"><Download className="w-3.5 h-3.5" /> Excel (CSV)</button>
          <button onClick={printReport} disabled={!rows.length} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"><Printer className="w-3.5 h-3.5" /> Generate Report</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">{rows.length} video{rows.length === 1 ? '' : 's'}</span>
        {byPlatform.map(([p, n]) => (
          <span key={p} className="inline-flex items-center gap-1.5 pr-2.5 pl-1 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium">
            <SourceIcon source={p} size={14} />{p} <b>{n}</b>
          </span>
        ))}
      </div>

      {error && <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs min-w-[1250px]">
          <thead className="bg-slate-50 text-slate-600 text-[11px] tracking-wide">
            <tr>{['SL No', 'Editing Date', 'Publish Date', 'Publish Time', 'Channel Name', 'Headline', 'Platform', 'Video Creator', 'Video Editor', 'URL Address', 'Action'].map(h => <th key={h} className="text-left font-semibold px-3 py-3 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {editing === 'new' && editorRow('new', '+')}
            {rows.map((v, i) => editing === v.id ? editorRow(v.id, String(i + 1)) : (
              <tr key={v.id} className="hover:bg-slate-50/70">
                <td className="px-3 py-3 text-slate-500">{i + 1}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-800">{dmy(v.posted_on)}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-800">{dmy(v.publish_date)}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-600">{ampm(v.posted_time)}</td>
                <td className="px-3 py-3 text-slate-900 font-medium">{v.channel_name || '—'}</td>
                <td className="px-3 py-3 text-slate-700 min-w-[200px] max-w-[320px] break-words">{v.headline || '—'}</td>
                <td className="px-3 py-3"><span title={v.platform} aria-label={v.platform} role="img" className="inline-flex cursor-default"><SourceIcon source={v.platform} size={24} /></span></td>
                <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{who(v.employee_name)}</td>
                <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{who(v.video_creator)}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {v.url ? <a href={v.url} target="_blank" rel="noopener noreferrer" title={v.url} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100"><ExternalLink className="w-3 h-3" />View video</a> : '—'}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => startEdit(v)} disabled={editing !== null} title="Edit" className="p-1.5 border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-40"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(v)} disabled={editing !== null} title="Delete" className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && editing !== 'new' && (
              <tr><td colSpan={11} className="text-center py-14 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />No videos for this selection. Click “Add Video”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

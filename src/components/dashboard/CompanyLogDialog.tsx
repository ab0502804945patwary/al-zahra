'use client'
import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Loader2, X } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import { STAGE_CONFIG, MENU_ORDER, phaseOf } from '@/lib/stageData'
import { formatDate } from '@/lib/utils'
import type { WorkflowPeople } from '@/lib/workflowPeople'

export interface LogStage { status: string; label: string; days?: number; from?: string | null; to?: string | null }

const ACTIONS: Record<string, string> = {
  started: 'started the work', completed: 'completed it', reopened: 'moved it back to Pending', status: 'changed the status', files: 'changed the files', updated: 'edited the record', deleted: 'deleted the record',
}
const NOT_APPLICABLE = ['N/A', 'Removed', '—']
export const KIND_TEXT = { worked: 'Worked on it', assigned: 'Assigned', access: 'Has access to this phase' }

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Riyadh', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const daysSince = (d: string) => Math.max(0, Math.round((Date.parse(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })) - Date.parse(d.slice(0, 10))) / 86400000))
const dayWord = (n: number) => `${n} day${n === 1 ? '' : 's'}`
const phaseName = (n: number) => STAGE_CONFIG[String(n)]?.label || `Phase ${n}`

type Mood = 'done' | 'late' | 'open'
// colour is used only for the small dot and the status word
const MOOD = {
  done: { dot: 'bg-emerald-500', text: 'text-emerald-600' },
  late: { dot: 'bg-rose-500', text: 'text-rose-600' },
  open: { dot: 'bg-white border-2 border-blue-600', text: 'text-slate-500' },
} as const

/** Everything about the progress of one company: where it is, since when, who, and what was done. */
export default function CompanyLogDialog({ company, stages, team, onClose }: {
  company: { company_id: string; company_name: string }
  stages: Record<number, LogStage>
  team: WorkflowPeople
  onClose: () => void
}) {
  const [tab, setTab] = useState<'timeline' | 'history'>('timeline')
  const [log, setLog] = useState<any[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    createClient().from('workflow_log').select('*').eq('company_id', company.company_id).order('created_at', { ascending: false }).limit(200)
      // before db/workflow-log.sql has been run the table is simply not there yet
      .then(({ data, error: err }) => { if (err && err.code !== 'PGRST205') setError('Could not load the history: ' + err.message); setLog(data || []) })
  }, [company.company_id])

  const cells = team.cells[company.company_id] || {}
  const list = MENU_ORDER.map(Number).filter(n => !NOT_APPLICABLE.includes(stages[n]?.label))
  const started = (n: number) => !!stages[n] && stages[n].status !== 'Not Started'
  const isDone = (n: number) => (n === 8 ? !!stages[n]?.to : stages[n]?.label === 'Complete')
  const mood = (n: number): Mood => (stages[n].status === 'Red' ? 'late' : isDone(n) ? 'done' : 'open')
  // what happened, oldest first; the rest in workflow order
  const happened = list.filter(started).sort((a, b) => String(stages[a].from || '9').localeCompare(String(stages[b].from || '9')))
  const waiting = list.filter(n => !started(n))
  const done = list.filter(isDone).length
  const running = happened.filter(n => !isDone(n)).length
  const percent = list.length ? Math.round((done / list.length) * 100) : 0

  const statusText = (n: number) => {
    if (isDone(n)) return 'Complete'
    // a name clearance without an approval date has no validity to count yet
    if (n === 8) return stages[n].label === 'Expired' ? 'Expired' : 'Waiting for approval'
    return stages[n].label
  }

  const faces = (n: number) => {
    const cell = cells[n]
    if (!cell) return null
    const names = cell.ids.map(id => team.people[id].name)
    return (
      <div title={`${KIND_TEXT[cell.kind]}: ${names.join(', ')}`} className="flex items-center shrink-0 cursor-default">
        <div className="flex -space-x-1.5">
          {cell.ids.slice(0, 3).map(id => <span key={id} className="rounded-full ring-2 ring-white"><Avatar name={team.people[id].name} src={team.people[id].avatar} size={26} /></span>)}
        </div>
        {names.length > 3 && <span className="ml-1 text-[11px] text-slate-400">+{names.length - 3}</span>}
      </div>
    )
  }

  return (
    <Dialog.Root open onOpenChange={o => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" />
        <Dialog.Content aria-describedby={undefined} className="fixed z-50 inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[min(640px,calc(100vw-2rem))] sm:max-h-[min(760px,90vh)] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden focus:outline-none">
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-[15px] font-semibold text-slate-900 leading-snug break-words">{company.company_name}</Dialog.Title>
                <p className="mt-0.5 text-xs text-slate-400">{company.company_id}</p>
              </div>
              <Dialog.Close title="Close" className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X className="w-4 h-4" /></Dialog.Close>
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} /></div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span><b className="text-slate-800">{done}</b> complete · <b className="text-slate-800">{running}</b> running · <b className="text-slate-800">{waiting.length}</b> not started</span>
              <b className="text-slate-800">{percent}%</b>
            </div>
          </div>

          <div className="flex gap-5 px-6 border-b border-slate-100">
            {([['timeline', 'Timeline'], ['history', `History${log?.length ? ` (${log.length})` : ''}`]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`py-2.5 text-xs font-semibold border-b-2 -mb-px ${tab === k ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>{label}</button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {tab === 'timeline' ? (<>
              {!happened.length && <p className="text-xs text-slate-400">No phase has started yet.</p>}
              <ol>
                {happened.map((n, i) => {
                  const s = stages[n]
                  const m = MOOD[mood(n)]
                  const open = !isDone(n) && s.from
                  const time = open ? `${dayWord(daysSince(s.from!))} running` : s.days != null ? `took ${dayWord(s.days)}` : ''
                  return (
                    <li key={n} className="relative flex gap-3.5">
                      {i < happened.length - 1 && <span className="absolute left-[5px] top-6 -bottom-3 w-px bg-slate-200" />}
                      <span className={`relative mt-[18px] w-[11px] h-[11px] rounded-full shrink-0 ${m.dot}`} />
                      <div className={`min-w-0 flex-1 flex items-center gap-3 py-3 ${i < happened.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-slate-900 leading-snug"><span className="text-slate-400 mr-1.5">P{phaseOf(n)}</span>{phaseName(n)}</div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            <span className={`font-semibold ${m.text}`}>{statusText(n)}</span>
                            {' · '}{s.from ? formatDate(s.from) : '—'}{isDone(n) && s.to && s.to !== s.from ? ` → ${formatDate(s.to)}` : ''}
                            {time && ` · ${time}`}
                          </div>
                        </div>
                        {faces(n)}
                      </div>
                    </li>
                  )
                })}
              </ol>

              {waiting.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-[11px] font-semibold text-slate-400 mb-2">Still to do</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {waiting.map(n => (
                      <span key={n} className="px-2.5 py-1 rounded-full bg-slate-50 text-[11px] text-slate-500"><b className="mr-1 text-slate-400">P{phaseOf(n)}</b>{phaseName(n)}</span>
                    ))}
                  </div>
                </div>
              )}
            </>) : (<>
              {error && <p className="text-xs text-rose-700">{error}</p>}
              {!log && <p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</p>}
              {log && !log.length && !error && <p className="text-xs text-slate-400">Nothing recorded yet. Work done from now on appears here.</p>}
              <ul>
                {(log || []).map(l => {
                  const who = l.user_id ? team.people[l.user_id] : null
                  return (
                    <li key={l.id} className="flex items-start gap-2.5 py-2.5 border-b border-slate-100 text-xs">
                      <Avatar name={who?.name || '?'} src={who?.avatar} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="text-slate-800"><b>{who?.name || 'Unknown'}</b> {ACTIONS[l.action] || l.action}{l.detail ? `: ${l.detail}` : ''}</div>
                        <div className="text-[11px] text-slate-400">Phase {phaseOf(Number(l.stage))} · {phaseName(Number(l.stage))}</div>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">{when(l.created_at)}</span>
                    </li>
                  )
                })}
              </ul>
            </>)}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

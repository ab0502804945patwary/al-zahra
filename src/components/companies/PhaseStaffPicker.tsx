'use client'
import { useEffect, useState } from 'react'
import MultiSelect from '@/components/ui/MultiSelect'
import { MENU_ORDER, STAGE_CONFIG } from '@/lib/stageData'
import { OTHERS_REQUIRED_PHASE } from '@/lib/stageRules'

export interface StaffOption { id: string; name: string; stages: number[] | null }

/** Staff list for the pickers; null while loading. */
export function useStaffOptions(enabled: boolean) {
  const [staff, setStaff] = useState<StaffOption[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!enabled || staff) return
    let alive = true
    fetch('/api/stage/staff')
      .then(async res => {
        const out = await res.json().catch(() => ({} as any))
        if (!res.ok || !out.staff) throw new Error(out.error || 'Could not load the staff list.')
        if (alive) { setError(''); setStaff(out.staff) }
      })
      .catch(e => { if (alive) setError(e?.message || 'Cannot reach the server.') })
    return () => { alive = false }
  }, [enabled, staff])
  return { staff, error }
}

export const canWork = (s: StaffOption, stageId: string) => s.stages === null || s.stages.includes(Number(stageId))

/** "Others Service": tick the phases this company needs and pick who does each one. */
export default function PhaseStaffPicker({ phases, onPhases, value, onChange, staff, error }: {
  phases: string[]; onPhases: (p: string[]) => void
  value: Record<string, string[]>; onChange: (v: Record<string, string[]>) => void
  staff: StaffOption[] | null; error: string
}) {
  const all = MENU_ORDER.filter(id => STAGE_CONFIG[id])
  const isOn = (id: string) => id === OTHERS_REQUIRED_PHASE || phases.includes(id)
  const allOn = all.every(isOn)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-semibold text-slate-700">Phases and staff <span className="font-normal text-slate-400">— work goes only to the ticked phases, and only the picked staff (and admins) see it.</span></span>
        <button type="button" onClick={() => onPhases(allOn ? [OTHERS_REQUIRED_PHASE] : all)} className="text-[11px] font-semibold text-blue-700 hover:underline">{allOn ? 'Clear all' : 'Select all'}</button>
      </div>
      {error && <div className="mb-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{error}</div>}
      <div className="space-y-2">
        {all.map(id => {
          const must = id === OTHERS_REQUIRED_PHASE
          const on = isOn(id)
          const picked = value[id] || []
          const options = (staff || []).filter(s => canWork(s, id) || picked.includes(s.id))
            .map(s => ({ value: s.id, label: canWork(s, id) ? s.name : `${s.name} (no access now)` }))
          return (
            <div key={id} className={`grid grid-cols-1 md:grid-cols-2 gap-2 items-start px-3 py-2 rounded-lg border ${on ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
              <label className={`flex items-center gap-2.5 py-1.5 ${must ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input type="checkbox" checked={on} disabled={must} className="accent-blue-600 w-4 h-4 shrink-0"
                  onChange={() => onPhases(on ? phases.filter(x => x !== id) : [...phases, id])} />
                <span className={`text-xs font-semibold ${on ? 'text-blue-700' : 'text-slate-700'}`}>{STAGE_CONFIG[id].label}{must && <span className="ml-1.5 text-[10px] font-semibold text-rose-600">Required</span>}</span>
              </label>
              {on && (
                <MultiSelect options={options} value={picked} onChange={next => onChange({ ...value, [id]: next })}
                  placeholder={staff ? (options.length ? 'Select staff...' : 'No staff has access to this phase') : 'Loading staff...'} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

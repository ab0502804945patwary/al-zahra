'use client'
import { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, KeyRound } from 'lucide-react'
import type { PortalAccount } from '@/lib/portals'
import PortalSelect from './PortalSelect'

const NAFATH = 'Login with Nafath'

const cls = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

export default function PortalAccountsEditor({ value, onChange }: { value: PortalAccount[]; onChange: (v: PortalAccount[]) => void }) {
  const [shown, setShown] = useState<Record<number, boolean>>({})
  const [suggest, setSuggest] = useState<number | null>(null) // which line shows the Nafath suggestion
  const update = (i: number, patch: Partial<PortalAccount>) => onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-blue-600" />
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Portal Accounts</h3>
          <p className="text-[11px] text-slate-500">Pick a portal, write its user name and password. Add one line per portal. A PDF for the client can be downloaded after saving.</p>
        </div>
      </div>

      {value.map((r, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-2 items-start bg-white border border-slate-200 rounded-lg p-2.5">
          <PortalSelect value={r.portal} onChange={v => update(i, { portal: v })} />
          <input value={r.username} onChange={e => update(i, { username: e.target.value })} placeholder="User name / ID" autoComplete="off" className={cls} />
          <div className="relative">
            <input type={shown[i] || r.password === NAFATH ? 'text' : 'password'} value={r.password} onChange={e => update(i, { password: e.target.value })} onFocus={() => setSuggest(i)} onBlur={() => setSuggest(null)} placeholder="Password" autoComplete="new-password" className={`${cls} pr-9`} />
            {suggest === i && r.password !== NAFATH && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                <button type="button" onMouseDown={e => { e.preventDefault(); update(i, { password: NAFATH }); setSuggest(null) }} className="w-full text-left px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5" /> {NAFATH}
                </button>
              </div>
            )}
            <button type="button" onClick={() => setShown(s => ({ ...s, [i]: !s[i] }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {shown[i] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} title="Remove this line" className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}

      <button type="button" onClick={() => onChange([...value, { portal: '', username: '', password: '' }])} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">
        <Plus className="w-3.5 h-3.5" /> Add {value.length ? 'another' : 'a'} portal
      </button>
    </div>
  )
}

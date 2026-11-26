'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { Check, Loader2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { triggerPush } from '@/lib/pushClient'
import { OTHERS_SERVICE } from '@/lib/stageRules'
import OwnerBadge, { OwnerPhoto, type Owner } from '@/components/ui/OwnerBadge'

/** "Assigned" data of one phase page. */
export interface Assignments {
  /** company_id -> auth user ids */
  assigned: Record<string, string[]>
  /** details of the staff that can be shown (everyone for an admin, only assigned colleagues otherwise) */
  people: Record<string, Owner>
  /** admin only: staff who can work in this phase, and which of them are admins */
  assignable: string[]
  admins: string[]
}

/** Who works on this company in this phase: photos for everyone, a picker for admins. It hides nothing from anybody. */
export default function AssignStaff({ stageId, company, data, isAdmin, empty = null }: {
  stageId: string
  company: { company_id: string; entity_type?: string; phase_staff?: Record<string, string[]> | null }
  data: Assignments
  isAdmin: boolean
  /** shown to staff when nobody is assigned */
  empty?: React.ReactNode
}) {
  const router = useRouter()
  const fromServer = data.assigned[company.company_id] || []
  const [ids, setIds] = useState<string[]>(fromServer)
  const [saving, setSaving] = useState(false)
  const key = fromServer.join(',')
  useEffect(() => { setIds(fromServer) }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  // "Others Service": only the staff picked for this phase (and admins) can see the company, so only they can be assigned
  const picked = company.entity_type === OTHERS_SERVICE && company.phase_staff && Object.keys(company.phase_staff).length ? company.phase_staff[stageId] || [] : null
  const options = data.assignable.filter(u => !picked || picked.includes(u) || data.admins.includes(u))
  // somebody assigned earlier who lost access stays in the list so the admin can take them off
  const list = [...options, ...ids.filter(u => !options.includes(u))]

  async function toggle(userId: string) {
    const next = ids.includes(userId) ? ids.filter(u => u !== userId) : [...ids, userId]
    const before = ids
    setIds(next)
    setSaving(true)
    const table = createClient().from('stage_assignments')
    const { error } = next.length
      ? await table.upsert({ company_id: company.company_id, stage: Number(stageId), user_ids: next, updated_at: new Date().toISOString() }, { onConflict: 'company_id,stage' })
      : await table.delete().eq('company_id', company.company_id).eq('stage', Number(stageId))
    setSaving(false)
    if (error) { setIds(before); alert('Could not assign: ' + error.message); return }
    triggerPush()
    router.refresh()
  }

  if (!isAdmin && !ids.length) return <>{empty}</>

  return (
    // data-no-row-click: choosing staff must not open the client popup of the row
    <span className="inline-flex items-center gap-1.5" data-no-row-click>
      {ids.length > 0 && (
        <span className="inline-flex -space-x-1.5">
          {ids.map(u => <OwnerBadge key={u} label="Assigned" owner={data.people[u] || { name: 'Unknown' }} />)}
        </span>
      )}
      {isAdmin && (
        <Menu.Root>
          <Menu.Trigger asChild>
            <button type="button" title="Assign staff" aria-label="Assign staff"
              className="w-7 h-7 rounded-full border border-dashed border-blue-300 text-blue-600 flex items-center justify-center hover:bg-blue-50 shrink-0">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="end" sideOffset={6} collisionPadding={8} className="z-50 w-60 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              <Menu.Label className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Who will do this work?</Menu.Label>
              {list.length === 0 && <div className="px-2 py-2 text-xs text-slate-500">No staff has access to this phase.</div>}
              {list.map(u => {
                const person = data.people[u] || { name: 'Unknown' }
                return (
                  <Menu.CheckboxItem key={u} checked={ids.includes(u)} disabled={saving} onCheckedChange={() => toggle(u)} onSelect={e => e.preventDefault()}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate-700 cursor-pointer outline-none data-[highlighted]:bg-blue-50 data-[disabled]:opacity-60">
                    <OwnerPhoto owner={person} size="w-6 h-6" />
                    <span className="flex-1 truncate">{person.name}</span>
                    {ids.includes(u) && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </Menu.CheckboxItem>
                )
              })}
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      )}
    </span>
  )
}

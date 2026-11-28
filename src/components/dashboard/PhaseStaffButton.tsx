'use client'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { Users } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import type { Person } from '@/lib/workflowPeople'

/** Under a phase name: how many staff work in it; a click lists them in a small box. */
export default function PhaseStaffButton({ title, people }: { title: string; people: Person[] }) {
  if (!people.length) return null
  return (
    <Menu.Root>
      <Menu.Trigger aria-label={`${title}: ${people.length} staff`} className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-slate-500 hover:bg-white hover:text-blue-700 data-[state=open]:bg-white data-[state=open]:text-blue-700 data-[state=open]:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <Users className="w-3 h-3" />{people.length}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content sideOffset={4} collisionPadding={8} className="z-50 min-w-[200px] max-w-[260px] max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <Menu.Label className="px-2 py-1 text-[11px] font-semibold text-slate-400">{title}</Menu.Label>
          {people.map(p => (
            <div key={p.name} className="flex items-center gap-2.5 px-2 py-1.5">
              <Avatar name={p.name} src={p.avatar} size={26} />
              <span className="text-xs font-medium text-slate-800">{p.name}</span>
            </div>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

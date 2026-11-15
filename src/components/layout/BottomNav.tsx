'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Briefcase, Layers, Globe2, Award, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './DashboardShell'
import { canAccessStage } from '@/lib/access'
import { Employee } from '@/lib/types'

// Short names match the sidebar categories; the rest (CR, Portals, Final, Name Clearance) are under More.
const ITEMS: { href: string; label: string; icon: any; stage?: number; adminOnly?: boolean }[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, adminOnly: true },
  { href: '/dashboard/companies', label: 'Companies', icon: Building2, adminOnly: true },
  { href: '/dashboard/stage/1', label: 'Parent', icon: Briefcase, stage: 1 },
  { href: '/dashboard/stage/2', label: 'Activity', icon: Layers, stage: 2 },
  { href: '/dashboard/stage/3', label: 'Foreign', icon: Globe2, stage: 3 },
  { href: '/dashboard/stage/4', label: 'MISA', icon: Award, stage: 4 },
]

export default function BottomNav({ employee }: { employee?: Employee | null }) {
  const pathname = usePathname()
  const { setMobileOpen } = useSidebar()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]">
      <ul className="flex">
        {ITEMS.filter(i => (!i.stage || canAccessStage(employee, i.stage)) && (!i.adminOnly || employee?.role === 'admin')).map(item => {
          const Icon = item.icon
          const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <li key={item.href} className="flex-1 min-w-0">
              <Link
                href={item.href}
                className={cn('flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium', active ? 'text-blue-600' : 'text-slate-500')}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate max-w-full px-0.5">{item.label}</span>
              </Link>
            </li>
          )
        })}
        <li className="flex-1 min-w-0">
          <button onClick={() => setMobileOpen(true)} className="w-full flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-slate-500">
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

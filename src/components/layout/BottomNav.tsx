'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Briefcase, Layers, Globe2, Award, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './DashboardShell'

// Short names match the sidebar categories; the rest (CR, Portals, Final, Name Clearance) are under More.
const ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/companies', label: 'Companies', icon: Building2 },
  { href: '/dashboard/stage/1', label: 'Parent', icon: Briefcase },
  { href: '/dashboard/stage/2', label: 'Activity', icon: Layers },
  { href: '/dashboard/stage/3', label: 'Foreign', icon: Globe2 },
  { href: '/dashboard/stage/4', label: 'MISA', icon: Award },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { setMobileOpen } = useSidebar()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-7">
        {ITEMS.map(item => {
          const Icon = item.icon
          const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <li key={item.href}>
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
        <li>
          <button onClick={() => setMobileOpen(true)} className="w-full flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-slate-500">
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

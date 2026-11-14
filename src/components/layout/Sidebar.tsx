'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Employee } from '@/lib/types'
import {
  LayoutDashboard,
  Building2,
  Users2,
  FileCheck2,
  Globe2,
  Award,
  Layers,
  Store,
  FolderCheck,
  Tag,
  ChevronRight,
  Shield,
  Briefcase
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: any
  stage?: number
  adminOnly?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/companies', label: 'Company Directory', icon: Building2 },
    ]
  },
  {
    title: 'INVESTOR WORKFLOW',
    items: [
      { href: '/dashboard/stage/1', label: 'Parent Entity Verification', icon: Briefcase, stage: 1 },
      { href: '/dashboard/stage/2', label: 'Activity Classification', icon: Layers, stage: 2 },
      { href: '/dashboard/stage/3', label: 'Foreign Entity Licensing', icon: Globe2, stage: 3 },
      { href: '/dashboard/stage/4', label: 'MISA Investment License', icon: Award, stage: 4 },
      { href: '/dashboard/stage/5', label: 'Commercial Registration', icon: Store, stage: 5 },
      { href: '/dashboard/stage/6', label: 'Portals & Compliance', icon: FileCheck2, stage: 6 },
      { href: '/dashboard/stage/7', label: 'Final Dossier & Filing', icon: FolderCheck, stage: 7 },
      { href: '/dashboard/stage/8', label: 'Trade Name Clearance', icon: Tag, stage: 8 },
    ]
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { href: '/dashboard/employees', label: 'Team & Access Control', icon: Users2, adminOnly: true },
    ]
  }
]

interface SidebarProps { employee: Employee | null }

export default function Sidebar({ employee }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = employee?.role === 'admin'
  const userStage = employee?.assigned_stage

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col text-slate-600 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/20 text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight text-sm flex items-center gap-1.5">
              AL ZAHRA
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                ERP
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Investor License Lifecycle</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3.5 py-4 overflow-y-auto space-y-6">
        {navGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(item => {
            if (item.adminOnly && !isAdmin) return false
            if (item.stage && !isAdmin && userStage !== item.stage) return false
            return true
          })

          if (visibleItems.length === 0) return null

          return (
            <div key={groupIdx} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {group.title}
              </div>
              {visibleItems.map(item => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/80 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600')} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User Info Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          {employee?.avatar_url ? (
            <img
              src={employee.avatar_url}
              alt={employee.name || 'User'}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
              {employee?.name?.charAt(0) || 'A'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate">{employee?.name || 'Administrator'}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-blue-600" />
              <span>{isAdmin ? 'System Administrator' : 'Process Specialist'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

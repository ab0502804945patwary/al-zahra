'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchNotifications } from '@/lib/notifClient'
import { cn } from '@/lib/utils'
import { Employee } from '@/lib/types'
import { useSidebar } from './DashboardShell'
import { canAccessStage, canAccessModule } from '@/lib/access'
import {
  HandCoins,
  UserPlus,
  Contact,
  BarChart3,
  Wallet,
  RefreshCw,
  Handshake,
  ListChecks,
  Receipt,
  UserRound,
  ChevronDown,
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
  Flag,
  ChevronRight,
  Briefcase,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: any
  stage?: number
  module?: string
  notPath?: string // do not highlight on this path (e.g. Leads vs New Lead)
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
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
      { href: '/dashboard/companies', label: 'Company Directory', icon: Building2, module: 'companies' },
      { href: '/dashboard/leads/new', label: 'New Lead', icon: UserPlus, module: 'leads' },
      { href: '/dashboard/leads', label: 'Leads', icon: Contact, module: 'leads', notPath: '/dashboard/leads/new' },
      { href: '/dashboard/renewals', label: 'Renewal Companies', icon: RefreshCw, module: 'renewals' },
      { href: '/dashboard/customers', label: 'Customers', icon: UserRound, module: 'customers' },
      { href: '/dashboard/agents', label: 'Agents', icon: Handshake, module: 'agents' },
      { href: '/dashboard/services', label: 'Services', icon: ListChecks, module: 'services' },
      { href: '/dashboard/expenses', label: 'Expenses', icon: Wallet, module: 'expenses' },
      { href: '/dashboard/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
      { href: '/dashboard/receives', label: 'Receive Voucher', icon: HandCoins, module: 'invoices' },
      { href: '/dashboard/invoices', label: 'Invoices', icon: Receipt, module: 'invoices' },
    ]
  },
  {
    title: 'INVESTOR WORKFLOW',
    items: [
      { href: '/dashboard/stage/1', label: 'Parent Entity Verification', icon: Briefcase, stage: 1 },
      { href: '/dashboard/stage/9', label: 'Bangladesh Company Name', icon: Flag, stage: 9 },
      { href: '/dashboard/stage/2', label: 'Activity Classification', icon: Layers, stage: 2 },
      { href: '/dashboard/stage/3', label: 'Foreign Entity Licensing', icon: Globe2, stage: 3 },
      { href: '/dashboard/stage/8', label: 'Trade Name Clearance', icon: Tag, stage: 8 },
      { href: '/dashboard/stage/4', label: 'MISA Investment License', icon: Award, stage: 4 },
      { href: '/dashboard/stage/5', label: 'Commercial Registration', icon: Store, stage: 5 },
      { href: '/dashboard/stage/6', label: 'Portals & Compliance', icon: FileCheck2, stage: 6 },
      { href: '/dashboard/stage/7', label: 'Final Dossier & Filing', icon: FolderCheck, stage: 7 },
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
  const { collapsed: rawCollapsed, toggle, mobileOpen, setMobileOpen } = useSidebar()
  const collapsed = rawCollapsed && !mobileOpen
  const toggleOrClose = () => (mobileOpen ? setMobileOpen(false) : toggle())
  const isAdmin = employee?.role === 'admin'

  // How many companies are waiting at each stage (red badge)
  const [waiting, setWaiting] = useState<Record<number, number>>({})
  const [workflowOpen, setWorkflowOpen] = useState(false)
  useEffect(() => { if (pathname.startsWith('/dashboard/stage')) setWorkflowOpen(true) }, [pathname])
  useEffect(() => {
    let alive = true
    const load = () => fetchNotifications().then(items => {
      if (!alive) return
      const m: Record<number, number> = {}
      for (const i of items) m[i.stage] = (m[i.stage] || 0) + 1
      setWaiting(m)
    })
    load()
    const t = setInterval(load, 30000)
    return () => { alive = false; clearInterval(t) }
  }, [pathname])

  return (
    <aside
      className={cn(
        'bg-blue-600 border-r border-blue-700/40 flex flex-col text-white select-none shadow-[1px_0_6px_rgba(0,0,0,0.08)] transition-all duration-300 ease-in-out shrink-0',
        'fixed inset-y-0 left-0 z-50 w-60 max-w-[85vw] lg:static lg:z-30 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        !mobileOpen && collapsed ? 'lg:w-16' : 'lg:w-56'
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'h-16 border-b border-blue-700/30 bg-white flex items-center transition-all duration-300',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        {!collapsed ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-2.5 group min-w-0" title="Al Zahra ERP">
              <img
                src="/al_zahra_icon.svg"
                alt="AL ZAHRA Icon"
                className="h-10 w-auto object-contain shrink-0"
              />
              <img
                src="/al_zahra_logo.svg"
                alt="AL ZAHRA Logo"
                className="h-7 w-auto object-contain"
              />
            </Link>

            <button
              onClick={toggleOrClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0 ml-1"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleOrClose}
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/90 p-1 flex items-center justify-center shadow-xs transition hover:border-blue-400 hover:bg-blue-50/50 group"
            title="Click to expand sidebar"
          >
            <img src="/al_zahra_icon.svg" alt="AL ZAHRA" className="w-full h-full object-contain" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          'flex-1 overflow-y-auto space-y-4 py-4 transition-all duration-300',
          collapsed ? 'px-2' : 'px-2.5 space-y-5'
        )}
      >
        {navGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(item => {
            if (item.adminOnly && !isAdmin) return false
            if (item.module && !canAccessModule(employee, item.module)) return false
            if (item.stage && !canAccessStage(employee, item.stage)) return false
            return true
          })

          if (visibleItems.length === 0) return null

          return (
            <div key={groupIdx} className="space-y-1">
              {!collapsed ? (
                group.title === 'INVESTOR WORKFLOW' ? (
                  <button
                    onClick={() => setWorkflowOpen(o => !o)}
                    className="w-full flex items-center justify-between px-3 pb-1.5 text-[10px] font-bold tracking-wider text-blue-100 hover:text-white uppercase"
                  >
                    {group.title}
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', workflowOpen ? 'rotate-180' : '')} />
                  </button>
                ) : (
                  <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-blue-100 uppercase">
                    {group.title}
                  </div>
                )
              ) : groupIdx > 0 ? (
                <div className="my-2 border-t border-white/20" />
              ) : null}

              {(collapsed || group.title !== 'INVESTOR WORKFLOW' || workflowOpen) && visibleItems.map(item => {
                const Icon = item.icon
                const isActive = (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) && !(item.notPath && pathname.startsWith(item.notPath))

                if (collapsed) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={cn(
                        'group flex items-center justify-center w-full h-10 rounded-xl transition-all duration-150 relative',
                        isActive
                          ? 'bg-white text-blue-700 font-semibold shadow-sm'
                          : 'text-blue-50 hover:text-white hover:bg-white/15'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-blue-600' : 'text-blue-200 group-hover:text-white'
                        )}
                      />
                      {isActive && (
                        <span className="absolute left-1 top-2.5 bottom-2.5 w-1 bg-blue-600 rounded-full" />
                      )}
                      {item.stage && waiting[item.stage] ? <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-blue-600" /> : null}
                    </Link>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-white text-blue-700 font-semibold shadow-sm'
                        : 'text-blue-50 hover:text-white hover:bg-white/15'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-blue-600' : 'text-blue-200 group-hover:text-white'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.stage && waiting[item.stage] ? (
                      <span className="ml-1 min-w-5 h-5 px-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">{waiting[item.stage]}</span>
                    ) : isActive ? <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : null}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer Toggle Button */}
      <div
        className={cn(
          'p-2 border-t border-white/20 bg-blue-700/40 flex items-center transition-all duration-300',
          collapsed ? 'justify-center' : 'justify-between px-3'
        )}
      >
        <button
          onClick={toggleOrClose}
          className={cn(
            'flex items-center gap-2 p-2 rounded-lg text-xs text-blue-100 hover:text-white hover:bg-white/15 transition w-full',
            collapsed ? 'justify-center' : ''
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-blue-100" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 text-blue-200" />
              <span className="text-xs font-medium text-blue-100">Collapse category list</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

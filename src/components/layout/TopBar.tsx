'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Employee } from '@/lib/types'
import { Bell, LogOut, Search, ShieldCheck, PanelLeft, PanelLeftOpen, Menu, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useSidebar } from './DashboardShell'
import NotificationBell from './NotificationBell'

interface TopBarProps { employee: Employee | null }

export default function TopBar({ employee }: TopBarProps) {
  const router = useRouter()
  const { collapsed, toggle, setMobileOpen } = useSidebar()
  const supabase = createClient()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isAdmin = employee?.role === 'admin'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch {}
    window.location.href = '/login'
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 shadow-xs z-20">
      {/* Mobile burger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar Drawer Toggle (desktop) */}
      <button
        onClick={toggle}
        className="hidden lg:block p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shrink-0"
        title={collapsed ? 'Expand category drawer' : 'Collapse category drawer'}
      >
        {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
      </button>

      {/* Global Search Bar */}
      <div className="flex-1 min-w-0 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search entity..."
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <kbd className="hidden md:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
            Ctrl+K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <NotificationBell />

        <div className="h-6 w-px bg-slate-200" />

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition"
          >
            {employee?.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={employee.name || 'User'}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white text-xs font-bold ring-1 ring-slate-200 shadow-sm shrink-0">
                {employee?.name?.charAt(0) || 'A'}
              </div>
            )}
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {isAdmin ? 'Al Zahra' : (employee?.name || 'Al Zahra')}
              </div>
              <div className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                {isAdmin ? 'System Administrator' : 'Operations Staff'}
              </div>
            </div>
          </button>

          {showMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-hidden z-50 py-1"
            >
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-800">
                  {isAdmin ? 'Al Zahra' : (employee?.name || 'Al Zahra')}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">{employee?.email || 'admin@alzahra.com'}</div>
              </div>

              <button
                onClick={() => { router.push('/dashboard/settings'); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" /> Settings
              </button>

              {isAdmin && (
                <button
                  onClick={() => { router.push('/dashboard/employees'); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Access Privileges
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition border-t border-slate-100 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Employee } from '@/lib/types'
import { Bell, LogOut, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

interface TopBarProps { employee: Employee | null }

export default function TopBar({ employee }: TopBarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showMenu, setShowMenu] = useState(false)
  const isAdmin = employee?.role === 'admin'

  async function handleLogout() {
    document.cookie = "demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
    try {
      await supabase.auth.signOut()
    } catch {}
    window.location.href = '/login'
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center px-6 gap-6 shadow-sm z-20">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search entity by ID, trade name, commercial registration..."
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
            Ctrl+K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* System Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

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
              <div className="text-xs font-semibold text-slate-800 leading-tight">{employee?.name || 'Administrator'}</div>
              <div className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                {isAdmin ? 'System Administrator' : 'Operations Staff'}
              </div>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-hidden z-50 py-1">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-800">{employee?.name || 'Administrator'}</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">{employee?.email || 'admin@alzahra.com'}</div>
              </div>

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

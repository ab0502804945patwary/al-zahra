'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { usePathname } from 'next/navigation'
import { Employee } from '@/lib/types'

interface SidebarContextType {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

export const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export default function DashboardShell({
  employee,
  children,
}: {
  employee: Employee | null
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('al_zahra_sidebar_collapsed')
      if (saved !== null) {
        setCollapsed(saved === 'true')
      }
    } catch {}
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('al_zahra_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, setCollapsed, mobileOpen, setMobileOpen }}>
      <div className="dash-theme flex h-screen bg-gradient-to-br from-[#f7f9fe] via-[#f3f6fc] to-[#eaf1fd] overflow-hidden font-sans">
        {mobileOpen && (
          <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}
        <Sidebar employee={employee} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar employee={employee} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6">
            {children}
          </main>
          <BottomNav employee={employee} />
        </div>
      </div>
    </SidebarContext.Provider>
  )
}

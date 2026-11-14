'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { Employee } from '@/lib/types'

interface SidebarContextType {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (v: boolean) => void
}

export const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
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
    <SidebarContext.Provider value={{ collapsed, toggle, setCollapsed }}>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        <Sidebar employee={employee} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar employee={employee} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}

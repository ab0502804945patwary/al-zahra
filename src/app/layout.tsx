import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AL ZAHRA ERP — Investor License Management',
  description: 'Professional ERP for AL ZAHRA Investor License Processing',
  icons: {
    icon: '/al_zahra_icon.svg',
    shortcut: '/al_zahra_icon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, title: 'AL ZAHRA', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#3d5fab',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

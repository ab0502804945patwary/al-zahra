'use client'
import { useEffect } from 'react'

declare global { interface Window { __pwaPrompt?: Event | null } }

/**
 * Mounted once in the root layout. Registers the service worker and keeps the browser's
 * "install" offer so the Install button in Settings can use it later (the browser only
 * offers it once per page load, usually before the user opens Settings).
 */
export default function PwaListener() {
  useEffect(() => {
    // old demo-mode leftovers in this browser: remove them
    try { for (const k of ['alzahra_companies_data', 'alzahra_employees_data', 'alzahra_demo_entries', 'alzahra_seen_notifications']) localStorage.removeItem(k) } catch {}
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    const onPrompt = (e: Event) => { e.preventDefault(); window.__pwaPrompt = e; window.dispatchEvent(new Event('pwa-prompt')) }
    const onInstalled = () => { window.__pwaPrompt = null; window.dispatchEvent(new Event('pwa-installed')) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])
  return null
}

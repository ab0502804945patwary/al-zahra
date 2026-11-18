'use client'
import { useEffect, useState } from 'react'
import { Download, X, Share, PlusSquare, MoreVertical } from 'lucide-react'

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

/** "Install App" button (PC + phone). The service worker and the browser's install offer are handled by PwaListener. */
export default function InstallApp({ className = '' }: { className?: string }) {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [help, setHelp] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop')

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    setInstalled(standalone)
    const ua = navigator.userAgent
    setPlatform(/iPad|iPhone|iPod/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop')

    if (window.__pwaPrompt) setDeferred(window.__pwaPrompt as InstallEvent)
    const onPrompt = () => setDeferred((window.__pwaPrompt as InstallEvent) || null)
    const onInstalled = () => { setInstalled(true); setDeferred(null); setHelp(false) }
    window.addEventListener('pwa-prompt', onPrompt)
    window.addEventListener('pwa-installed', onInstalled)
    return () => { window.removeEventListener('pwa-prompt', onPrompt); window.removeEventListener('pwa-installed', onInstalled) }
  }, [])

  if (installed) return null

  async function install() {
    if (deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      if (outcome === 'accepted') setDeferred(null)
    } else {
      setHelp(true) // iPhone / browsers without the install prompt: show the steps
    }
  }

  return (
    <>
      <button onClick={install} title="Install AL ZAHRA as an app" className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition ${className}`}>
        <Download className="w-3.5 h-3.5" /> <span>Install App</span>
      </button>

      {help && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-end sm:items-center justify-center p-4" onClick={() => setHelp(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Install AL ZAHRA app</h3>
              <button onClick={() => setHelp(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {platform === 'ios' ? (
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-2"><Share className="w-5 h-5 text-blue-600 shrink-0" /> Open this site in <b>Safari</b> and tap the <b>Share</b> button.</li>
                <li className="flex gap-2"><PlusSquare className="w-5 h-5 text-blue-600 shrink-0" /> Choose <b>Add to Home Screen</b>.</li>
                <li className="flex gap-2"><Download className="w-5 h-5 text-blue-600 shrink-0" /> Tap <b>Add</b>. The AL ZAHRA icon appears on your home screen.</li>
              </ol>
            ) : platform === 'android' ? (
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-2"><MoreVertical className="w-5 h-5 text-blue-600 shrink-0" /> Open this site in <b>Chrome</b> and tap the <b>⋮ menu</b>.</li>
                <li className="flex gap-2"><Download className="w-5 h-5 text-blue-600 shrink-0" /> Tap <b>Install app</b> (or <b>Add to Home screen</b>).</li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-2"><Download className="w-5 h-5 text-blue-600 shrink-0" /> In <b>Chrome</b> or <b>Edge</b>, click the install icon at the right end of the address bar.</li>
                <li className="flex gap-2"><MoreVertical className="w-5 h-5 text-blue-600 shrink-0" /> Or open the browser menu and choose <b>Install AL ZAHRA</b> (Edge: Apps → Install this site as an app).</li>
              </ol>
            )}
            <p className="text-[11px] text-slate-400 mt-4">The app opens in its own window like a normal program and always shows your latest data.</p>
          </div>
        </div>
      )}
    </>
  )
}

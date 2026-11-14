'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  function handleDemoLogin() {
    setDemoLoading(true)
    document.cookie = "demo_session=admin; path=/; max-age=86400"
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Subtle light background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Auth Card */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xl shadow-slate-200/50">
          {/* Brand & Title inside Box */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center gap-3.5 mb-4">
              <img
                src="/al_zahra_icon.svg"
                alt="AL ZAHRA Icon"
                className="h-14 w-auto object-contain shrink-0"
              />
              <img
                src="/al_zahra_logo.svg"
                alt="AL ZAHRA Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <h2 className="text-base font-bold text-slate-900">Sign In</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs text-slate-700 font-semibold mb-1 block">Corporate Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@alzahra.com"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold mb-1 block">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 shadow-sm text-xs"
            >
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Signing In...</> : 'Sign In'}
            </button>
          </form>

          {/* Instant Demo Preview */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading || loading}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-medium text-xs transition flex items-center justify-center gap-2"
            >
              {demoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
              Instant Demo Access (Explore Full ERP)
            </button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © 2026 AL ZAHRA Investor Services • Confidential Enterprise System
        </p>
      </div>
    </div>
  )
}

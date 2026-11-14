'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Building2, Eye, EyeOff, Loader2, Lock, Mail, Sparkles, Shield, UserCheck, ChevronRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)
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

  function handleQuickLogin(roleOrId: string) {
    setDemoLoading(roleOrId)
    document.cookie = `demo_session=${roleOrId}; path=/; max-age=86400`
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
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-3 shadow-md border border-slate-200/80">
            <Building2 className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AL ZAHRA</h1>
          <p className="text-slate-500 mt-1 text-xs font-medium">Investor License Management ERP</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-xl shadow-slate-200/50">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">Sign in to your portal</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter authorized credentials or choose a quick role</p>
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
              disabled={loading || !!demoLoading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 shadow-sm text-xs"
            >
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Authorizing...</> : 'Authenticate Access'}
            </button>
          </form>

          {/* Quick Access Switcher for Demo / Testing */}
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Instant Access (Select Role to Test)
            </div>

            {/* Admin Option */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              disabled={!!demoLoading}
              className="w-full p-2.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-xl transition text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">System Administrator</div>
                  <div className="text-[10px] text-slate-400">Full Access (All 8 Stages + Team Control)</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Staff Option: Stage 1 Lead */}
            <button
              type="button"
              onClick={() => handleQuickLogin('emp-1')}
              disabled={!!demoLoading}
              className="w-full p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-xl transition text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Shahariar Rakib (Staff)</div>
                  <div className="text-[10px] text-slate-400">Stage 1 Lead: Parent Entity Specialist</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Staff Option: Stage 4 Lead */}
            <button
              type="button"
              onClick={() => handleQuickLogin('emp-4')}
              disabled={!!demoLoading}
              className="w-full p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-xl transition text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-amber-700">Md Miraj (Staff)</div>
                  <div className="text-[10px] text-slate-400">Stage 4 Lead: MISA License Specialist</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
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

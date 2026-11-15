'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, KeyRound, Loader2, Lock, Trash2, User, Volume2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Profile { name: string; email: string; phone?: string | null; role: string; avatar_url?: string | null }

export const SOUND_KEY = 'alzahra_sound_on'

/** Shrink a photo to a small square JPEG so it can be stored directly in the profile. */
function resizeToDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')) }
    img.src = url
  })
}

function Card({ icon: Icon, title, hint, children }: { icon: any; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-blue-600" /></div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

const input = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const primary = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5'

export default function SettingsClient({ profile }: { profile: Profile }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const isAdmin = profile.role === 'admin'

  // ---- Profile ----
  const [name, setName] = useState(profile.name)
  const [phone, setPhone] = useState(profile.phone || '')
  const [avatar, setAvatar] = useState(profile.avatar_url || '')
  const [pBusy, setPBusy] = useState(false)
  const [pMsg, setPMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function saveProfile(patch?: Record<string, any>, okText = 'Profile saved.') {
    setPBusy(true)
    setPMsg(null)
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch || { name, phone, avatar_url: avatar || null }),
    })
    const data = await res.json().catch(() => ({}))
    setPBusy(false)
    if (!res.ok) { setPMsg({ ok: false, text: data.error || 'Could not save.' }); return false }
    setPMsg({ ok: true, text: okText })
    router.refresh()
    return true
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setPMsg({ ok: false, text: 'Please choose an image file.' }); return }
    try {
      const data = await resizeToDataUrl(file)
      setAvatar(data)
      await saveProfile({ avatar_url: data }, 'Photo updated.')
    } catch {
      setPMsg({ ok: false, text: 'Could not read that image.' })
    }
  }

  async function removePhoto() {
    setAvatar('')
    await saveProfile({ avatar_url: null }, 'Photo removed.')
  }

  // ---- My password ----
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pw1.length < 6) { setPwMsg({ ok: false, text: 'Password must be at least 6 characters.' }); return }
    if (pw1 !== pw2) { setPwMsg({ ok: false, text: 'Passwords do not match.' }); return }
    setPwBusy(true)
    const { error } = await createClient().auth.updateUser({ password: pw1 })
    setPwBusy(false)
    if (error) { setPwMsg({ ok: false, text: error.message }); return }
    setPw1(''); setPw2('')
    setPwMsg({ ok: true, text: 'Password changed.' })
  }

  // ---- Master password (admin) ----
  const [mpSet, setMpSet] = useState<boolean | null>(null)
  const [mpCur, setMpCur] = useState('')
  const [mpNew, setMpNew] = useState('')
  const [mpBusy, setMpBusy] = useState(false)
  const [mpMsg, setMpMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/master-password', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setMpSet(Boolean(d.set)); if (d.error) setMpMsg({ ok: false, text: d.error }) })
      .catch(() => {})
  }, [])

  async function saveMaster(e: React.FormEvent) {
    e.preventDefault()
    setMpBusy(true)
    setMpMsg(null)
    const res = await fetch('/api/master-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: mpCur, next: mpNew }),
    })
    const data = await res.json().catch(() => ({}))
    setMpBusy(false)
    if (!res.ok) { setMpMsg({ ok: false, text: data.error || 'Could not save.' }); return }
    setMpSet(true); setMpCur(''); setMpNew('')
    setMpMsg({ ok: true, text: 'Master password saved.' })
  }

  // ---- Notification sound ----
  const [sound, setSound] = useState(true)
  useEffect(() => {
    try { setSound(localStorage.getItem(SOUND_KEY) !== 'off') } catch {}
  }, [])
  function toggleSound() {
    const next = !sound
    setSound(next)
    try { localStorage.setItem(SOUND_KEY, next ? 'on' : 'off') } catch {}
  }

  const Msg = ({ m }: { m: { ok: boolean; text: string } | null }) =>
    m ? <div className={`text-xs rounded-lg p-2 border ${m.ok ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>{m.text}</div> : null

  return (
    <div className="space-y-5 w-full max-w-3xl mx-auto">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Your profile, password and security</p>
      </div>

      <Card icon={User} title="Profile" hint="Your photo and contact details">
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt={name} className="w-20 h-20 rounded-2xl object-cover ring-1 ring-slate-200 shadow-sm" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-600 flex items-center justify-center text-white text-2xl font-bold">{name.charAt(0) || 'A'}</div>
          )}
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={pBusy} className={primary}><Camera className="w-3.5 h-3.5" /> Change photo</button>
            {avatar && <button type="button" onClick={removePhoto} disabled={pBusy} className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Remove</button>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Name</label>
            <input className={input} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Phone</label>
            <input className={input} value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-700 mb-1 block">Email (login)</label>
            <input className={input + ' bg-slate-50 text-slate-500'} value={profile.email} disabled />
          </div>
        </div>
        <Msg m={pMsg} />
        <button type="button" onClick={() => saveProfile()} disabled={pBusy || !name.trim()} className={primary}>
          {pBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save profile
        </button>
      </Card>

      <Card icon={KeyRound} title="My password" hint="Change the password you use to sign in">
        <form onSubmit={changePassword} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="password" className={input} placeholder="New password" value={pw1} onChange={e => setPw1(e.target.value)} />
            <input type="password" className={input} placeholder="Repeat new password" value={pw2} onChange={e => setPw2(e.target.value)} />
          </div>
          <Msg m={pwMsg} />
          <button type="submit" disabled={pwBusy || !pw1} className={primary}>{pwBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Change password</button>
        </form>
      </Card>

      {isAdmin && (
        <Card icon={Lock} title="Master password" hint="Required to delete any company, record or staff member. Only admins can set it.">
          <form onSubmit={saveMaster} className="space-y-3">
            <div className="text-[11px] font-medium text-slate-600">
              Status: {mpSet === null ? 'checking…' : mpSet ? <span className="text-emerald-700">Set</span> : <span className="text-amber-700">Not set — deletes are blocked until you set one</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mpSet && <input type="password" className={input} placeholder="Current master password" value={mpCur} onChange={e => setMpCur(e.target.value)} />}
              <input type="password" className={input} placeholder={mpSet ? 'New master password' : 'Choose a master password'} value={mpNew} onChange={e => setMpNew(e.target.value)} />
            </div>
            <Msg m={mpMsg} />
            <button type="submit" disabled={mpBusy || !mpNew} className={primary}>{mpBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {mpSet ? 'Change master password' : 'Set master password'}</button>
          </form>
        </Card>
      )}

      <Card icon={Volume2} title="Notification sound" hint="Play a sound when new work reaches your stage">
        <button type="button" onClick={toggleSound} className={`relative w-11 h-6 rounded-full transition ${sound ? 'bg-blue-600' : 'bg-slate-300'}`} aria-pressed={sound}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${sound ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
        <span className="ml-3 text-xs text-slate-600 align-middle">{sound ? 'On' : 'Off'}</span>
      </Card>
    </div>
  )
}

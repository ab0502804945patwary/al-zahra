import { createClient as createAdminClient } from '@supabase/supabase-js'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEY = 'master_password'

export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, { auth: { persistSession: false } })
}

function hash(password: string) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`
}

function matches(password: string, stored: string) {
  const [salt, h] = stored.split(':')
  if (!salt || !h) return false
  const a = Buffer.from(scryptSync(password, salt, 32).toString('hex'))
  const b = Buffer.from(h)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function stored() {
  const db = adminDb()
  if (!db) return { db: null, value: null as string | null, error: 'SUPABASE_SERVICE_ROLE_KEY is missing.' }
  const { data, error } = await db.from('app_settings').select('value').eq('key', KEY).maybeSingle()
  if (error) return { db, value: null, error: 'app_settings table is missing. Run the latest supabase-schema.sql migration.' }
  return { db, value: (data?.value as string) || null, error: null as string | null }
}

export async function isMasterPasswordSet() {
  const s = await stored()
  return { set: Boolean(s.value), error: s.error }
}

const MAX_FAILS = 5
const LOCK_MS = 15 * 60 * 1000

/** Wrong guesses are counted per user; after 5 misses the user is locked out for 15 minutes. */
export async function verifyMasterPassword(password: string, userId?: string): Promise<{ ok: boolean; error?: string }> {
  const s = await stored()
  if (s.error) return { ok: false, error: s.error }
  if (!s.value) return { ok: false, error: 'Master password is not set yet. An admin must set it in Settings.' }

  const lockKey = userId ? `mp_fail:${userId}` : null
  let state: { count: number; until: number } = { count: 0, until: 0 }
  if (lockKey && s.db) {
    const { data } = await s.db.from('app_settings').select('value').eq('key', lockKey).maybeSingle()
    try { if (data?.value) state = JSON.parse(data.value as string) } catch {}
    if (state.until > Date.now()) {
      const mins = Math.ceil((state.until - Date.now()) / 60000)
      return { ok: false, error: `Too many wrong attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` }
    }
  }

  if (!password || !matches(password, s.value)) {
    await new Promise(r => setTimeout(r, 600)) // slow down guessing
    if (lockKey && s.db) {
      const count = state.count + 1
      const next = count >= MAX_FAILS ? { count: 0, until: Date.now() + LOCK_MS } : { count, until: 0 }
      await s.db.from('app_settings').upsert({ key: lockKey, value: JSON.stringify(next), updated_at: new Date().toISOString() })
    }
    return { ok: false, error: 'Wrong master password.' }
  }
  if (lockKey && s.db && state.count > 0) await s.db.from('app_settings').delete().eq('key', lockKey)
  return { ok: true }
}

export async function setMasterPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  const s = await stored()
  if (!s.db) return { ok: false, error: s.error || 'Not configured.' }
  if (s.error) return { ok: false, error: s.error }
  const { error } = await s.db.from('app_settings').upsert({ key: KEY, value: hash(password), updated_at: new Date().toISOString() })
  return error ? { ok: false, error: error.message } : { ok: true }
}

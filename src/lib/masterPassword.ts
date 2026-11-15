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

export async function verifyMasterPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  const s = await stored()
  if (s.error) return { ok: false, error: s.error }
  if (!s.value) return { ok: false, error: 'Master password is not set yet. An admin must set it in Settings.' }
  if (!password || !matches(password, s.value)) {
    await new Promise(r => setTimeout(r, 600)) // slow down guessing
    return { ok: false, error: 'Wrong master password.' }
  }
  return { ok: true }
}

export async function setMasterPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  const s = await stored()
  if (!s.db) return { ok: false, error: s.error || 'Not configured.' }
  if (s.error) return { ok: false, error: s.error }
  const { error } = await s.db.from('app_settings').upsert({ key: KEY, value: hash(password), updated_at: new Date().toISOString() })
  return error ? { ok: false, error: error.message } : { ok: true }
}

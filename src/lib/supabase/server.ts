import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured =
  Boolean(rawUrl) &&
  (rawUrl!.startsWith('http://') || rawUrl!.startsWith('https://')) &&
  !rawUrl!.includes('your_supabase_project_url') &&
  !rawUrl!.includes('your-project') &&
  !rawUrl!.includes('placeholder') &&
  Boolean(rawKey) &&
  rawKey !== 'your_supabase_anon_key' &&
  rawKey !== 'your-supabase-anon-key' &&
  !rawKey!.includes('placeholder')

export async function createClient() {
  const cookieStore = await cookies()

  // In demo mode use placeholder values — callers skip DB calls via isSupabaseConfigured
  const url = isSupabaseConfigured ? rawUrl! : 'https://placeholder.supabase.co'
  const key = isSupabaseConfigured
    ? rawKey!
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })
}

/**
 * Server-only client that bypasses row-level security. Use it ONLY for read-only lookups the
 * signed-in user is already allowed to see in the UI (e.g. upstream stage dates for the
 * eligibility check, which staff cannot read directly because each staff member is limited
 * to their own stage table). Falls back to the normal client when the key is missing.
 */
export async function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!isSupabaseConfigured || !key) return createClient()
  return createSupabaseClient(rawUrl!, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

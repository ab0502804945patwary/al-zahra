import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured =
  !!rawUrl &&
  (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) &&
  !rawUrl.includes('your_supabase_project_url') &&
  !!rawKey &&
  rawKey !== 'your_supabase_anon_key'

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

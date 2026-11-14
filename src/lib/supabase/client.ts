import { createBrowserClient } from '@supabase/ssr'

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

export function createClient() {
  const url = isSupabaseConfigured ? rawUrl! : 'https://placeholder.supabase.co'
  const key = isSupabaseConfigured
    ? rawKey!
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

  return createBrowserClient(url, key)
}

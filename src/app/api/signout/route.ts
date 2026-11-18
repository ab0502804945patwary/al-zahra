import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Clears a bad or no-access session and returns to the login page.
 * Server pages cannot delete cookies themselves, so a stale cookie used to bounce the browser
 * between /login and /dashboard forever (ERR_TOO_MANY_REDIRECTS). Redirecting here breaks that loop.
 */
export async function GET(request: Request) {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch {}
  }
  return NextResponse.redirect(new URL('/login?denied=1', request.url))
}

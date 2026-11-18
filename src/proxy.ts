import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Sign-in endpoint must be reachable without a session (otherwise POST is redirected to /login -> 405)
  if (request.nextUrl.pathname.startsWith('/api/quick-login')) return supabaseResponse

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isConfigured =
    Boolean(rawUrl) &&
    (rawUrl!.startsWith('http://') || rawUrl!.startsWith('https://')) &&
    !rawUrl!.includes('your_supabase_project_url') &&
    !rawUrl!.includes('your-project') &&
    !rawUrl!.includes('placeholder') &&
    Boolean(rawKey) &&
    rawKey !== 'your_supabase_anon_key' &&
    rawKey !== 'your-supabase-anon-key' &&
    !rawKey!.includes('placeholder')

  // If Supabase is not configured yet with real live credentials, allow direct access
  if (!isConfigured) {
    return supabaseResponse
  }

  try {
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      rawUrl!,
      rawKey!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Cookie-only check (no network round trip); the pages themselves verify the user with the server
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    if (!user && !request.nextUrl.pathname.startsWith('/login')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // (not after a denied/expired session: that is what ends the redirect loop)
    if (user && request.nextUrl.pathname === '/login' && !request.nextUrl.searchParams.has('denied')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } catch (err) {
    console.error('Auth error in proxy:', err)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|offline\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

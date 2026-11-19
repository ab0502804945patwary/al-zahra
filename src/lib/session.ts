import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type SessionStatus = 'ok' | 'anon' | 'no-profile' | 'error'

/**
 * Signed-in user + staff row, fetched once per request and shared by layout and page.
 *
 * `status` separates "really not signed in" from "could not check right now":
 * a slow network or a database hiccup must never log anybody out, so those return 'error'.
 */
export const getSessionInfo = cache(async () => {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user) {
    const code = (userError as any)?.status as number | undefined
    // 401/403/400 = the session is really invalid. Anything else (timeout, 5xx, no response) = try again.
    const invalid = !userError || code === 400 || code === 401 || code === 403
    return { supabase, user: null, employee: null as any, status: (invalid ? 'anon' : 'error') as SessionStatus }
  }

  const { data: employee, error: empError } = await supabase.from('employees').select('*').eq('user_id', user.id).maybeSingle()
  if (empError) return { supabase, user, employee: null as any, status: 'error' as SessionStatus }
  if (!employee) return { supabase, user, employee: null as any, status: 'no-profile' as SessionStatus }
  return { supabase, user, employee: employee as any, status: 'ok' as SessionStatus }
})

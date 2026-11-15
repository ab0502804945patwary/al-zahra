import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/** Signed-in user + staff row, fetched once per request and shared by layout and page. */
export const getSessionInfo = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, employee: null as any }
  const { data: employee } = await supabase.from('employees').select('*').eq('user_id', user.id).single()
  return { supabase, user, employee: (employee as any) ?? null }
})

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { canAccessModule, homeFor } from '@/lib/access'
import JournalClient from '@/components/journal/JournalClient'

export const dynamic = 'force-dynamic'

export default async function JournalPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (!canAccessModule(employee, 'journal')) redirect(homeFor(employee))
  const supabase = await createClient()
  const [j, a, b] = await Promise.all([
    supabase.from('journal_entries').select('*, journal_lines(debit, credit, memo, accounts(name))').order('created_at', { ascending: false }),
    supabase.from('accounts').select('id, code, name, type').eq('is_active', true).order('code'),
    supabase.rpc('employee_cash_balances'),
  ])
  return <JournalClient entries={(j.data as any[]) || []} accounts={(a.data as any[]) || []} balances={(b.data as any[]) || []} />
}

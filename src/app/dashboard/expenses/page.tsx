import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/session'
import { homeFor } from '@/lib/access'
import ExpensesClient from '@/components/expenses/ExpensesClient'

export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
  if (!isSupabaseConfigured) redirect('/login')
  const { employee } = await getSessionInfo()
  if (employee && employee.role !== 'admin') redirect(homeFor(employee))
  const supabase = await createClient()
  const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false }).order('expense_no', { ascending: false })
  return <ExpensesClient expenses={(data as any[]) || []} />
}

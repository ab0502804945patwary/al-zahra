import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import StaffProfileClient from '@/components/employees/StaffProfileClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StaffProfilePage({ params }: PageProps) {
  const { id } = await params
  if (!isSupabaseConfigured) redirect('/login')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('employees').select('role').eq('user_id', user.id).single()
  if (me?.role !== 'admin') redirect('/dashboard')

  const { data: emp } = await supabase.from('employees').select('*').eq('id', id).single()
  if (!emp) notFound()

  return <StaffProfileClient initialEmployee={emp} />
}

import { NextResponse } from 'next/server'
import { getNotifications } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json({ items: await getNotifications() })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

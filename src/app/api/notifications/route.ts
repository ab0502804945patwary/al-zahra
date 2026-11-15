import { NextResponse } from 'next/server'
import { getNotifications } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    let extra: any[] = []
    const raw = new URL(req.url).searchParams.get('local')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) extra = parsed.slice(0, 200)
      } catch {}
    }
    return NextResponse.json({ items: await getNotifications(extra) })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

import { NextResponse } from 'next/server'
import { getNotifications } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    let extra: any[] = []
    let entries: Record<string, any[]> = {}
    const raw = new URL(req.url).searchParams.get('local')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.companies)) extra = parsed.companies.slice(0, 200)
        if (parsed.entries && typeof parsed.entries === 'object') entries = parsed.entries
      } catch {}
    }
    return NextResponse.json({ items: await getNotifications(extra, entries) })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

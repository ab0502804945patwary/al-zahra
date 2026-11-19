import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** The version this server is running. The app compares it with the version it was loaded with. */
export async function GET() {
  return NextResponse.json({ build: process.env.NEXT_PUBLIC_BUILD_ID || 'dev' }, { headers: { 'Cache-Control': 'no-store' } })
}

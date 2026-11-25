import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { canAccessModule } from '@/lib/access'
import { r2Configured, uploadUrl, downloadUrl, removeObject, ALLOWED_TYPES, MAX_BYTES, DOC_PREFIX, cleanName, cleanFolder } from '@/lib/r2'

export const dynamic = 'force-dynamic'

/**
 * Signed links for company documents kept in Cloudflare R2.
 *   { action: 'upload', folder, name, type, size }  -> { key, url }   (browser then PUTs the file to url)
 *   { action: 'download', key }                     -> { url }
 *   { action: 'remove', key }                       -> { ok: true }
 * Needs a signed-in staff member who has the Company Register or Renewal Companies module (admins always).
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  if (!r2Configured) return NextResponse.json({ error: 'File storage (R2) is not set up yet.' }, { status: 503 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  const { data: me } = await supabase.from('employees').select('role, modules, is_active').eq('user_id', user.id).single()
  if (!me || me.is_active === false || !(canAccessModule(me, 'companies') || canAccessModule(me, 'renewals'))) {
    return NextResponse.json({ error: 'You cannot use company documents.' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  try {
    if (body.action === 'upload') {
      const type = String(body.type || '')
      const size = Number(body.size || 0)
      if (!ALLOWED_TYPES.includes(type)) return NextResponse.json({ error: 'Only JPG, PNG, WebP images or PDF files are allowed.' }, { status: 400 })
      if (!(size > 0) || size > MAX_BYTES) return NextResponse.json({ error: 'The file must be smaller than 10 MB.' }, { status: 400 })
      const key = `${DOC_PREFIX}${cleanFolder(body.folder)}/${Date.now()}_${cleanName(body.name)}`
      return NextResponse.json({ key, url: await uploadUrl(key, type) })
    }
    const key = String(body.key || '')
    if (!key.startsWith(DOC_PREFIX) || key.includes('..')) return NextResponse.json({ error: 'Invalid file.' }, { status: 400 })
    if (body.action === 'download') return NextResponse.json({ url: await downloadUrl(key) })
    if (body.action === 'remove') { await removeObject(key); return NextResponse.json({ ok: true }) }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Storage error.' }, { status: 500 })
  }
  return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
}

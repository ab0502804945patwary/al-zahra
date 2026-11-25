// Runs in the browser. Photos are shrunk before they are uploaded so the files stay small (usually a few hundred KB).
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

/** Resize a picture to at most 1600 px on the long side and save it as JPEG. PDFs and anything that cannot be shrunk are returned as they are. */
export async function shrinkFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.72))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

export interface StoredFile { key: string; name: string; size: number; type: string; added_at: string }

/** Shrink, check, and upload one file into R2 through a signed link. Returns the stored file record. */
export async function uploadToR2(file: File, folder: string): Promise<StoredFile> {
  if (!UPLOAD_TYPES.includes(file.type)) throw new Error('Only JPG, PNG, WebP images or PDF files are allowed.')
  const small = await shrinkFile(file)
  if (small.size > MAX_UPLOAD_BYTES) throw new Error(`"${file.name}" is ${kb(small.size)}. Files must be 5 MB or smaller, please make it smaller.`)
  const res = await fetch('/api/r2/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'upload', folder, name: small.name, type: small.type, size: small.size }) })
  const sign = await res.json().catch(() => ({} as any))
  if (!res.ok || !sign.url) throw new Error(sign.error || 'Could not start the upload.')
  const put = await fetch(sign.url, { method: 'PUT', headers: { 'Content-Type': small.type }, body: small })
  if (!put.ok) throw new Error('The file could not be saved (' + put.status + ').')
  return { key: sign.key, name: small.name, size: small.size, type: small.type, added_at: new Date().toISOString() }
}

export async function openFromR2(key: string) {
  const res = await fetch('/api/r2/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'download', key }) })
  const out = await res.json().catch(() => ({} as any))
  if (!res.ok || !out.url) throw new Error(out.error || 'Could not open the file.')
  window.open(out.url, '_blank', 'noopener')
}

export async function removeFromR2(key: string) {
  const res = await fetch('/api/r2/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', key }) })
  if (!res.ok) { const out = await res.json().catch(() => ({} as any)); throw new Error(out.error || 'Could not remove the file.') }
}

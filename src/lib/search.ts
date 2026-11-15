// One search box that matches any field: name, ID (AZC803 or just 803), serial number, phone, country, etc.
const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '')

export function matchesQuery(query: string, serial: number, fields: unknown[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const qDigits = digits(q)
  // serial number: "5" or "#5" matches row 5 exactly
  if (/^#?\d+$/.test(q) && Number(q.replace('#', '')) === serial) return true
  // 1-2 digits (or #n) can only mean a serial number; avoid matching stray digits inside phones/IDs
  if (/^#\d+$/.test(q) || /^\d{1,2}$/.test(q)) return false
  return fields.some(f => {
    const text = String(f ?? '').toLowerCase()
    if (!text) return false
    if (text.includes(q)) return true
    // phone numbers: ignore spaces, dashes, +, leading zeros
    return qDigits.length >= 3 && digits(text).replace(/^0+/, '').includes(qDigits.replace(/^0+/, ''))
  })
}

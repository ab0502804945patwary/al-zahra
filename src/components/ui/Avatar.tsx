/** Round profile photo; the first letter of the name when there is no photo. */
export default function Avatar({ name, src, size = 22 }: { name?: string | null; src?: string | null; size?: number }) {
  const style = { width: size, height: size }
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" style={style} className="rounded-full object-cover ring-1 ring-slate-200 shrink-0" />
  }
  return (
    <span style={{ ...style, fontSize: Math.max(9, Math.round(size * 0.45)) }} className="rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}

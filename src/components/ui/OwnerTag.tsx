/** Who registered a record: their photo (or first letter) and name. No recorded person = AL ZAHRA with the logo. */
export default function OwnerTag({ name, avatar }: { name?: string | null; avatar?: string | null }) {
  if (!name) {
    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/al_zahra_icon.svg" alt="" className="w-6 h-6 rounded-full object-contain bg-white ring-1 ring-slate-200 p-0.5 shrink-0" />
        <span className="font-semibold text-slate-700">AL ZAHRA</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 shrink-0" />
      ) : (
        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{name.trim().charAt(0).toUpperCase()}</span>
      )}
      <span className="font-medium text-slate-700">{name}</span>
    </span>
  )
}

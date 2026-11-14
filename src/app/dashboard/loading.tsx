export default function Loading() {
  return (
    <div className="space-y-6 w-full max-w-[2000px] mx-auto animate-pulse">
      <div className="h-8 w-72 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100 border border-slate-200" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  )
}

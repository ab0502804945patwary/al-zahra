'use client'

const input = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

/** MISA Investment License: the two portal logins used for this company (add and edit forms). */
export default function MisaAccounts({ form, set, required = false }: { form: Record<string, string>; set: (k: string, v: string) => void; required?: boolean }) {
  const L = ({ children }: { children: React.ReactNode }) => <label className="text-xs font-medium text-slate-700 mb-1 block">{children}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
  return (
    <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-slate-800">MISA Portal Accounts</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <L>Email</L>
          <input type="email" required={required} className={input} value={form.misa_email || ''} onChange={e => set('misa_email', e.target.value)} autoComplete="off" />
        </div>
        <div>
          <L>Password</L>
          <input required={required} type="text" className={input} value={form.misa_email_password || ''} onChange={e => set('misa_email_password', e.target.value)} autoComplete="off" spellCheck={false} />
        </div>
        <div>
          <L>User Name</L>
          <input required={required} className={input} value={form.misa_username || ''} onChange={e => set('misa_username', e.target.value)} autoComplete="off" />
        </div>
        <div>
          <L>Password</L>
          <input required={required} type="text" className={input} value={form.misa_username_password || ''} onChange={e => set('misa_username_password', e.target.value)} autoComplete="off" spellCheck={false} />
        </div>
      </div>
    </div>
  )
}

'use client'
import CountrySelect from '@/components/ui/CountrySelect'
import ComboInput from '@/components/ui/ComboInput'
import { placesFor } from '@/lib/regions'

const input = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

/** Foreign company details for Foreign Mother Company and both Foreign Subsidiary phases (add and edit forms). */
export default function ForeignFields({ form, set, title, withAccount = false, requireAll = false }: { form: Record<string, string>; set: (k: string, v: string) => void; title: string; withAccount?: boolean; requireAll?: boolean }) {
  const L = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
    <label className="text-xs font-medium text-slate-700 mb-1 block">{children}{req && <span className="text-rose-500 ml-0.5">*</span>}</label>
  )
  return (
    <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-slate-800">{title}</h3>
      <div>
        <L req={requireAll}>Foreign Company Name</L>
        <input required={requireAll} className={input} value={form.foreign_company_name || ''} onChange={e => set('foreign_company_name', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <L req={requireAll}>Country</L>
          <CountrySelect required={requireAll} value={form.country || ''} onChange={v => { set('country', v); set('city', '') }} />
        </div>
        <div>
          <L req={requireAll}>City</L>
          <ComboInput required={requireAll} value={form.city || ''} onChange={v => set('city', v)} options={(() => { const pl = placesFor(form.country); return pl ? [...new Set([...pl.cities, ...pl.regions])] : [] })()} className={input} placeholder="Type or pick a city" />
        </div>
        <div className="sm:col-span-2">
          <L req={requireAll}>Registration No.</L>
          <input required={requireAll} className={input} value={form.registration_no || ''} onChange={e => set('registration_no', e.target.value)} />
        </div>
      </div>
      {withAccount && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <L req>Email</L>
            <input required type="email" className={input} value={form.account_email || ''} onChange={e => set('account_email', e.target.value)} autoComplete="off" />
          </div>
          <div>
            <L req>User Name</L>
            <input required className={input} value={form.account_username || ''} onChange={e => set('account_username', e.target.value)} autoComplete="off" />
          </div>
          <div>
            <L req>Password</L>
            <input required type="text" className={input} value={form.account_password || ''} onChange={e => set('account_password', e.target.value)} autoComplete="off" spellCheck={false} />
          </div>
        </div>
      )}
    </div>
  )
}

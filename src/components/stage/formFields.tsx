'use client'
import { createContext, useContext } from 'react'

// Defined at module level (not inside the modal component) so inputs keep focus while typing.
interface Ctx { form: Record<string, string>; set: (k: string, v: string) => void }
export const FormCtx = createContext<Ctx>({ form: {}, set: () => {} })

const inputCls = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

export function Field({ label, name, type = 'text', required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  const { form, set } = useContext(FormCtx)
  return (
    <div>
      <label className="text-xs font-medium text-slate-700 mb-1 block">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={form[name] || ''}
        onChange={e => set(name, e.target.value)}
        className={inputCls}
      />
    </div>
  )
}

export function Select({ label, name, options, required = false, onChange }: {
  label: string
  name: string
  options: { value: string; label: string }[]
  required?: boolean
  onChange?: (val: string) => void
}) {
  const { form, set } = useContext(FormCtx)
  return (
    <div>
      <label className="text-xs font-medium text-slate-700 mb-1 block">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <select
        required={required}
        value={form[name] || ''}
        onChange={e => {
          set(name, e.target.value)
          if (onChange) onChange(e.target.value)
        }}
        className={inputCls + ' text-slate-700'}
      >
        <option value="">Select option...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

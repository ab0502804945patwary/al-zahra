'use client'
import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, Copy, ExternalLink, FileCheck, FileText, IdCard, Loader2, MessageCircle, Phone, User, Users, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { openFromR2 } from '@/lib/compress'
import { formatDate } from '@/lib/utils'
import { SH_DOCS, VERIFY_ITEMS, type CompanyDoc, type Shareholder } from '@/components/companies/FormParts'

type Row = [label: string, value: React.ReactNode]

/** Label / value pairs; empty values are not shown. */
function Details({ rows }: { rows: Row[] }) {
  const filled = rows.filter(r => r[1] !== null && r[1] !== undefined && r[1] !== '')
  if (!filled.length) return null
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
      {filled.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
          <dd className="text-xs text-slate-800 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <section className="border border-slate-200 rounded-xl p-3.5">
      <h4 className="flex items-center gap-2 mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-700">
        <Icon className="w-4 h-4 text-blue-600" />{title}
      </h4>
      {children}
    </section>
  )
}

/** Phone number with call, WhatsApp and copy buttons. */
function PhoneValue({ number }: { number?: string | null }) {
  const [copied, setCopied] = useState(false)
  if (!number) return null
  const digits = number.replace(/\D/g, '')
  // local Saudi mobile numbers (05...) need the country code for WhatsApp; other local numbers get no WhatsApp button
  const wa = /^05\d{8}$/.test(digits) ? `966${digits.slice(1)}` : digits.startsWith('00') ? digits.slice(2) : digits.startsWith('0') ? '' : digits
  const btn = 'p-1 rounded text-blue-600 hover:bg-blue-50'
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="font-mono mr-1">{number}</span>
      <a href={`tel:${number.replace(/[^\d+]/g, '')}`} title="Call" className={btn}><Phone className="w-3.5 h-3.5" /></a>
      {wa.length >= 8 && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="p-1 rounded text-emerald-600 hover:bg-emerald-50"><MessageCircle className="w-3.5 h-3.5" /></a>}
      <button type="button" title="Copy" className={btn}
        onClick={() => navigator.clipboard?.writeText(number).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})}>
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </span>
  )
}

const date = (d?: string | null) => (d ? formatDate(d) : '')

/** Read-only popup with the client details of one company, opened from a workflow phase list. */
export default function ClientInfoDialog({ stageId, companyId, onClose }: { stageId: string; companyId: string; onClose: () => void }) {
  const [company, setCompany] = useState<any>(null)
  const [error, setError] = useState('')
  const [fileError, setFileError] = useState('')

  useEffect(() => {
    const stop = new AbortController()
    fetch('/api/stage/client', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: stageId, company_id: companyId }), signal: stop.signal })
      .then(async res => {
        const out = await res.json().catch(() => ({} as any))
        if (!res.ok || !out.company) throw new Error(out.error || 'Could not load the client information.')
        setCompany(out.company)
      })
      .catch(e => { if (!stop.signal.aborted) setError(e?.message || 'Cannot reach the server.') })
    return () => stop.abort()
  }, [stageId, companyId])

  async function openFile(key: string) {
    setFileError('')
    try { await openFromR2(key) } catch (e: any) { setFileError(e?.message || 'Could not open the file.') }
  }

  async function openDoc(d: CompanyDoc) {
    setFileError('')
    if (d.url) { if (/^https?:\/\//i.test(d.url)) window.open(d.url, '_blank', 'noopener'); return }
    if (!d.path) return
    if (d.store === 'r2') { await openFile(d.path); return }
    // files attached before R2 are still in Supabase storage
    const { data, error: err } = await createClient().storage.from('company-docs').createSignedUrl(d.path, 3600)
    if (err || !data) { setFileError('Could not open the file: ' + (err?.message || 'unknown error')); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  const c = company || {}
  const holders: Shareholder[] = Array.isArray(c.shareholders) ? c.shareholders : []
  const docs: CompanyDoc[] = Array.isArray(c.company_documents) ? c.company_documents : []
  const admin: Row[] = [
    ['Name', c.admin_name || c.ceo_gm_name],
    ['Iqama No.', c.admin_iqama_no || c.iqama_no],
    ['Iqama Expiry', date(c.admin_iqama_expiry)],
    ['Mobile', (c.admin_mobile) && <PhoneValue number={c.admin_mobile} />],
    ['E-mail', c.admin_email],
  ]
  const numbers: Row[] = [
    ['CR Number', c.cr_number], ['CR Issue Date', date(c.cr_issue_date)], ['CR Expiry Date', date(c.cr_expire_date)],
    ['MISA License No.', c.misa_license_no], ['MISA Issue Date', date(c.misa_issue_date)], ['MISA Expiry Date', date(c.misa_expire_date)],
    ['TIN Number', c.tin_number], ['VAT Number', c.vat_number], ['Chamber Ref', c.chamber_registration_no], ['RJSC Reg. No.', c.rjsc_reg_no],
  ]

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" />
        <Dialog.Content aria-describedby={undefined}
          className="fixed z-50 inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[min(720px,calc(100vw-2rem))] sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col focus:outline-none">
          <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-100">
            <div className="min-w-0">
              <Dialog.Title className="text-sm font-bold text-slate-900 break-words">{c.company_name || 'Client Information'}</Dialog.Title>
              <p className="text-[11px] text-slate-500">
                {[companyId, c.entity_type, c.country_of_origin, c.account_status].filter(Boolean).join(' · ')}
                {c.original_company_name && <span className="block text-slate-400">Previously: {c.original_company_name}</span>}
              </p>
            </div>
            <Dialog.Close title="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X className="w-4 h-4" /></Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {error && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">{error}</div>}
            {!company && !error && <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading client information...</div>}
            {fileError && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">{fileError}</div>}

            {company && (<>
              <Section title="Client Contact" icon={User}>
                <Details rows={[
                  ['Name', c.client_name],
                  ['Phone', c.client_phone && <PhoneValue number={c.client_phone} />],
                  ['WhatsApp', c.whatsapp_number && <PhoneValue number={c.whatsapp_number} />],
                  ['E-mail', c.official_email],
                  ['Present Address', [c.client_present_address, c.present_city, c.present_country].filter(Boolean).join(', ')],
                  ['National Address', c.national_address],
                ]} />
                {!c.client_name && !c.client_phone && <p className="text-xs text-slate-400">No contact details saved.</p>}
              </Section>

              <Section title="Shareholders / Partners" icon={Users}>
                {holders.length === 0 ? (
                  c.shareholders_name || c.shareholder_phone
                    ? <Details rows={[['Name', c.shareholders_name], ['Phone', c.shareholder_phone && <PhoneValue number={c.shareholder_phone} />]]} />
                    : <p className="text-xs text-slate-400">No shareholder saved.</p>
                ) : (
                  <div className="space-y-3">
                    {holders.map((s, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-blue-700">{i + 1}. {s.name || 'Shareholder'}</span>
                          {s.passport_file?.key && (
                            <button type="button" onClick={() => openFile(s.passport_file!.key)} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200 bg-white rounded-md hover:bg-blue-50">
                              <FileText className="w-3.5 h-3.5" /> View passport
                            </button>
                          )}
                        </div>
                        <Details rows={[
                          ['Designation', s.designation], ['Shareholding', s.share_percent && `${s.share_percent}%`],
                          ['Nationality', s.nationality], ['Passport No.', s.passport_no],
                          ['Phone', s.phone && <PhoneValue number={s.phone} />], ['E-mail', s.email],
                          ['Date of Birth', date(s.dob)], ['TIN No.', s.tin_no],
                          ["Father's Name", s.father_name], ["Mother's Name", s.mother_name],
                          ['Address', s.address],
                          ['Documents', SH_DOCS.filter(d => s.docs?.[d.key]).map(d => `${d.label}: ${s.docs[d.key]}`).join(' · ')],
                        ]} />
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {admin.some(r => r[1]) && <Section title="Main Administrator" icon={IdCard}><Details rows={admin} /></Section>}

              {docs.length > 0 && (
                <Section title="Documents" icon={FileText}>
                  <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                    {docs.map(d => (
                      <li key={d.id} className="flex items-center gap-3 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-800 truncate">
                            {VERIFY_ITEMS.find(v => v.key === d.type)?.label || d.type}
                            {d.shareholder != null && ` · Shareholder ${d.shareholder + 1}${holders[d.shareholder]?.name ? ` (${holders[d.shareholder].name})` : ''}`}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{d.name}</div>
                        </div>
                        <button type="button" onClick={() => openDoc(d)} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-md">
                          <ExternalLink className="w-3 h-3" /> Open
                        </button>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {numbers.some(r => r[1]) && <Section title="License Numbers" icon={FileCheck}><Details rows={numbers} /></Section>}
            </>)}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

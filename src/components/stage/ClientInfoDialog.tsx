'use client'
import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Building2, Check, ClipboardCheck, Copy, ExternalLink, FileCheck, FileText, IdCard, Loader2, Mail, MapPin, MessageCircle, Phone, User, Users, X } from 'lucide-react'
import { STAGE_CONFIG } from '@/lib/stageData'
import { Flag } from '@/components/ui/CountrySelect'
import { createClient } from '@/lib/supabase/client'
import { openFromR2 } from '@/lib/compress'
import { formatDate } from '@/lib/utils'
import { SH_DOCS, VERIFY_ITEMS, type CompanyDoc, type DocCheck, type Shareholder } from '@/components/companies/FormParts'

type Row = [label: string, value: React.ReactNode]

const empty = (v: React.ReactNode) => v === null || v === undefined || v === '' || v === false

/** Label / value pairs. `all` keeps the empty ones (shown as a dash) so a whole registration form can be checked. */
function Details({ rows, all = false }: { rows: Row[]; all?: boolean }) {
  const shown = all ? rows : rows.filter(r => !empty(r[1]))
  if (!shown.length) return null
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
      {shown.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
          <dd className="text-xs text-slate-800 break-words">{empty(value) ? <span className="text-slate-300">—</span> : value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** A saved report link; anything that is not a web address is shown as plain text. */
const webLink = (url?: string | null) =>
  url && /^https?:\/\//i.test(url) ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Open link</a> : url

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4">
      <h4 className="flex items-center gap-2 mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-700">
        <Icon className="w-4 h-4 text-blue-600" />{title}
      </h4>
      {children}
    </section>
  )
}

// local Saudi mobile numbers (05...) need the country code for WhatsApp; other local numbers get no WhatsApp button
const whatsappOf = (number: string) => {
  const d = number.replace(/\D/g, '')
  const wa = /^05\d{8}$/.test(d) ? `966${d.slice(1)}` : d.startsWith('00') ? d.slice(2) : d.startsWith('0') ? '' : d
  return wa.length >= 8 ? `https://wa.me/${wa}` : ''
}

/** Phone number with call, WhatsApp and copy buttons. `large` = full-width labelled buttons. */
function PhoneValue({ number, large = false }: { number?: string | null; large?: boolean }) {
  const [copied, setCopied] = useState(false)
  if (!number) return null
  const wa = whatsappOf(number)
  const base = large ? 'flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition' : 'p-1 rounded transition'
  const copy = () => navigator.clipboard?.writeText(number).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  const buttons = (<>
    <a href={`tel:${number.replace(/[^\d+]/g, '')}`} title="Call" className={`${base} ${large ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-blue-600 hover:bg-blue-50'}`}>
      <Phone className="w-3.5 h-3.5" />{large && 'Call'}
    </a>
    {wa && (
      <a href={wa} target="_blank" rel="noopener noreferrer" title="WhatsApp" className={`${base} ${large ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-emerald-600 hover:bg-emerald-50'}`}>
        <MessageCircle className="w-3.5 h-3.5" />{large && 'WhatsApp'}
      </a>
    )}
    <button type="button" title="Copy number" onClick={copy} className={`${base} ${large ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' : 'text-slate-500 hover:bg-slate-100'}`}>
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}{large && (copied ? 'Copied' : 'Copy')}
    </button>
  </>)
  if (large) {
    return (
      <div>
        <div className="font-mono text-lg font-semibold text-slate-900 mb-2 break-all">{number}</div>
        <div className="flex gap-2">{buttons}</div>
      </div>
    )
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-0.5">
      <span className="font-mono mr-1">{number}</span>{buttons}
    </span>
  )
}

/** One line of the contact card; nothing when empty. */
function Line({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Icon className="w-3.5 h-3.5" /></span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="text-xs text-slate-800 break-words">{value}</div>
      </div>
    </div>
  )
}

function StatusChip({ label, status }: { label?: string; status?: string }) {
  const tone = status === 'Collected' || status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200'
  return <span className={`inline-block shrink-0 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${tone}`}>{label ? `${label}: ` : ''}{status || 'Not set'}</span>
}

function FileRow({ title, name, onOpen }: { title: string; name: string; onOpen: () => void }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-slate-800 truncate">{title}</div>
        <div className="text-[11px] text-slate-500 truncate">{name}</div>
      </div>
      <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-md">
        <ExternalLink className="w-3 h-3" /> Open
      </button>
    </li>
  )
}

const initial = (name?: string | null) => (name || '').trim().charAt(0).toUpperCase()

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
  const address = [c.client_present_address, c.present_city, c.present_country].filter(Boolean).join(', ')
  // show a second WhatsApp number only when it is a different one
  const digits = (n?: string | null) => String(n || '').replace(/\D/g, '')
  const otherWhatsapp = digits(c.whatsapp_number) && digits(c.whatsapp_number) !== digits(c.client_phone) ? c.whatsapp_number : null
  const checks: Record<string, DocCheck> = c.doc_checks || {}
  const auditFiles: { key: string; name: string }[] = Array.isArray(c.sa_audit_files) ? c.sa_audit_files : []
  const categories = (Array.isArray(c.selected_phases) ? c.selected_phases : []).map((id: string) => STAGE_CONFIG[id]?.label || `Phase ${id}`).join(', ')
  const numbers: Row[] = [
    ['CR Number', c.cr_number], ['CR Issue Date', date(c.cr_issue_date)], ['CR Expiry Date', date(c.cr_expire_date)],
    ['MISA License No.', c.misa_license_no], ['MISA Issue Date', date(c.misa_issue_date)], ['MISA Expiry Date', date(c.misa_expire_date)],
    ['TIN Number', c.tin_number], ['VAT Number', c.vat_number], ['Chamber Ref', c.chamber_registration_no], ['GOSI / Qiwa Status', c.gosi_qiwa_status],
  ]
  const rjsc: Row[] = [
    ['RJSC Reg. No.', c.rjsc_reg_no], ['Incorporation Date', date(c.rjsc_incorporation_date)], ['Annual Return Due', date(c.rjsc_annual_return_due)],
    ['Issue No', c.rjsc_issue_no], ['Auditor / Firm', c.rjsc_auditor], ['Company Type', c.rjsc_company_type],
  ]
  const audit = (p: 'bd' | 'sa'): Row[] => [
    ['Last Audit Date', date(c[`${p}_last_audit_date`])], ['Audit Status', c[`${p}_audit_status`]], ['Next Audit Due', date(c[`${p}_next_audit_due`])],
    ['Financial Year', c[`${p}_financial_year`]], ['Auditor / Audit Firm', c[`${p}_auditor`]], ['Audit Report', webLink(c[`${p}_audit_report`])],
    ['Additional Information', c[`${p}_audit_notes`]],
  ]
  const extra: [string, Row[]][] = [['License Numbers', numbers], ['Bangladesh Company (RJSC)', rjsc], ['Bangladesh Audit', audit('bd')], ['Saudi Audit', audit('sa')]]

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" />
        <Dialog.Content aria-describedby={undefined}
          className="fixed z-50 inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[min(720px,calc(100vw-2rem))] sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col focus:outline-none">
          <div className="flex items-start gap-3 px-4 sm:px-5 py-4 bg-gradient-to-r from-blue-700 to-blue-500 text-white sm:rounded-t-2xl">
            <span className="w-11 h-11 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center shrink-0"><Building2 className="w-5 h-5" /></span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-bold leading-snug break-words">{c.company_name || 'Client Information'}</Dialog.Title>
              {c.original_company_name && c.original_company_name !== c.company_name && <p className="text-[11px] text-blue-100">Previously: {c.original_company_name}</p>}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] font-semibold">
                <span className="px-2 py-0.5 rounded-md bg-white text-blue-700 font-mono">{companyId}</span>
                {c.entity_type && <span className="px-2 py-0.5 rounded-md bg-white/15">{c.entity_type}</span>}
                {c.country_of_origin && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/15"><Flag country={c.country_of_origin} />{c.country_of_origin}</span>}
                {c.account_status && <span className={`px-2 py-0.5 rounded-md ${c.account_status === 'Inactive' ? 'bg-rose-500' : 'bg-emerald-500'}`}>{c.account_status}</span>}
              </div>
            </div>
            <Dialog.Close title="Close" className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/15"><X className="w-4 h-4" /></Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50 sm:rounded-b-2xl">
            {error && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">{error}</div>}
            {!company && !error && <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading client information...</div>}
            {fileError && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">{fileError}</div>}

            {company && (<>
              <section className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-14 h-14 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center shrink-0">{initial(c.client_name) || <User className="w-6 h-6" />}</span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Client</div>
                      <div className="text-base font-bold text-slate-900 break-words">{c.client_name || 'Name not saved'}</div>
                    </div>
                  </div>
                  {c.client_phone ? <PhoneValue number={c.client_phone} large /> : <p className="self-center text-xs text-slate-400">No phone number saved.</p>}
                </div>
                {(otherWhatsapp || c.official_email || address || c.national_address) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                    {otherWhatsapp && (
                      <div className="flex items-start gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><MessageCircle className="w-3.5 h-3.5" /></span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">WhatsApp</div>
                          <div className="text-xs text-slate-800"><PhoneValue number={otherWhatsapp} /></div>
                        </div>
                      </div>
                    )}
                    <Line icon={Mail} label="E-mail" value={c.official_email} />
                    <Line icon={MapPin} label="Present Address" value={address} />
                    <Line icon={MapPin} label="National Address" value={c.national_address} />
                  </div>
                )}
              </section>

              <Section title="Company Registration" icon={Building2}>
                <Details all rows={[
                  ['Company ID', companyId], ['Company Name', c.company_name], ['Nationality', c.country_of_origin],
                  ['License Type', c.entity_type], ['Status', c.account_status], ['Service Type', c.service_type === 'renewal' ? 'Renewal Company' : 'New Company'],
                  ['Registered On', date(c.created_at)], ['Work Categories', categories],
                ]} />
              </Section>

              <Section title="Shareholders / Partners" icon={Users}>
                {holders.length === 0 ? (
                  c.shareholders_name || c.shareholder_phone
                    ? <Details rows={[['Name', c.shareholders_name], ['Phone', c.shareholder_phone && <PhoneValue number={c.shareholder_phone} />]]} />
                    : <p className="text-xs text-slate-400">No shareholder was entered for this company.</p>
                ) : (
                  <div className="space-y-3">
                    {holders.map((s, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2.5 px-3 py-2 bg-slate-50 border-b border-slate-200">
                          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{initial(s.name) || i + 1}</span>
                          <div className="min-w-[9rem] flex-1">
                            <div className="text-xs font-bold text-slate-900 break-words">{s.name || `Shareholder ${i + 1}`}</div>
                            {s.designation && <div className="text-[11px] text-slate-500">{s.designation}</div>}
                          </div>
                          {s.share_percent && <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold">{s.share_percent}%</span>}
                          {s.passport_file?.key ? (
                            <button type="button" onClick={() => openFile(s.passport_file!.key)} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200 bg-white rounded-md hover:bg-blue-50">
                              <FileText className="w-3.5 h-3.5" /> View passport
                            </button>
                          ) : <span className="text-[11px] text-slate-400">Passport not uploaded</span>}
                        </div>
                        <div className="p-3 space-y-3">
                          <Details all rows={[
                            ["Father's Name", s.father_name], ["Mother's Name", s.mother_name], ['Date of Birth', date(s.dob)],
                            ['Nationality', s.nationality], ['Passport No.', s.passport_no], ['TIN No.', s.tin_no],
                            ['Phone', s.phone && <PhoneValue number={s.phone} />], ['E-mail', s.email], ['Shareholding', s.share_percent && `${s.share_percent}%`],
                            ['Designation', s.designation], ['Address', s.address],
                          ]} />
                          <div className="flex flex-wrap gap-1.5">
                            {SH_DOCS.map(d => <StatusChip key={d.key} label={d.label} status={s.docs?.[d.key]} />)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Main Administrator" icon={IdCard}>
                <Details all rows={[
                  ['Full Name', c.admin_name || c.ceo_gm_name], ['Iqama Number', c.admin_iqama_no || c.iqama_no], ['Iqama Expiry', date(c.admin_iqama_expiry)],
                  ['Mobile', c.admin_mobile && <PhoneValue number={c.admin_mobile} />], ['E-mail', c.admin_email], ['Account / Access Setup', c.admin_access_setup],
                ]} />
              </Section>

              <Section title="Documents" icon={ClipboardCheck}>
                <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg mb-3">
                  {VERIFY_ITEMS.map(v => (
                    <li key={v.key} className="flex items-center gap-3 px-3 py-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-slate-800">{v.label}</div>
                        {checks[v.key]?.remarks && <div className="text-[11px] text-slate-500 break-words">{checks[v.key].remarks}</div>}
                      </div>
                      <StatusChip status={checks[v.key]?.status} />
                    </li>
                  ))}
                </ul>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Attached files</div>
                {docs.length + auditFiles.length + holders.filter(h => h.passport_file?.key).length === 0 ? (
                  <p className="text-xs text-slate-400">No file was attached.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                    {holders.map((h, i) => h.passport_file?.key && (
                      <FileRow key={`p${i}`} title={`Passport · Shareholder ${i + 1}${h.name ? ` (${h.name})` : ''}`} name={h.passport_file.name} onOpen={() => openFile(h.passport_file!.key)} />
                    ))}
                    {docs.map(d => (
                      <FileRow key={d.id} name={d.name} onOpen={() => openDoc(d)}
                        title={`${VERIFY_ITEMS.find(v => v.key === d.type)?.label || d.type}${d.shareholder != null ? ` · Shareholder ${d.shareholder + 1}${holders[d.shareholder]?.name ? ` (${holders[d.shareholder].name})` : ''}` : ''}`} />
                    ))}
                    {auditFiles.map(f => <FileRow key={f.key} title="Saudi audit file" name={f.name} onOpen={() => openFile(f.key)} />)}
                  </ul>
                )}
              </Section>

              {extra.filter(([, rows]) => rows.some(r => !empty(r[1]))).map(([title, rows]) => (
                <Section key={title} title={title} icon={FileCheck}><Details rows={rows} /></Section>
              ))}
            </>)}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

'use client'
import { Flag } from '@/components/ui/CountrySelect'
import OwnerTag from '@/components/ui/OwnerTag'
import { useState, useEffect } from 'react'
import { Plus, Edit2, Building2, Search, ExternalLink, Sparkles, LayoutGrid, List, RefreshCw } from 'lucide-react'
import { Company } from '@/lib/types'
import CompanyModal, { computeNextCompanyId } from './CompanyModal'
import { matchesQuery } from '@/lib/search'
import { createClient } from '@/lib/supabase/client'
import ExpiryAlerts from '@/components/dashboard/ExpiryAlerts'

function StatusSwitch({ on, busy, onClick }: { on: boolean; busy: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} title={on ? 'Turn off (Inactive)' : 'Turn on (Active)'} aria-pressed={on}
      className={`relative w-9 h-5 rounded-full transition shrink-0 ${on ? 'bg-emerald-500' : 'bg-slate-300'} ${busy ? 'opacity-60' : ''}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  )
}

interface Props { companies: Company[]; mode?: 'new' | 'renewal'; isAdmin?: boolean; owners?: Record<string, string>; ownerAvatars?: Record<string, string> }

// Only an admin can edit or delete a company. Staff can look and register new ones.
/** Date the company was registered (Saudi time), e.g. 2026-11-25 */
const regDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' }) : '—')

export default function CompaniesClient({ companies: initialCompanies, mode = 'new', isAdmin = false, owners = {}, ownerAvatars = {} }: Props) {
  const renewalMode = mode === 'renewal'
  const [companiesList, setCompaniesList] = useState<Company[]>(initialCompanies)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all')
  const [toggling, setToggling] = useState<string | null>(null)
  const [selected, setSelected] = useState<Company | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE = 10
  const [ownerSel, setOwnerSel] = useState('')
  const [licSel, setLicSel] = useState('')
  const [view, setView] = useState<'grid' | 'list'>(mode === 'renewal' ? 'list' : 'grid')

  useEffect(() => {
    try {
      const v = localStorage.getItem(`alzahra_companies_view_${mode}`)
      if (v === 'grid' || v === 'list') setView(v)
    } catch {}
  }, [])

  function changeView(v: 'grid' | 'list') {
    setView(v)
    try { localStorage.setItem(`alzahra_companies_view_${mode}`, v) } catch {}
  }

  const isRenewal = (c: Company) => c.service_type === 'renewal'
  const TypeBadge = ({ company }: { company: Company }) => isRenewal(company) ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <RefreshCw className="w-2.5 h-2.5" /> Renewal Company
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
      New Company
    </span>
  )

  // Server data is the source of truth
  useEffect(() => { setCompaniesList(initialCompanies) }, [initialCompanies])

  function handleSave(savedCompany: Company) {
    setCompaniesList(prev => {
      const index = prev.findIndex(c => c.id === savedCompany.id || c.company_id === savedCompany.company_id)
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = { ...prev[index], ...savedCompany }
        return updated
      }
      return [savedCompany, ...prev]
    })
  }

  // Admin: switch a company on / off without opening the form
  async function toggleStatus(c: Company) {
    const next = c.account_status === 'Inactive' ? 'Active' : 'Inactive'
    setToggling(c.id)
    const { error } = await createClient().from('companies').update({ account_status: next }).eq('id', c.id)
    setToggling(null)
    if (error) { alert('Could not change the status: ' + error.message); return }
    setCompaniesList(prev => prev.map(x => (x.id === c.id ? { ...x, account_status: next } : x)))
  }

  function handleDelete(id: string) {
    setCompaniesList(prev => prev.filter(c => c.id !== id))
  }

  // staff only see their own companies here, so the real next ID comes from the database
  const [dbNextId, setDbNextId] = useState('')
  useEffect(() => { createClient().rpc('next_company_id').then(({ data }) => { if (data) setDbNextId(data as string) }) }, [])
  const nextAutoId = dbNextId || computeNextCompanyId(companiesList)

  // New and renewal companies live on separate pages
  const modeList = companiesList.filter(c => (renewalMode ? isRenewal(c) : !isRenewal(c)))
  // newest first on screen; SL numbers stay fixed (oldest = 1)
  const serialOf = (c: Company) => modeList.length - modeList.indexOf(c)
  const filtered = modeList.filter(c =>
    (!ownerSel || (ownerSel === '__none' ? !c.created_by : c.created_by === ownerSel)) &&
    (!licSel || c.entity_type === licSel) &&
    (statusFilter === 'all' || (statusFilter === 'Inactive') === (c.account_status === 'Inactive')) &&
    matchesQuery(search, serialOf(c), [
      c.company_id, c.company_name, c.country_of_origin, c.entity_type, c.client_name, c.client_phone,
      c.whatsapp_number, c.official_email, c.cr_number, c.misa_license_no, c.tin_number, c.vat_number,
      c.ceo_gm_name, c.iqama_no, c.shareholders_name, c.shareholder_phone, c.bank_name, c.account_number,
      c.rjsc_reg_no,
    ])
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const cur = Math.min(page, pages)
  const pageRows = filtered.slice((cur - 1) * PAGE, cur * PAGE)

  // soonest upcoming (or already passed) due date of a renewal company
  const nextExpiry = (c: Company) => {
    const dates = [c.cr_expire_date, c.misa_expire_date, c.rjsc_annual_return_due, c.bd_next_audit_due, c.sa_next_audit_due].filter(Boolean) as string[]
    if (!dates.length) return null
    const d = dates.sort()[0]
    const days = Math.round((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
    return { date: d, days }
  }

  // Form opens inside the page area (sidebar stays visible)
  if (showAdd) {
    return <CompanyModal lockedType={renewalMode ? 'renewal' : 'a2z'} existingCompanies={companiesList} onClose={() => setShowAdd(false)} onSave={handleSave} />
  }
  if (selected && isAdmin) {
    return <CompanyModal lockedType={renewalMode ? 'renewal' : 'a2z'} company={selected} ownerOptions={isAdmin ? owners : undefined} existingCompanies={companiesList} onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />
  }

  return (
    <div className="space-y-6 w-full max-w-[2000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{renewalMode ? 'Renewal Companies' : 'Company Register'}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Central repository for statutory entity profiles, identifiers, and compliance dossiers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Next Auto ID: <strong className="font-bold">{nextAutoId}</strong></span>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> {renewalMode ? 'Add Renewal Company' : 'Register Corporate Entity'}
          </button>
        </div>
      </div>

      {/* Search and filters */}
      {renewalMode && <ExpiryAlerts companies={modeList} isAdmin={isAdmin} owners={owners} ownerAvatars={ownerAvatars} />}

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={renewalMode ? 'Search name, ID, serial no., phone, country, CR, RJSC...' : 'Search name, ID, serial no., phone, country, CR, MISA...'}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filtered.length}</span> of {modeList.length}
          </div>
          {!renewalMode && isAdmin && (
            <select value={ownerSel} onChange={e => { setOwnerSel(e.target.value); setPage(1) }} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700">
              <option value="">All employees</option>
              {Object.entries(owners).filter(([id]) => modeList.some(c => c.created_by === id)).sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              {modeList.some(c => !c.created_by) && <option value="__none">AL ZAHRA (no person)</option>}
            </select>
          )}
          {!renewalMode && (
            <select value={licSel} onChange={e => { setLicSel(e.target.value); setPage(1) }} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700">
              <option value="">All license types</option>
              {['Trading License', 'Service License', 'Service to Trade'].map(l => <option key={l} value={l}>{l} ({modeList.filter(c => c.entity_type === l).length})</option>)}
            </select>
          )}
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700">
            <option value="all">All status</option>
            <option value="Active">Active ({modeList.filter(c => c.account_status !== 'Inactive').length})</option>
            <option value="Inactive">Inactive ({modeList.filter(c => c.account_status === 'Inactive').length})</option>
          </select>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button onClick={() => changeView('grid')} title="Grid view" className={`p-1.5 rounded-md transition ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => changeView('list')} title="List view" className={`p-1.5 rounded-md transition ${view === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
              <tr>
                {['SL', 'ID', 'Company', 'Registered on', ...(isAdmin ? ['Registered by'] : []), 'Nationality', 'Service Type', 'License', 'CR No.', 'MISA No.', renewalMode ? 'Next Due' : 'CR Expiry', 'Status', ''].map(h => (
                  <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map(c => (
                <tr key={c.id} className={`hover:bg-slate-50/70 ${c.account_status === 'Inactive' ? 'opacity-60' : ''}`}>
                  <td className="px-3 py-2.5 text-slate-400 font-mono">{serialOf(c)}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{c.company_id}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{c.company_name}{c.original_company_name && <div className="text-[10px] font-normal text-slate-400">Previously: {c.original_company_name}</div>}{c.workflow_completed_at && <div className="text-[10px] font-semibold text-emerald-700">From workflow · finished {c.workflow_completed_at}</div>}</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono">{regDate(c.created_at)}</td>
                  {isAdmin && <td className="px-3 py-2.5 text-slate-600"><OwnerTag name={c.created_by ? (owners[c.created_by] || 'Unknown') : null} avatar={c.created_by ? ownerAvatars[c.created_by] : null} /></td>}
                  <td className="px-3 py-2.5 text-slate-600"><span className="inline-flex items-center gap-1"><Flag country={c.country_of_origin} />{c.country_of_origin}</span></td>
                  <td className="px-3 py-2.5"><TypeBadge company={c} /></td>
                  <td className="px-3 py-2.5 text-slate-600">{c.entity_type || '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-600">{c.cr_number || '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-600">{c.misa_license_no || '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-600">{renewalMode ? (() => { const n = nextExpiry(c); return n ? <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${n.days < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : n.days <= 30 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{n.date} · {n.days < 0 ? `${-n.days}d overdue` : `${n.days}d`}</span> : '—' })() : (c.cr_expire_date || '—')}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${c.account_status === 'Inactive' ? 'text-slate-400' : 'text-emerald-700'}`}>{c.account_status === 'Inactive' ? 'Inactive' : 'Active'}</span>
                      {isAdmin && <StatusSwitch on={c.account_status !== 'Inactive'} busy={toggling === c.id} onClick={() => toggleStatus(c)} />}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {isAdmin && <button onClick={() => setSelected(c)} className="p-1.5 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-700"><Edit2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={13} className="text-center py-12 text-slate-400">No matching corporate entities located</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid */}
      {view === 'grid' && <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {pageRows.map(company => (
          <div
            key={company.id}
            className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
          >
            {/* Card Header (Clean White / Light Slate) */}
            <div>
              <div className="bg-slate-50/70 p-4 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-sm leading-tight text-slate-900">{company.company_name}</div>
                      {company.original_company_name && <div className="text-[10px] text-slate-400">Previously: {company.original_company_name}</div>}
                      {company.workflow_completed_at && <div className="text-[10px] font-semibold text-emerald-700">From workflow · finished {company.workflow_completed_at}</div>}
                      <div className="text-[10px] text-slate-400">Registered on {regDate(company.created_at)}</div>
                      <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 text-[11px]">
                          {company.company_id}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 font-sans inline-flex items-center gap-1"><Flag country={company.country_of_origin} />{company.country_of_origin}</span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <StatusSwitch on={company.account_status !== 'Inactive'} busy={toggling === company.id} onClick={() => toggleStatus(company)} />
                      <button
                        onClick={() => setSelected(company)}
                        className="p-1.5 hover:bg-slate-200/60 rounded-md transition text-slate-400 hover:text-slate-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-2 text-xs divide-y divide-slate-100">
                {[
                  { label: 'License Classification', value: company.entity_type },
                  { label: 'CR Registration Ref', value: company.cr_number },
                  { label: 'MISA License Ref', value: company.misa_license_no },
                  { label: 'TIN / Tax Number', value: company.tin_number },
                  { label: 'Official Corporate Email', value: company.official_email },
                  { label: 'WhatsApp Liaison', value: company.whatsapp_number },
                  { label: 'Authorized General Manager', value: company.ceo_gm_name },
                  { label: 'Depository Bank', value: company.bank_name },
                ].filter(r => r.value).map((row, idx) => (
                  <div key={row.label} className={`flex justify-between gap-3 ${idx > 0 ? 'pt-2' : ''}`}>
                    <span className="text-slate-400 shrink-0">{row.label}</span>
                    <span className="text-slate-800 font-medium text-right truncate font-mono text-[11px]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer */}
            <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${company.account_status === 'Inactive' ? 'bg-slate-100 text-slate-500 border-slate-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${company.account_status === 'Inactive' ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                  {company.account_status === 'Inactive' ? 'Inactive' : 'Active'}
                </span>
                <TypeBadge company={company} />
              </div>

            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-slate-600">No matching corporate entities located</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your query or register a new company record</p>
          </div>
        )}
      </div>}

      {filtered.length > PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>Showing <b>{(cur - 1) * PAGE + 1}</b> to <b>{Math.min(cur * PAGE, filtered.length)}</b> of <b>{filtered.length}</b></span>
          <div className="flex items-center gap-1">
            <button disabled={cur === 1} onClick={() => setPage(cur - 1)} className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50">‹</button>
            {Array.from({ length: pages }, (_, k) => k + 1).filter(n => n === 1 || n === pages || Math.abs(n - cur) <= 1).map((n, idx, arr) => (
              <span key={n} className="flex items-center">
                {idx > 0 && arr[idx - 1] !== n - 1 && <span className="px-1 text-slate-400">…</span>}
                <button onClick={() => setPage(n)} className={`min-w-8 px-2.5 py-1.5 rounded-md border text-xs font-semibold ${n === cur ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>{n}</button>
              </span>
            ))}
            <button disabled={cur === pages} onClick={() => setPage(cur + 1)} className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50">›</button>
          </div>
        </div>
      )}

      {showAdd && (
        <CompanyModal
          existingCompanies={companiesList}
          onClose={() => setShowAdd(false)}
          onSave={handleSave}
        />
      )}
      {selected && (
        <CompanyModal
          company={selected}
          existingCompanies={companiesList}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

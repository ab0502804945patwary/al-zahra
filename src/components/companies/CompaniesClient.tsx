'use client'
import { Flag } from '@/components/ui/CountrySelect'
import { useState, useEffect } from 'react'
import { Plus, Edit2, Building2, Search, ExternalLink, Globe, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import { Company } from '@/lib/types'
import CompanyModal, { computeNextCompanyId } from './CompanyModal'

interface Props { companies: Company[] }

export default function CompaniesClient({ companies: initialCompanies }: Props) {
  const [companiesList, setCompaniesList] = useState<Company[]>(initialCompanies)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Company | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  // Sync with localStorage for demo/offline resilience
  useEffect(() => {
    try {
      const stored = localStorage.getItem('alzahra_companies_data')
      if (stored) {
        const parsed = JSON.parse(stored) as Company[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCompaniesList(prev => {
            const map = new Map<string, Company>(prev.map(c => [c.id, c]))
            parsed.forEach(item => {
              const prevItem = map.get(item.id)
              map.set(item.id, { ...prevItem, ...item })
            })
            return Array.from(map.values())
          })
        }
      }
    } catch (e) {
      console.warn('Could not read companies from localStorage:', e)
    }
  }, [])

  function handleSave(savedCompany: Company) {
    setCompaniesList(prev => {
      const index = prev.findIndex(c => c.id === savedCompany.id || c.company_id === savedCompany.company_id)
      let updated: Company[]
      if (index >= 0) {
        updated = [...prev]
        updated[index] = { ...prev[index], ...savedCompany }
      } else {
        updated = [savedCompany, ...prev]
      }
      try {
        localStorage.setItem('alzahra_companies_data', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  function handleDelete(id: string) {
    setCompaniesList(prev => {
      const updated = prev.filter(c => c.id !== id)
      try {
        localStorage.setItem('alzahra_companies_data', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const nextAutoId = computeNextCompanyId(companiesList)

  const filtered = companiesList.filter(c =>
    !search ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company_id?.toLowerCase().includes(search.toLowerCase()) ||
    c.country_of_origin?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 w-full max-w-[2000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Corporate Directory & Master Data</h1>
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
            <Plus className="w-4 h-4" /> Register Corporate Entity
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by company name, entity ID, nationality..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filtered.length}</span> of {companiesList.length} entities
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(company => (
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
                      <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 text-[11px]">
                          {company.company_id}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 font-sans inline-flex items-center gap-1"><Flag country={company.country_of_origin} />{company.country_of_origin}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(company)}
                    className="p-1.5 hover:bg-slate-200/60 rounded-md transition text-slate-400 hover:text-slate-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {company.account_status || 'Active Entity'}
              </span>

              {company.drive_link ? (
                <a
                  href={company.drive_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  <ExternalLink className="w-3 h-3" /> Electronic Folder
                </a>
              ) : (
                <span className="text-[11px] text-slate-400">Electronic Folder Ready</span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-slate-600">No matching corporate entities located</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your query or register a new company record</p>
          </div>
        )}
      </div>

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

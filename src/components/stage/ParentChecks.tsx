'use client'
import DossierFiles, { type DossierFile } from './DossierFiles'

// Files stay in the record's dossier_files; "tag" says which item a file belongs to
const ITEMS = [
  { check: 'audit_report_done', tag: 'audit', label: 'Audit Report' },
  { check: 'incorporation_update_done', tag: 'incorporation', label: 'Incorporation Update' },
] as const

type TaggedFile = DossierFile & { tag?: string }

const isTagged = (f: TaggedFile) => ITEMS.some(i => i.tag === f.tag)
const listOf = (files: unknown): TaggedFile[] => (Array.isArray(files) ? files : [])

/** Name of the first item that still has no file, or '' when both have one */
export function missingParentFile(files: unknown) {
  return ITEMS.find(i => !listOf(files).some(f => f.tag === i.tag))?.label || ''
}

/** Parent Entity Verification: Audit Report and Incorporation Update. Once a Completion Date is entered, each must be ticked and have its file. */
export default function ParentChecks({ form, set, folder, onFiles }: {
  form: Record<string, any>
  set: (k: string, v: string) => void
  folder: string
  /** receives an updater, so two uploads running together do not overwrite each other */
  onFiles: (update: (files: TaggedFile[]) => TaggedFile[]) => void
}) {
  const files = listOf(form.dossier_files)
  const required = !!form.complete_date
  // records saved before files were asked per item
  const earlier = files.filter(f => !isTagged(f))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {ITEMS.map(({ check, tag, label }) => (
          <div key={tag} className="space-y-2 p-2.5 border border-slate-200 rounded-lg bg-white">
            <label className="flex items-center gap-2 px-0.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" required={required} className="w-4 h-4 accent-emerald-600" checked={String(form[check]) === 'true'} onChange={e => set(check, e.target.checked ? 'true' : '')} />
              {label}{required && <span className="text-rose-500 -ml-1">*</span>}
            </label>
            <DossierFiles
              required={required}
              compact
              label={`${label} file`}
              folder={folder}
              value={files.filter(f => f.tag === tag)}
              onChange={next => onFiles(all => [...all.filter(f => f.tag !== tag), ...next.map(f => ({ ...f, tag }))])}
            />
          </div>
        ))}
      </div>
      {earlier.length > 0 && (
        <DossierFiles
          compact
          label="Earlier uploaded files"
          folder={folder}
          value={earlier}
          onChange={next => onFiles(all => [...all.filter(isTagged), ...next])}
        />
      )}
    </div>
  )
}

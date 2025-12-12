import { useState, useMemo } from 'react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import type { CampusDocument } from '../../types/file'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

type DocumentSidebarProps = {
  documents: CampusDocument[]
  activeId?: string
  onSelect: (id: string) => void
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  onDelete: (id: string) => void
}

function DocumentSidebar({ documents, activeId, onSelect, loading, error, onRefresh, onDelete }: DocumentSidebarProps) {
  const [search, setSearch] = useState('')

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return documents
    const q = search.toLowerCase()
    return documents.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [documents, search])

  const hasDocs = documents.length > 0

  return (
    <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 lg:w-80 lg:shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Library</h3>
        <div className="flex gap-2">
          {/* ... existing buttons ... */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className={`rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800 ${loading ? 'animate-spin' : ''}`}
              title="Refresh"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-200"
        />
      </div>

      {loading && filteredDocs.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-500">Fetching library...</div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar" style={{ maxHeight: '600px' }}>
        {hasDocs ? (
          filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => {
              const active = doc.id === activeId
              return (
                <div key={doc.id} className="group relative flex items-start">
                  <button
                    type="button"
                    onClick={() => onSelect(doc.id)}
                    className={`flex-1 flex items-start gap-3 rounded-xl p-3 text-left transition-all ${active
                      ? 'bg-primary-50 ring-1 ring-primary-500/30 dark:bg-primary-500/10 dark:ring-primary-500/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-3 h-8 w-1 rounded-r-full bg-primary-500" />
                    )}

                    <div className={`mt-0.5 rounded-lg p-2 ${active ? 'bg-white text-primary-600 shadow-sm dark:bg-primary-500/20 dark:text-primary-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                      <DocumentTextIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm font-semibold ${active ? 'text-primary-900 dark:text-primary-100' : 'text-slate-700 dark:text-slate-200'
                        }`}>
                        {doc.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        {doc.difficulty && (
                          <Badge tone={doc.difficulty === 'Easy' ? 'success' : doc.difficulty === 'Hard' ? 'danger' : 'warning'}>{doc.difficulty}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete ' + doc.title + '?')) onDelete(doc.id); }}
                    className="absolute right-2 top-2 hidden rounded p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 group-hover:block dark:hover:bg-rose-900/30"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )
            })
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">No matches found.</p>
            </div>
          )
        ) : (
          !loading && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center dark:border-slate-700 dark:bg-slate-900/30">
              <DocumentTextIcon className="h-8 w-8 text-slate-300" />
              <div className="px-4 text-sm text-slate-500">
                Library is empty.<br />Upload documents to get started.
              </div>
            </div>
          )
        )}
      </div>
    </aside>
  )
}

export default DocumentSidebar


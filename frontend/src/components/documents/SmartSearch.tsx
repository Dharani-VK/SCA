import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { searchDocuments } from '../../services/api/documents'
import Card from '../common/Card'

type SmartSearchProps = {
    onSelectSource: (source: string) => void
}

export default function SmartSearch({ onSelectSource }: SmartSearchProps) {
    const [query, setQuery] = useState('')
    const [answer, setAnswer] = useState<string | null>(null)
    const [results, setResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)
    const [searched, setSearched] = useState(false)

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!query.trim()) return
        setSearching(true)
        setSearched(true)
        setAnswer(null)
        try {
            const { answer: ans, results: hits } = await searchDocuments(query)
            setResults(hits)
            setAnswer(ans || null)
        } finally {
            setSearching(false)
        }
    }

    return (
        <Card title="Smart Search" subtitle="Find answers across all your documents.">
            <form onSubmit={handleSearch} className="mb-4 relative">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ask a question or search for a concept..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-4 pr-12 text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={searching}
                    className="absolute right-2 top-2 rounded-lg bg-primary-600 p-1.5 text-white hover:bg-primary-500 disabled:opacity-50"
                >
                    <MagnifyingGlassIcon className={`h-5 w-5 ${searching ? 'animate-spin' : ''}`} />
                </button>
            </form>

            {searched && (
                <div className="space-y-4 max-h-[28rem] overflow-y-auto custom-scrollbar">
                    {answer && (
                        <div className="rounded-xl bg-primary-950/30 border border-primary-900/50 p-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-primary-300 mb-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                                AI Answer
                            </h4>
                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{answer}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {results.length > 0 ? (
                            results.map((r, i) => (
                                <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/30 p-3 hover:bg-slate-900 cursor-pointer transition-colors" onClick={() => onSelectSource(r.display_source || r.source)}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-semibold text-primary-400 truncate max-w-[70%]">{r.display_source || r.source}</span>
                                        <span className="text-[10px] text-slate-500">{(r.score * 100).toFixed(0)}% relevant</span>
                                    </div>
                                    <p className="text-xs text-slate-300 line-clamp-2">{r.text}</p>
                                </div>
                            ))
                        ) : (
                            !searching && <p className="text-center text-sm text-slate-500">No relevant matches found.</p>
                        )}
                    </div>
                </div>
            )}
        </Card>
    )
}

import { useEffect, useState } from 'react'
import Card from '../common/Card'
import Badge from '../common/Badge'
import { fetchDocumentDetail, fetchSummary } from '../../services/api/documents'
import type { DocumentDetail } from '../../types/file'
import { SparklesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

type DocumentViewerProps = {
  documentId?: string
}

function DocumentViewer({ documentId }: DocumentViewerProps) {
  const [doc, setDoc] = useState<DocumentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)

  useEffect(() => {
    if (!documentId) {
      setDoc(null)
      setAiSummary(null)
      return
    }

    let canceled = false
    async function load() {
      setLoading(true)
      setAiSummary(null)
      try {
        // Only fetch document detail, skip similar documents to avoid error
        const detail = await fetchDocumentDetail(documentId!)

        if (!canceled) {
          setDoc(detail)
          setError(null)

          // Trigger AI Summary Layer
          if (detail.source) {
            setIsSummarizing(true)
            fetchSummary(detail.source)
              .then(s => {
                if (!canceled) setAiSummary(s)
              })
              .catch(err => {
                console.warn("AI Summary failed", err)
              })
              .finally(() => {
                if (!canceled) setIsSummarizing(false)
              })
          }
        }
      } catch (err) {
        if (!canceled) {
          const message = err instanceof Error ? err.message : 'Unable to load document view'
          setError(message)
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    load()
    return () => {
      canceled = true
    }
  }, [documentId])


  // Handle display of Version/Difficulty
  const headerExtras = doc ? (
    <div className="flex gap-2 text-xs">
      {doc.difficulty && (
        <Badge tone={doc.difficulty === 'Easy' ? 'success' : doc.difficulty === 'Hard' ? 'danger' : 'warning'}>
          {doc.difficulty}
        </Badge>
      )}
      {doc.version && (
        <Badge tone="default">v{doc.version}</Badge>
      )}
    </div>
  ) : null

  const handleDownload = () => {
    if (!aiSummary || !doc) return
    const element = document.createElement("a");
    const file = new Blob([
      `Study Guide: ${doc.source}\n\n${aiSummary}`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.source}_study_guide.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        title={doc?.source || "Knowledge Canvas"}
        subtitle={documentId ? `Viewing document content & metadata.` : 'Select a document to load context.'}
        actions={headerExtras}
        className="flex-1"
      >
        {!documentId && <p className="text-sm text-slate-400">Choose a source to inspect its content.</p>}
        {loading && <p className="text-sm text-slate-400">Loading document content...</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}

        {!loading && !error && (
          <div className="mb-6 space-y-4">
            {/* AI Layer Display */}
            {(isSummarizing || aiSummary) && (
              <div className="rounded-xl bg-purple-900/10 border border-purple-500/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-purple-300">
                    <SparklesIcon className={`h-4 w-4 ${isSummarizing ? 'animate-spin' : ''}`} />
                    {isSummarizing ? "Generating AI Summary..." : "AI Study Guide"}
                  </h4>
                  {aiSummary && !isSummarizing && (
                    <button
                      onClick={handleDownload}
                      className="text-slate-400 hover:text-purple-300 transition-colors p-1"
                      title="Download Study Guide">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {aiSummary && (
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap markdown-body">
                    {aiSummary}
                  </div>
                )}
              </div>
            )}

            {/* Document metadata - clean display */}
            {doc && (
              <div className="text-xs text-slate-500 mt-4">
                📄 Document contains {doc.chunkCount || doc.chunks?.length || 0} sections
                {doc.ingestedAt && ` • Uploaded ${new Date(doc.ingestedAt).toLocaleDateString()}`}
              </div>
            )}
          </div>
        )}

        {/* Raw chunks hidden for cleaner view - AI summary is the focus */}
      </Card>
    </div>
  )
}

export default DocumentViewer

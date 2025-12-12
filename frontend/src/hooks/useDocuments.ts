import { useCallback, useEffect, useState } from 'react'
import type { CampusDocument } from '../types/file'
import { fetchDocuments } from '../services/api/documents'

export function useDocuments() {
  const [documents, setDocuments] = useState<CampusDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const records = await fetchDocuments()
      setDocuments(records)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load documents'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const removeDocument = useCallback(async (id: string) => {
    try {
      await import('../services/api/documents').then(m => m.deleteDocument(id));
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
      setError("Failed to delete document");
      // Re-fetch to sync state just in case
      refresh();
    }
  }, [refresh]);

  return { documents, loading, error, refresh, removeDocument }
}

import { useEffect, useState } from 'react'
import DocumentSidebar from '../components/documents/DocumentSidebar'
import DocumentViewer from '../components/documents/DocumentViewer'
import SmartSearch from '../components/documents/SmartSearch'
import Card from '../components/common/Card'
import { useDocuments } from '../hooks/useDocuments'

function DocumentsPage() {
  const { documents, loading, error, refresh, removeDocument } = useDocuments()
  const [activeDoc, setActiveDoc] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!activeDoc && documents.length > 0) {
      setActiveDoc(documents[0].id)
    }
  }, [documents, activeDoc])

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DocumentSidebar
        documents={documents}
        activeId={activeDoc}
        onSelect={setActiveDoc}
        loading={loading}
        error={error}
        onRefresh={refresh}
        onDelete={removeDocument}
      />
      <div className="flex flex-1 flex-col gap-6">
        <DocumentViewer documentId={activeDoc} />
        <SmartSearch onSelectSource={(src) => {
          // Need to find ID by source name?
          // The sidebar expects ID. If src is filename, we might need to map it.
          // But documents list has IDs.
          const doc = documents.find(d => d.title === src || d.id === src);
          if (doc) setActiveDoc(doc.id);
        }} />
      </div>
    </div>
  )
}

export default DocumentsPage

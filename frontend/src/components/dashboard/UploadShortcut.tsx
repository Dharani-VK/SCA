import Button from '../common/Button'
import Card from '../common/Card'
import { useNavigate } from 'react-router-dom'

function UploadShortcut() {
  const navigate = useNavigate()

  return (
    <Card
      title="Ingest new material"
      subtitle="Upload lecture notes, slides, or research papers to keep your knowledge base fresh."
      actions={
        <Button
          variant="primary"
          onClick={() => navigate('/upload')}
        >
          Open Upload Studio
        </Button>
      }
    >
      <div className="flex flex-col gap-3 text-sm text-slate-300">
        <p>Supported formats: PDF, DOCX, Markdown, Plain text.</p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span className="rounded-full border border-slate-700 px-3 py-1">Auto chunking</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">OCR ready</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">Source tagging</span>
        </div>
      </div>
    </Card>
  )
}

export default UploadShortcut

import Card from '../common/Card'
import Badge from '../common/Badge'
import { formatDistanceToNow } from 'date-fns'
import { DocumentPlusIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const recent = [
  {
    id: 'doc-1',
    title: 'Algorithms Lecture 05',
    owner: 'Prof. Stone',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 30),
    tags: ['Algorithms', 'Lecture'],
  },
  {
    id: 'doc-2',
    title: 'Campus Events Overview',
    owner: 'Student Affairs',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    tags: ['Announcement'],
  },
  {
    id: 'doc-3',
    title: 'AI Ethics Workshop Notes',
    owner: 'Innovation Lab',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    tags: ['AI', 'Workshop'],
  },
]

function RecentFiles() {
  const navigate = useNavigate()

  return (
    <Card
      title="Recent Knowledge"
      subtitle="Latest ingested files ready for smart retrieval."
      actions={
        <button
          className="text-sm text-primary-300 hover:text-primary-100"
          onClick={() => navigate('/documents')}
        >
          View all
        </button>
      }
    >
      <div className="space-y-4">
        {recent.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary-500/10 p-2 text-primary-300">
                  <DocumentPlusIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{doc.title}</p>
                  <p className="text-xs text-slate-400">
                    {doc.owner} • {formatDistanceToNow(doc.uploadedAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {doc.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default RecentFiles

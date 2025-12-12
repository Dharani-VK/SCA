import Card from '../common/Card'
import Button from '../common/Button'
import Badge from '../common/Badge'
import type { UploadQueueItem } from '../../types/file'

type UploadProgressListProps = {
  items: UploadQueueItem[]
  onRemove: (id: string) => void
}

function statusTone(status: UploadQueueItem['status']) {
  switch (status) {
    case 'complete':
      return 'success'
    case 'error':
      return 'danger'
    case 'processing':
      return 'warning'
    default:
      return 'default'
  }
}

function UploadProgressList({ items, onRemove }: UploadProgressListProps) {
  if (!items.length) {
    return (
      <Card title="Upload queue" subtitle="Files ready to be ingested appear here." className="upload-fade-in">
        <div className="flex h-32 flex-col items-center justify-center text-sm text-slate-500">
          No files queued yet.
        </div>
      </Card>
    )
  }

  return (
    <Card title="Upload queue" subtitle="Track ingestion progress in real time." className="upload-fade-in">
      <div className="upload-stagger w-full space-y-4">
        {items.map((item) => {
          const statusLabel = item.status.slice(0, 1).toUpperCase() + item.status.slice(1)

          return (
            <div
              key={item.id}
              className="flex w-full flex-col gap-4 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-semibold text-slate-100" title={item.name}>
                  {item.name}
                </p>
                <p className="text-xs text-slate-500">{item.sizeLabel}</p>
                {item.statusMessage && (
                  <p className="text-xs text-rose-300/90 md:max-w-md">{item.statusMessage}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <div className="relative h-2 min-w-[8rem] flex-1 overflow-hidden rounded-full bg-slate-800 md:w-48 md:flex-none">
                  <div
                    className="absolute inset-y-0 rounded-full bg-primary-500 transition-[width] duration-500 ease-out"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <Badge tone={statusTone(item.status)}>{statusLabel}</Badge>
                <Button variant="ghost" onClick={() => onRemove(item.id)}>
                  Remove
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default UploadProgressList

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import clsx from 'clsx'
import Button from '../common/Button'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'

type UploadDropzoneProps = {
  onFilesSelected: (files: FileList) => void
}

function UploadDropzone({ onFilesSelected }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [active, setActive] = useState(false)

  return (
    <div
      className={clsx(
        'upload-fade-in upload-glow-ring relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-700/80 bg-slate-900/60 p-8 text-center shadow-[0_25px_45px_-28px_rgba(14,116,144,0.65)] transition md:p-12',
        active && 'border-primary-400 bg-primary-500/10'
      )}
      onDragEnter={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setActive(true)
      }}
      onDragOver={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setActive(true)
      }}
      onDragLeave={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setActive(false)
      }}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setActive(false)
        if (event.dataTransfer.files?.length) {
          onFilesSelected(event.dataTransfer.files)
        }
      }}
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/15 text-primary-300">
        <CloudArrowUpIcon className="h-10 w-10" />
      </div>
      <h2 className="mb-3 text-2xl font-semibold text-slate-100 md:text-3xl">Drop files to ingest</h2>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
        Drag in PDFs, Word docs, slide decks, or scanned study material. We index every upload with semantic
        chunking, OCR, and metadata tagging so the assistant can reference it instantly.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Button onClick={() => inputRef.current?.click()}>Browse files</Button>
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">or drag & drop</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          if (event.target.files) {
            onFilesSelected(event.target.files)
            event.target.value = ''
          }
        }}
      />
    </div>
  )
}

export default UploadDropzone

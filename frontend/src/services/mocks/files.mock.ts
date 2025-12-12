import type { UploadQueueItem } from '../../types/file'
import { formatBytes } from '../../utils/formatters'

export async function mockUploadFile(file: File) {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return {
    status: 'ok',
    chunks_added: Math.floor(Math.random() * 45) + 5,
    fileName: file.name,
  }
}

export async function mockListFiles(): Promise<UploadQueueItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return [
    {
      id: 'mock-1',
      name: 'Campus Handbook.pdf',
      sizeLabel: formatBytes(2_560_000),
      progress: 100,
      status: 'complete',
    },
    {
      id: 'mock-2',
      name: 'AI Ethics Notes.md',
      sizeLabel: formatBytes(480_000),
      progress: 72,
      status: 'processing',
    },
  ]
}

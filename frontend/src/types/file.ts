export type UploadQueueItem = {
  id: string
  name: string
  sizeLabel: string
  progress: number
  status: 'pending' | 'processing' | 'complete' | 'error'
  statusMessage?: string
}



export type DocumentChunk = {
  id: string
  text: string
  chunkIndex: number
}

export type DocumentDetail = {
  source: string
  chunkCount: number
  ingestedAt?: string
  summary?: string | null
  chunks: DocumentChunk[]
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  version?: number
  versions?: any[]
}

export type CampusDocument = {
  id: string
  title: string
  owner: string
  uploadedAt: string
  tags: string[]
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  version?: number
}

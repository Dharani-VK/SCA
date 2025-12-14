export type SourceMetadata = {
  source: string
  chunk_index: number
  ingested_at: string
  topic: string
  keywords: string[]
  university: string
  roll_no: string
  u_id: string
  original_filename: string
  version: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SourceMetadata[]
  createdAt: string
}

export type ChatRequest = {
  message: string
  sources?: string[]
  topK?: number
  conversation?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

export type ChatResponse = {
  message: string
  sources: SourceMetadata[]
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
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
  sources: string[]
}

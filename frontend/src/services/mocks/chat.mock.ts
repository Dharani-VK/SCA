import type { ChatRequest, ChatResponse, SourceMetadata } from '../../types/chat'

const createMockSource = (name: string): SourceMetadata => ({
  source: name,
  original_filename: name,
  chunk_index: 0,
  ingested_at: new Date().toISOString(),
  topic: 'Mock Topic',
  keywords: ['mock'],
  university: 'Mock University',
  roll_no: 'MOCK-001',
  u_id: 'mock-user-id',
  version: '1.0'
})

const seeds: Array<{ keyword: string; content: string; sources: SourceMetadata[] }> = [
  {
    keyword: 'policy',
    content: 'Policy 4.2 states that students may reserve lab space until midnight with proper digital credentials.',
    sources: [createMockSource('Student Policy 4.2'), createMockSource('Campus Access Memo')],
  },
  {
    keyword: 'binary search',
    content: 'Binary search operates on sorted collections and halves the search space on each iteration.',
    sources: [createMockSource('Algorithms Lecture 05')],
  },
]

export async function mockAskQuestion(request: ChatRequest): Promise<ChatResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const match = seeds.find((seed) => request.message.toLowerCase().includes(seed.keyword))
  return {
    message: match?.content ?? 'This is a mock response from the Smart Campus AI assistant.',
    sources: match?.sources ?? [createMockSource('Campus Handbook')],
  }
}

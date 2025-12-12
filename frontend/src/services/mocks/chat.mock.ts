import type { ChatRequest, ChatResponse } from '../../types/chat'

const seeds: Array<{ keyword: string; content: string; sources: string[] }> = [
  {
    keyword: 'policy',
    content: 'Policy 4.2 states that students may reserve lab space until midnight with proper digital credentials.',
    sources: ['Student Policy 4.2', 'Campus Access Memo'],
  },
  {
    keyword: 'binary search',
    content: 'Binary search operates on sorted collections and halves the search space on each iteration.',
    sources: ['Algorithms Lecture 05'],
  },
]

export async function mockAskQuestion(request: ChatRequest): Promise<ChatResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const match = seeds.find((seed) => request.message.toLowerCase().includes(seed.keyword))
  return {
    message: match?.content ?? 'This is a mock response from the Smart Campus AI assistant.',
    sources: match?.sources ?? ['Campus Handbook'],
  }
}

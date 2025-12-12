import type { QuizNextPayload, QuizQuestion } from '../../types/quiz'

export async function mockActiveQuizQuestion(payload: QuizNextPayload): Promise<QuizQuestion> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const difficultyCycle = ['easy', 'medium', 'hard'] as const
  const progress = payload.history?.length ?? 0
  const difficulty = difficultyCycle[Math.min(progress, difficultyCycle.length - 1)]
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `mock-${Date.now()}`

  return {
    questionId: `mock-${randomId}`,
    prompt: `Mock ${difficulty} question on ${payload.topic}: Which statement is most accurate?`,
    difficulty,
    options: [
      { id: 'A', text: `${payload.topic} emphasises deliberate practice.` },
      { id: 'B', text: `${payload.topic} discourages studying.` },
      { id: 'C', text: `${payload.topic} requires no preparation.` },
      { id: 'D', text: `${payload.topic} cannot be learned.` },
    ],
    correctOptionId: 'A',
    explanation: `Focusing on deliberate practice is the heart of ${payload.topic}.`,
    sources: [],
    conceptLabel: `${payload.topic} concept ${progress + 1}`,
    questionType: 'mcq',
    focusConcept: payload.topic,
    focusKeywords: ['Sensors', 'Monitoring', 'Analytics'],
  }
}

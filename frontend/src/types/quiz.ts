export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced'

export type QuizDifficulty = 'easy' | 'medium' | 'hard'

export type QuizOption = {
  id: string
  text: string
}

export type QuizQuestion = {
  questionId: string
  prompt: string
  difficulty: QuizDifficulty
  options: QuizOption[]
  correctOptionId: string
  explanation?: string
  sources?: Record<string, unknown>[]
  conceptLabel?: string
  questionType?: 'mcq' | 'scenario' | 'true_false' | 'fill_blank'
  focusConcept?: string
  focusKeywords?: string[]
}

export type QuizHistoryTurn = {
  questionId?: string
  question: string
  selectedOptionId?: string
  correctOptionId?: string
  correctOptionText?: string
  difficulty: QuizDifficulty
  wasCorrect: boolean
  explanation?: string
  conceptLabel?: string
}

export type QuizNextPayload = {
  topic: string
  knowledgeLevel?: KnowledgeLevel
  totalQuestions: number
  history: QuizHistoryTurn[]
  sourceMode: QuizSourceMode
  sourceId?: string
  sessionId?: string
}

export type QuizSourceMode = 'latest' | 'previous' | 'all' | 'custom'

export type QuizQuestionStep = {
  status: 'question'
  question: QuizQuestion
  totalQuestions: number
  remainingQuestions: number
  sourceLabel?: string
}

export type QuizConceptBreakdown = {
  concept: string
  attempts: number
  correct: number
  incorrect: number
  accuracy: number
}

export type QuizDifficultyBreakdown = {
  difficulty: QuizDifficulty
  attempts: number
  correct: number
  incorrect: number
  accuracy: number
}

export type QuizSummary = {
  status: 'complete'
  totalQuestions: number
  correctCount: number
  incorrectCount: number
  accuracy: number
  conceptBreakdown: QuizConceptBreakdown[]
  difficultyBreakdown: QuizDifficultyBreakdown[]
  recommendedConcepts: string[]
}

export type QuizStep = QuizQuestionStep | QuizSummary

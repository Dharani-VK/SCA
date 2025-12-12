import { FEATURE_FLAGS, API_BASE_URL } from '../../utils/constants'
import { mockActiveQuizQuestion } from '../mocks/quiz.mock'
import type { KnowledgeLevel, QuizHistoryTurn, QuizNextPayload, QuizQuestion, QuizStep, QuizSummary } from '../../types/quiz'
import { request } from '../httpClient'

type ServerQuizOption = {
  id: string
  text: string
}

type ServerQuizHistoryTurn = {
  question_id?: string
  question: string
  selected_option_id?: string
  correct_option_id?: string
  correct_option_text?: string
  difficulty: QuizHistoryTurn['difficulty']
  was_correct: boolean
  explanation?: string
  concept_label?: string
}

type ServerQuizNextPayload = {
  topic: string
  knowledge_level?: KnowledgeLevel
  history: ServerQuizHistoryTurn[]
  total_questions: number
  source_mode?: QuizNextPayload['sourceMode']
  source_id?: string
  session_id?: string
}

type ServerQuizQuestion = {
  question_id: string
  prompt: string
  difficulty: QuizQuestion['difficulty']
  options: ServerQuizOption[]
  correctOptionId: string
  explanation?: string
  conceptLabel?: string
  sources?: QuizQuestion['sources']
  questionType?: QuizQuestion['questionType']
  focusConcept?: string
  focusKeywords?: string[]
}

type ServerQuizQuestionStep = {
  status: 'question'
  question: ServerQuizQuestion
  totalQuestions: number
  remainingQuestions: number
  sourceLabel?: string
}

type ServerQuizSummary = {
  status: 'complete'
  totalQuestions: number
  correctCount: number
  incorrectCount: number
  accuracy: number
  conceptBreakdown: QuizSummary['conceptBreakdown']
  difficultyBreakdown: QuizSummary['difficultyBreakdown']
  recommendedConcepts: QuizSummary['recommendedConcepts']
}

type ServerQuizStep = ServerQuizQuestionStep | ServerQuizSummary

function mapHistoryToServer(history: QuizHistoryTurn[] = []): ServerQuizHistoryTurn[] {
  return history.map((turn) => ({
    question_id: turn.questionId,
    question: turn.question,
    selected_option_id: turn.selectedOptionId,
    correct_option_id: turn.correctOptionId,
    correct_option_text: turn.correctOptionText,
    difficulty: turn.difficulty,
    was_correct: turn.wasCorrect,
    explanation: turn.explanation,
    concept_label: turn.conceptLabel,
  }))
}

function mapQuestionFromServer(question: ServerQuizQuestion): QuizQuestion {
  return {
    questionId: question.question_id,
    prompt: question.prompt,
    difficulty: question.difficulty,
    options: question.options,
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
    sources: question.sources ?? [],
    conceptLabel: question.conceptLabel,
    questionType: question.questionType,
    focusConcept: question.focusConcept,
    focusKeywords: question.focusKeywords ?? [],
  }
}

function mapStepFromServer(step: ServerQuizStep): QuizStep {
  if (step.status === 'question') {
    return {
      status: 'question',
      question: mapQuestionFromServer(step.question),
      totalQuestions: step.totalQuestions,
      remainingQuestions: step.remainingQuestions,
      sourceLabel: step.sourceLabel,
    }
  }

  return {
    status: 'complete',
    totalQuestions: step.totalQuestions,
    correctCount: step.correctCount,
    incorrectCount: step.incorrectCount,
    accuracy: step.accuracy,
    conceptBreakdown: step.conceptBreakdown,
    difficultyBreakdown: step.difficultyBreakdown,
    recommendedConcepts: step.recommendedConcepts,
  }
}

export async function fetchQuizStep(payload: QuizNextPayload): Promise<QuizStep> {
  if (FEATURE_FLAGS.useMocks) {
    const question = await mockActiveQuizQuestion(payload)

    return {
      status: 'question',
      question,
      totalQuestions: payload.totalQuestions,
      remainingQuestions: Math.max(payload.totalQuestions - (payload.history?.length ?? 0), 0),
    }
  }

  const serverPayload: ServerQuizNextPayload = {
    topic: payload.topic,
    knowledge_level: payload.knowledgeLevel,
    history: mapHistoryToServer(payload.history ?? []),
    total_questions: payload.totalQuestions,
    source_mode: payload.sourceMode,
    source_id: payload.sourceId,
    session_id: payload.sessionId,
  }

  const result = await request<ServerQuizStep, ServerQuizNextPayload>(`${API_BASE_URL}/quiz/next`, {
    method: 'POST',
    body: serverPayload,
  })

  return mapStepFromServer(result)
}

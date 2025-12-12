import { useCallback, useState } from 'react'
import { fetchQuizStep } from '../services/api/quiz'
import type { QuizHistoryTurn, QuizNextPayload, QuizStep } from '../types/quiz'

export function useQuiz() {
  const [history, setHistory] = useState<QuizHistoryTurn[]>([])
  const [currentStep, setCurrentStep] = useState<QuizStep | null>(null)
  const [loading, setLoading] = useState(false)

  const requestNextQuestion = useCallback(
    async (payload: QuizNextPayload) => {
      setLoading(true)
      try {
        const result = await fetchQuizStep({ ...payload, history: payload.history ?? history })
        setCurrentStep(result)
        if (payload.history) {
          setHistory(payload.history)
        }
        return result
      } finally {
        setLoading(false)
      }
    },
    [history]
  )

  return {
    history,
    setHistory,
    currentStep,
    loading,
    requestNextQuestion,
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import QuizBuilder from '../components/quiz/QuizBuilder'
import QuestionCard from '../components/quiz/QuestionCard'
import QuizSummaryCard from '../components/quiz/QuizSummaryCard'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import { fetchQuizStep } from '../services/api/quiz'
import type {
  KnowledgeLevel,
  QuizDifficulty,
  QuizHistoryTurn,
  QuizQuestion,
  QuizStep,
  QuizSourceMode,
} from '../types/quiz'

type SessionConfig = {
  topic: string
  knowledgeLevel: KnowledgeLevel
  totalQuestions: number
  sourceMode: QuizSourceMode
  sourceId?: string
}

type FeedbackState = {
  wasCorrect: boolean
  correctOptionId: string
  correctOptionText?: string
  explanation?: string
  userAnswerText?: string
}

function determineNextDifficulty(level: KnowledgeLevel | undefined, history: QuizHistoryTurn[]): QuizDifficulty {
  const base = {
    beginner: 'easy',
    intermediate: 'medium',
    advanced: 'hard',
  } as const
  const starting = base[level ?? 'intermediate']

  if (!history.length) {
    return starting
  }

  const last = history[history.length - 1]
  if (last.wasCorrect) {
    if (last.difficulty === 'easy') return 'medium'
    if (last.difficulty === 'medium') return 'hard'
    return 'hard'
  }
  if (last.difficulty === 'hard') return 'medium'
  if (last.difficulty === 'medium') return 'easy'
  return 'easy'
}

const SOURCE_MODE_LABELS: Record<QuizSourceMode, string> = {
  latest: 'Newest upload',
  previous: 'Previous upload',
  all: 'All documents',
  custom: 'Specific document',
}

function QuizPage() {
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null)
  const [currentStep, setCurrentStep] = useState<QuizStep | null>(null)
  const [answerValue, setAnswerValue] = useState<string>('')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [history, setHistory] = useState<QuizHistoryTurn[]>([])
  const historyRef = useRef<QuizHistoryTurn[]>([])
  const sessionIdRef = useRef<string | null>(null)
  const [loadingStep, setLoadingStep] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sourceBadge, setSourceBadge] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const questionStep = currentStep?.status === 'question' ? currentStep : null
  const summaryStep = currentStep?.status === 'complete' ? currentStep : null
  const currentQuestion: QuizQuestion | null = questionStep?.question ?? null

  const updateHistory = useCallback((nextHistory: QuizHistoryTurn[]) => {
    historyRef.current = nextHistory
    setHistory(nextHistory)
  }, [])

  const createSessionIdentifier = useCallback(() => {
    const cryptoApi = globalThis.crypto as Crypto | undefined
    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
      return cryptoApi.randomUUID()
    }
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }, [])

  const loadStep = useCallback(async (config: SessionConfig, historyPayload: QuizHistoryTurn[]) => {
    setLoadingStep(true)
    setError(null)
    try {
      const step = await fetchQuizStep({
        topic: config.topic,
        knowledgeLevel: config.knowledgeLevel,
        totalQuestions: config.totalQuestions,
        sourceMode: config.sourceMode,
        sourceId: config.sourceId,
        history: historyPayload,
        sessionId: sessionIdRef.current ?? undefined,
      })
      setCurrentStep(step)
      if (step.status === 'question') {
        setSourceBadge(step.sourceLabel ?? null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to retrieve the next quiz step.'
      setError(message)
      setCurrentStep(null)
    } finally {
      setLoadingStep(false)
    }
  }, [])

  const startSession = useCallback(
    async (config: SessionConfig) => {
      const nextConfig = { ...config }
      const nextSessionId = createSessionIdentifier()
      sessionIdRef.current = nextSessionId
      setCurrentSessionId(nextSessionId)
      setSessionConfig(nextConfig)
      updateHistory([])
      setCurrentStep(null)
      setFeedback(null)
      setAnswerValue('')
      setSourceBadge(null)
      await loadStep(nextConfig, [])
    },
    [createSessionIdentifier, loadStep, updateHistory]
  )

  const handleStart = useCallback(
    async (config: SessionConfig) => {
      await startSession(config)
    },
    [startSession]
  )

  const handleAnswerChange = (value: string) => {
    if (feedback || loadingStep || summaryStep) return
    setAnswerValue(value)
  }

  const handleSubmitAnswer = () => {
    if (!currentQuestion || feedback || summaryStep) return

    const questionType = currentQuestion.questionType ?? 'mcq'

    if (questionType === 'fill_blank') {
      const typedAnswer = answerValue.trim()
      if (!typedAnswer) return

      const normalizedInput = typedAnswer.toLowerCase()
      const correctOption = currentQuestion.options.find(
        (option) => option.id === currentQuestion.correctOptionId
      )
      const matchedOption = currentQuestion.options.find(
        (option) => option.text.trim().toLowerCase() === normalizedInput
      )
      const correctText = correctOption?.text
      const wasCorrect = matchedOption ? matchedOption.id === currentQuestion.correctOptionId : normalizedInput === correctText?.trim().toLowerCase()
      const turn: QuizHistoryTurn = {
        questionId: currentQuestion.questionId,
        question: currentQuestion.prompt,
        selectedOptionId: matchedOption?.id ?? `text:${typedAnswer}`,
        correctOptionId: currentQuestion.correctOptionId,
        correctOptionText: correctText,
        difficulty: currentQuestion.difficulty,
        wasCorrect,
        explanation: currentQuestion.explanation,
        conceptLabel: currentQuestion.conceptLabel,
      }

      const nextHistory = [...historyRef.current, turn]
      updateHistory(nextHistory)
      setFeedback({
        wasCorrect,
        correctOptionId: currentQuestion.correctOptionId,
        correctOptionText: correctText,
        explanation: currentQuestion.explanation,
        userAnswerText: typedAnswer,
      })
      return
    }

    if (!answerValue) return

    const wasCorrect = answerValue === currentQuestion.correctOptionId
    const selectedOption = currentQuestion.options.find((option) => option.id === answerValue)
    const correctOptionText = currentQuestion.options.find(
      (option) => option.id === currentQuestion.correctOptionId
    )?.text

    const turn: QuizHistoryTurn = {
      questionId: currentQuestion.questionId,
      question: currentQuestion.prompt,
      selectedOptionId: selectedOption?.id ?? answerValue,
      correctOptionId: currentQuestion.correctOptionId,
      correctOptionText,
      difficulty: currentQuestion.difficulty,
      wasCorrect,
      explanation: currentQuestion.explanation,
      conceptLabel: currentQuestion.conceptLabel,
    }

    const nextHistory = [...historyRef.current, turn]
    updateHistory(nextHistory)
    setFeedback({
      wasCorrect,
      correctOptionId: currentQuestion.correctOptionId,
      correctOptionText,
      explanation: currentQuestion.explanation,
      userAnswerText: selectedOption?.text,
    })
  }

  const handleNextQuestion = async () => {
    if (!sessionConfig || !questionStep || !feedback) return
    setFeedback(null)
    setAnswerValue('')
    await loadStep(sessionConfig, historyRef.current)
  }

  const handleResetSession = () => {
    setSessionConfig(null)
    updateHistory([])
    setCurrentStep(null)
    setAnswerValue('')
    setFeedback(null)
    setError(null)
    setSourceBadge(null)
    sessionIdRef.current = null
    setCurrentSessionId(null)
  }

  const handleRestartSession = useCallback(async () => {
    if (!sessionConfig) return
    await startSession({ ...sessionConfig })
  }, [sessionConfig, startSession])

  const upcomingDifficulty = useMemo(() => {
    if (!sessionConfig) return null
    if (summaryStep) return null
    return determineNextDifficulty(sessionConfig.knowledgeLevel, history)
  }, [history, sessionConfig, summaryStep])

  const sessionAnalyticsUrl = useMemo(() => {
    if (!currentSessionId) {
      return '/analytics?scope=session'
    }
    return `/analytics?scope=session&sessionId=${encodeURIComponent(currentSessionId)}`
  }, [currentSessionId])

  useEffect(() => {
    if (!questionStep?.question.questionId) return
    setAnswerValue('')
  }, [questionStep?.question.questionId])

  const answeredCount = history.length
  const totalConfigured = sessionConfig?.totalQuestions ?? 0
  const activeSourceLabel = sourceBadge || (sessionConfig ? SOURCE_MODE_LABELS[sessionConfig.sourceMode] : null)
  const remainingCount = summaryStep
    ? 0
    : Math.max(totalConfigured - answeredCount, 0)
  const submitQuestionType = currentQuestion?.questionType ?? 'mcq'
  const submitDisabled = !currentQuestion
    ? true
    : submitQuestionType === 'fill_blank'
      ? !answerValue.trim() || !!feedback || loadingStep
      : !answerValue || !!feedback || loadingStep

  return (
    <div className="space-y-6">
      <QuizBuilder onStart={handleStart} disabled={loadingStep} />

      {sessionConfig ? (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}
            {summaryStep ? (
              <>
                <QuizSummaryCard summary={summaryStep} />
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" onClick={handleRestartSession} disabled={loadingStep}>
                    Practise again
                  </Button>
                  <Button variant="ghost" onClick={handleResetSession}>
                    New topic
                  </Button>
                  {currentSessionId ? (
                    <Link to={sessionAnalyticsUrl}>
                      <Button variant="secondary">Show analytics</Button>
                    </Link>
                  ) : (
                    <Button variant="secondary" disabled>
                      Show analytics
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <QuestionCard
                  question={currentQuestion}
                  answerValue={answerValue}
                  onAnswerChange={handleAnswerChange}
                  locked={!!feedback}
                  loading={loadingStep}
                  feedback={feedback}
                  sourceLabel={activeSourceLabel ?? undefined}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    onClick={handleSubmitAnswer}
                    disabled={submitDisabled}
                  >
                    Check answer
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleNextQuestion}
                    disabled={!feedback || loadingStep}
                  >
                    Next question
                  </Button>
                  <Button variant="ghost" onClick={handleResetSession}>
                    End session
                  </Button>
                </div>
              </>
            )}
          </div>

          <Card title="Session progress" subtitle={`Topic: ${sessionConfig.topic}`}>
            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Answered</p>
                <p className="text-lg font-semibold text-slate-100">
                  {answeredCount}
                  {totalConfigured ? ` / ${totalConfigured}` : ''}
                </p>
              </div>
              {summaryStep ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Session result</p>
                  <p className="text-base text-slate-100">Accuracy {Math.round(summaryStep.accuracy * 100)}%</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {summaryStep.correctCount} correct • {summaryStep.incorrectCount} to review.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Next difficulty</p>
                  <p className="text-base capitalize text-slate-100">{upcomingDifficulty ?? '—'}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    We move up for confident answers and revisit the concept if you miss it.
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Questions remaining</p>
                <p className="text-base text-slate-100">{remainingCount}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Active source</p>
                <p className="text-xs text-slate-400">{activeSourceLabel ?? '—'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Recent questions</p>
                {history.slice(-5).reverse().map((turn) => (
                  <div
                    key={turn.questionId || `${turn.question}-${turn.selectedOptionId}`}
                    className={`rounded-xl border px-3 py-2 ${
                      turn.wasCorrect
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-50'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-50'
                    }`}
                  >
                    <p className="text-xs font-medium capitalize">{turn.difficulty} • {turn.wasCorrect ? 'Correct' : 'Review'}</p>
                    <p className="text-xs text-slate-900/80 dark:text-slate-200/80">
                      {turn.conceptLabel ? `${turn.conceptLabel} — ` : ''}
                      {turn.question}
                    </p>
                  </div>
                ))}
                {!history.length && <p className="text-xs text-slate-500">Answer the first question to see your progress.</p>}
              </div>
            </div>
          </Card>

          <Card
            title="Performance analytics"
            subtitle="Review detailed trends from your quiz history."
          >
            <p className="text-sm text-slate-400">
              The analytics dashboard charts running accuracy and difficulty insights across every quiz attempt. Use it
              to spot topics to revisit or to showcase learner progress.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {currentSessionId ? (
                <Link to={sessionAnalyticsUrl}>
                  <Button variant="primary">Show session analytics</Button>
                </Link>
              ) : (
                <Button variant="primary" disabled>
                  Show session analytics
                </Button>
              )}
              <Link to="/analytics">
                <Button variant="secondary">Open analytics dashboard</Button>
              </Link>
            </div>
          </Card>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800/50 bg-slate-950/40 px-6 py-10 text-center text-sm text-slate-300">
          Set a topic and confidence level to begin your adaptive quiz journey.
        </div>
      )}
    </div>
  )
}

export default QuizPage

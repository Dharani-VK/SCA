import Card from '../common/Card'
import type { QuizQuestion } from '../../types/quiz'

type Feedback = {
  wasCorrect: boolean
  correctOptionId: string
  explanation?: string
  correctOptionText?: string
  userAnswerText?: string
}

type QuestionCardProps = {
  question: QuizQuestion | null
  answerValue?: string
  onAnswerChange: (nextValue: string) => void
  locked?: boolean
  loading?: boolean
  feedback?: Feedback | null
  sourceLabel?: string
}

const difficultyStyles: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-400/40',
  hard: 'bg-rose-500/15 text-rose-300 border-rose-400/40',
}

function QuestionCard({
  question,
  answerValue = '',
  onAnswerChange,
  locked = false,
  loading = false,
  feedback,
  sourceLabel,
}: QuestionCardProps) {
  if (!question) {
    return (
      <Card>
        <div className="space-y-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-800" />
          <div className="h-16 animate-pulse rounded bg-slate-900" />
          <div className="space-y-2">
            <div className="h-10 animate-pulse rounded bg-slate-900" />
            <div className="h-10 animate-pulse rounded bg-slate-900" />
            <div className="h-10 animate-pulse rounded bg-slate-900" />
          </div>
        </div>
      </Card>
    )
  }
  const { prompt, options, difficulty, conceptLabel, questionType, focusConcept, focusKeywords } = question
  const difficultyTag = difficultyStyles[difficulty] ?? difficultyStyles.medium
  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  const normalisedType = questionType ?? 'mcq'
  const isTrueFalse = normalisedType === 'true_false'
  const isFillBlank = normalisedType === 'fill_blank'
  const isScenario = normalisedType === 'scenario'
  const questionTypeLabel = normalisedType && normalisedType !== 'mcq' ? normalisedType.replace(/_/g, ' ') : null
  const showFocusBadge = focusConcept && focusConcept !== conceptLabel

  const handleOptionSelect = (optionId: string) => {
    if (locked || loading) return
    onAnswerChange(optionId)
  }

  const handleFillBlankChange = (value: string) => {
    if (locked || loading) return
    onAnswerChange(value)
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div
              className={
                isScenario
                  ? 'rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-slate-100'
                  : 'text-slate-100'
              }
            >
              <p className={`text-base font-semibold ${isScenario ? 'text-blue-50/90' : 'text-slate-100'}`}>{prompt}</p>
              {isScenario && (
                <p className="mt-2 text-xs text-blue-100/80">
                  Apply the guidance to the scenario before selecting the best-fit option.
                </p>
              )}
            </div>
            {(conceptLabel || showFocusBadge || questionTypeLabel || sourceLabel) && (
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                {conceptLabel && (
                  <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-indigo-200">
                    Concept: {conceptLabel}
                  </span>
                )}
                {showFocusBadge && (
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                    Focus: {focusConcept}
                  </span>
                )}
                {questionTypeLabel && (
                  <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-blue-200 capitalize">
                    Type: {questionTypeLabel}
                  </span>
                )}
                {focusKeywords?.length ? (
                  <span className="flex flex-wrap gap-1">
                    {focusKeywords.slice(0, 3).map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-cyan-200"
                      >
                        {keyword}
                      </span>
                    ))}
                  </span>
                ) : null}
                {sourceLabel && (
                  <span className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-slate-200">
                    Source: {sourceLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${difficultyTag}`}>
            {difficultyLabel} level
          </span>
        </div>
        <div className="space-y-3">
          {isTrueFalse ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((option) => {
                const isSelected = answerValue === option.id
                const isCorrect = feedback?.correctOptionId === option.id
                const showState = !!feedback
                const baseClasses =
                  'w-full rounded-2xl border px-4 py-6 text-center text-lg font-semibold transition focus:outline-none'
                let stateClasses =
                  'border-slate-800/60 bg-slate-950/40 text-slate-200 hover:border-slate-300/60 hover:bg-slate-900/40'

                if (showState) {
                  if (isCorrect) {
                    stateClasses = 'border-emerald-500/70 bg-emerald-500/10 text-emerald-100'
                  } else if (isSelected) {
                    stateClasses = 'border-rose-500/60 bg-rose-500/10 text-rose-100'
                  }
                } else if (isSelected) {
                  stateClasses = 'border-slate-200 bg-slate-800/70 text-slate-100'
                }

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleOptionSelect(option.id)}
                    disabled={locked || loading}
                    className={`${baseClasses} ${stateClasses} ${(locked || loading) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                  >
                    {option.text}
                  </button>
                )
              })}
            </div>
          ) : isFillBlank ? (
            <div className="space-y-4">
              <div>
                <label htmlFor={`fill-blank-${question.questionId}`} className="text-sm font-medium text-slate-200">
                  Type the missing term
                </label>
                <input
                  id={`fill-blank-${question.questionId}`}
                  type="text"
                  value={answerValue}
                  onChange={(event) => handleFillBlankChange(event.target.value)}
                  disabled={locked || loading}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-base text-slate-100 shadow-inner outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                  placeholder="Enter the missing word"
                  autoComplete="off"
                />
              </div>
              {options.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Helpful hints</p>
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => handleFillBlankChange(option.text)}
                        disabled={locked || loading}
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            options.map((option) => {
              const isSelected = answerValue === option.id
              const isCorrect = feedback?.correctOptionId === option.id
              const showState = !!feedback
              const baseClasses = 'flex items-start gap-3 rounded-2xl border px-4 py-4 text-left text-sm transition'
              let stateClasses =
                'border-slate-800/60 bg-slate-950/40 text-slate-300 hover:border-slate-300/60 hover:bg-slate-900/40'

              if (showState) {
                if (isCorrect) {
                  stateClasses = 'border-emerald-500/70 bg-emerald-500/10 text-emerald-100'
                } else if (isSelected) {
                  stateClasses = 'border-rose-500/60 bg-rose-500/10 text-rose-100'
                }
              } else if (isSelected) {
                stateClasses = 'border-slate-200 bg-slate-800/70 text-slate-100'
              }

              return (
                <label
                  key={option.id}
                  className={`${baseClasses} ${stateClasses} ${(locked || loading) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  <input
                    type="radio"
                    name={`quiz-option-${question.questionId}`}
                    value={option.id}
                    checked={isSelected}
                    disabled={locked || loading}
                    onChange={() => handleOptionSelect(option.id)}
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-emerald-500 focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="flex-1 text-slate-200">
                    <span className="mr-2 font-semibold uppercase text-slate-300">{option.id}.</span>
                    {option.text}
                  </span>
                </label>
              )
            })
          )}
        </div>
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${feedback.wasCorrect ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/60 bg-amber-500/10 text-amber-100'}`}
          >
            {feedback.wasCorrect ? 'Great job! ' : 'Let’s review: '}
            {feedback.explanation || 'The explanation from the notes will reinforce the concept.'}
            {!feedback.wasCorrect && feedback.correctOptionText && (
              <span className="block pt-2 text-xs text-amber-200/80">
                Correct answer: {feedback.correctOptionText}
              </span>
            )}
            {feedback.userAnswerText && (
              <span className="block pt-1 text-xs text-slate-300/80">
                You answered: {feedback.userAnswerText}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default QuestionCard

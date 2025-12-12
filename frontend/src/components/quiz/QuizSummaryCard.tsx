import Card from '../common/Card'
import type { QuizSummary } from '../../types/quiz'

type QuizSummaryCardProps = {
  summary: QuizSummary
}

function formatPercentage(value: number) {
  return `${Math.round((value ?? 0) * 100)}%`
}

function QuizSummaryCard({ summary }: QuizSummaryCardProps) {
  const {
    accuracy,
    correctCount,
    incorrectCount,
    totalQuestions,
    conceptBreakdown,
    difficultyBreakdown,
    recommendedConcepts,
  } = summary

  return (
    <Card title="Session summary" subtitle="Here’s how you performed across concepts and difficulty levels.">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-100">
          <p className="text-xs uppercase tracking-wide text-emerald-200/80">Overall accuracy</p>
          <p className="text-3xl font-semibold text-emerald-100">{formatPercentage(accuracy)}</p>
          <p className="mt-2 text-xs text-emerald-200/80">
            {correctCount} correct • {incorrectCount} to review
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-slate-200">
          <p className="text-xs uppercase tracking-wide text-slate-400">Questions answered</p>
          <p className="text-3xl font-semibold text-slate-100">{totalQuestions}</p>
          <p className="mt-2 text-xs text-slate-400">Adaptive difficulty adjusted with every answer.</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-4 text-indigo-100">
          <p className="text-xs uppercase tracking-wide text-indigo-200/80">Next focus areas</p>
          {recommendedConcepts.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {recommendedConcepts.map((concept) => (
                <li key={concept} className="rounded-full border border-indigo-400/50 bg-indigo-500/10 px-3 py-1">
                  {concept}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-indigo-200/80">Keep going! You’re scoring strongly across the board.</p>
          )}
        </div>
      </div>

      {conceptBreakdown.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-200">Concept insights</h4>
          <div className="space-y-2 text-sm">
            {conceptBreakdown.map((concept) => (
              <div
                key={concept.concept}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-100">{concept.concept}</p>
                  <p className="text-xs text-slate-400">
                    {concept.attempts} attempt{concept.attempts === 1 ? '' : 's'} • {concept.correct} correct
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-200">{formatPercentage(concept.accuracy)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {difficultyBreakdown.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-200">Difficulty breakdown</h4>
          <div className="grid gap-3 md:grid-cols-3">
            {difficultyBreakdown.map((difficulty) => (
              <div
                key={difficulty.difficulty}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-200"
              >
                <p className="text-xs uppercase tracking-wide text-slate-400">{difficulty.difficulty}</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{formatPercentage(difficulty.accuracy)}</p>
                <p className="text-xs text-slate-500">
                  {difficulty.correct} / {difficulty.attempts} correct
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export default QuizSummaryCard

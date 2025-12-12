import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button'
import Select from '../common/Select'
import Input from '../common/Input'
import Card from '../common/Card'
import type { KnowledgeLevel, QuizSourceMode } from '../../types/quiz'
import type { CampusDocument } from '../../types/file'
import { fetchDocuments } from '../../services/api/documents'

type QuizBuilderProps = {
  onStart: (config: {
    topic: string
    knowledgeLevel: KnowledgeLevel
    totalQuestions: number
    sourceMode: QuizSourceMode
    sourceId?: string
  }) => void
  disabled?: boolean
}

const MIN_QUESTIONS = 1
const MAX_QUESTIONS = 25

type SourceOption = {
  value: QuizSourceMode
  label: string
  helper: string
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    value: 'latest',
    label: 'Newest upload only',
    helper: 'Focus on the document you ingested most recently.',
  },
  {
    value: 'previous',
    label: 'Previous upload',
    helper: 'Review the document you used before the latest one.',
  },
  {
    value: 'all',
    label: 'Blend everything',
    helper: 'Mix questions across all stored documents.',
  },
  {
    value: 'custom',
    label: 'Pick a document',
    helper: 'Target a specific upload from your library.',
  },
]

function QuizBuilder({ onStart, disabled }: QuizBuilderProps) {
  const [topic, setTopic] = useState('')
  const [knowledgeLevel, setKnowledgeLevel] = useState<KnowledgeLevel>('intermediate')
  const [totalQuestions, setTotalQuestions] = useState('5')
  const [sourceMode, setSourceMode] = useState<QuizSourceMode>('latest')
  const [sourceId, setSourceId] = useState<string | undefined>(undefined)
  const [documents, setDocuments] = useState<CampusDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadDocuments = async () => {
      setLoadingDocs(true)
      try {
        const result = await fetchDocuments()
        if (isMounted) {
          setDocuments(result)
        }
      } catch (error) {
        if (isMounted) {
          setDocuments([])
        }
      } finally {
        if (isMounted) {
          setLoadingDocs(false)
        }
      }
    }

    loadDocuments()
    return () => {
      isMounted = false
    }
  }, [])

  const customSourceOptions = useMemo(() => {
    return documents.map((doc) => ({ value: doc.id, label: doc.title }))
  }, [documents])

  const canStart = useMemo(() => {
    const parsedTotal = Number(totalQuestions)
    if (Number.isNaN(parsedTotal)) {
      return false
    }
    if (parsedTotal < MIN_QUESTIONS || parsedTotal > MAX_QUESTIONS) {
      return false
    }
    if (sourceMode === 'custom') {
      return !!sourceId
    }
    return true
  }, [sourceId, sourceMode, topic, totalQuestions])

  const sourceModeMeta = SOURCE_OPTIONS.find((option) => option.value === sourceMode)

  const handleSubmit = () => {
    const parsedTotal = Number(totalQuestions)
    if (Number.isNaN(parsedTotal)) {
      return
    }

    const clampedTotal = Math.min(Math.max(parsedTotal, MIN_QUESTIONS), MAX_QUESTIONS)

    onStart({
      topic: topic.trim(),
      knowledgeLevel,
      totalQuestions: clampedTotal,
      sourceMode,
      sourceId: sourceMode === 'custom' ? sourceId : undefined,
    })
  }

  return (
    <Card
      title="Adaptive Quiz"
      subtitle="Pick a topic, set the difficulty guidance, and choose which sources to draw from."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Topic to practise (optional)"
          placeholder="e.g. Binary search, financial aid policies"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          disabled={disabled}
          helperText="Leave blank to get a surprise question from your notes."
        />
        <Select
          label="How confident do you feel?"
          value={knowledgeLevel}
          onChange={(event) => setKnowledgeLevel(event.target.value as KnowledgeLevel)}
          disabled={disabled}
        >
          <option value="beginner">I am just getting started</option>
          <option value="intermediate">I know the basics</option>
          <option value="advanced">I feel confident already</option>
        </Select>
        <Input
          label="How many questions?"
          type="number"
          min={MIN_QUESTIONS}
          max={MAX_QUESTIONS}
          value={totalQuestions}
          onChange={(event) => setTotalQuestions(event.target.value)}
          disabled={disabled}
          helperText={`Between ${MIN_QUESTIONS} and ${MAX_QUESTIONS} questions per session.`}
        />
        <Select
          label="Choose a source"
          value={sourceMode}
          onChange={(event) => {
            const nextMode = event.target.value as QuizSourceMode
            setSourceMode(nextMode)
            if (nextMode !== 'custom') {
              setSourceId(undefined)
            }
          }}
          disabled={disabled || loadingDocs}
          helperText={sourceModeMeta?.helper}
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {sourceMode === 'custom' && (
          <Select
            label="Select a document"
            value={sourceId ?? ''}
            onChange={(event) => setSourceId(event.target.value || undefined)}
            disabled={disabled || loadingDocs || !customSourceOptions.length}
            helperText={
              loadingDocs
                ? 'Loading your library...'
                : customSourceOptions.length
                  ? 'We will draw questions only from this upload.'
                  : 'Upload documents first to target a specific source.'
            }
          >
            <option value="" disabled>
              {loadingDocs ? 'Loading...' : 'Choose a document'}
            </option>
            {customSourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Button onClick={handleSubmit} disabled={disabled || !canStart}>
          Start quiz
        </Button>
      </div>
    </Card>
  )
}

export default QuizBuilder

import Button from '../common/Button'
import Card from '../common/Card'
import { SparklesIcon, ChatBubbleLeftRightIcon, ClipboardDocumentListIcon, QueueListIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const actions = [
  {
    title: 'Ask the AI Mentor',
    description: 'Get contextual answers from your course material instantly.',
    icon: ChatBubbleLeftRightIcon,
    to: '/chat',
  },
  {
    title: 'Generate a Summary',
    description: 'Condense a syllabus or lecture notes into key insights.',
    icon: ClipboardDocumentListIcon,
    to: '/summary',
  },
  {
    title: 'Build Quiz Decks',
    description: 'Create adaptive question sets to test your understanding.',
    icon: QueueListIcon,
    to: '/quiz',
  },
]

function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card title="Quick Actions" subtitle="Jump back into your smart campus workflow.">
      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => (
          <div
            key={action.title}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700 transition hover:border-primary-200 hover:bg-primary-50/60 dark:border-slate-800/80 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:border-primary-500/60 dark:hover:bg-slate-900/90"
          >
            <div className="mb-4 inline-flex rounded-full bg-primary-500/10 p-3 text-primary-500 dark:bg-primary-500/15 dark:text-primary-300">
              <action.icon className="h-6 w-6" />
            </div>
            <h4 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{action.title}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">{action.description}</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => navigate(action.to)}
            >
              Launch
              <SparklesIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default QuickActions

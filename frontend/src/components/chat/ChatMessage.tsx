import clsx from 'clsx'
import { SparklesIcon, UserIcon } from '@heroicons/react/24/outline'

export type ChatRole = 'user' | 'assistant'

type ChatMessageProps = {
  role: ChatRole
  content: string
  sources?: string[]
}

function ChatMessage({ role, content, sources }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={clsx('flex w-full gap-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={clsx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            : 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
        )}
      >
        {isUser ? <UserIcon className="h-5 w-5" /> : <SparklesIcon className="h-5 w-5" />}
      </div>

      <div className={clsx('flex max-w-[80%] flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isUser ? 'You' : 'AI Mentor'}
          </span>
        </div>

        <div
          className={clsx(
            'rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm',
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-none'
              : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-200'
          )}
        >
          <div className="whitespace-pre-wrap">{content}</div>
        </div>

        {sources && sources.length > 0 && !isUser && (
          <div className="mt-1 flex flex-wrap gap-2">
            {sources.map((src, i) => (
              <div
                key={i}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400"
              >
                <span className="mr-1">📄</span>
                {src}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessage

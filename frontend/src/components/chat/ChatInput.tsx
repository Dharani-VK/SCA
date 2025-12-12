import { FormEvent, useState, KeyboardEvent, useRef } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'

type ChatInputProps = {
  onSend: (message: string) => void
  disabled?: boolean
}

function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className="shrink-0 bg-white px-4 pb-4 pt-2 dark:bg-slate-900/50">
      <div className="mx-auto max-w-4xl">
        <form
          onSubmit={handleSubmit}
          className={`relative flex items-end gap-2 rounded-3xl border bg-white p-2 shadow-sm transition-colors focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 dark:bg-slate-900 ${disabled ? 'border-slate-200 opacity-60 dark:border-slate-800' : 'border-slate-300 dark:border-slate-700'
            }`}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-slate-800 placeholder-slate-400 focus:ring-0 dark:text-slate-100 dark:placeholder-slate-500 max-h-[120px]"
            style={{ minHeight: '48px' }}
          />
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="mb-1.5 mr-1.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white transition hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-700"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
          AI can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  )
}

export default ChatInput

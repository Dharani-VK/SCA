import clsx from 'clsx'
import { forwardRef, TextareaHTMLAttributes } from 'react'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  helperText?: string
  error?: string
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, helperText, error, className, ...props },
  ref
) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm text-slate-300">
      {label && <span className="font-medium text-slate-200">{label}</span>}
      <textarea
        ref={ref}
        className={clsx(
          'w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/40',
          className
        )}
        {...props}
      />
      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : (
        helperText && <span className="text-xs text-slate-500">{helperText}</span>
      )}
    </label>
  )
})

export default TextArea

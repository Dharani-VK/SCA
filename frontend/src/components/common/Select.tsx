import clsx from 'clsx'
import { forwardRef, ReactNode, SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  helperText?: string
  error?: string
  leftAdornment?: ReactNode
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helperText, error, leftAdornment, className, children, ...props },
  ref
) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm text-slate-300">
      {label && <span className="font-medium text-slate-200">{label}</span>}
      <div className="relative">
        {leftAdornment && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
            {leftAdornment}
          </div>
        )}
        <select
          ref={ref}
          className={clsx(
            'w-full appearance-none rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 pr-10 text-slate-100 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50',
            leftAdornment && 'pl-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/40',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-3 text-slate-500">▾</span>
      </div>
      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : (
        helperText && <span className="text-xs text-slate-500">{helperText}</span>
      )}
    </label>
  )
})

export default Select

import clsx from 'clsx'
import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  icon?: ReactNode
}

const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white shadow-[0_12px_30px_-14px_rgba(79,70,229,0.65)] hover:bg-primary-700 focus-visible:outline-primary-400',
  secondary:
    'border border-slate-300 bg-white/80 text-slate-700 hover:border-primary-400 hover:text-primary-600 focus-visible:outline-primary-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:text-primary-200',
  ghost:
    'text-slate-600 hover:text-primary-600 hover:bg-slate-100 focus-visible:outline-primary-400 dark:text-slate-300 dark:hover:text-primary-200 dark:hover:bg-slate-800/50',
}

function Button({ variant = 'primary', loading, icon, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], className, loading && 'cursor-progress')}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="h-2 w-2 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {icon && !loading && icon}
      <span>{children}</span>
    </button>
  )
}

export default Button

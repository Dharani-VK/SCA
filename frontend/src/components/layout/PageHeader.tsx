import { ReactNode } from 'react'
import clsx from 'clsx'

export type PageHeaderProps = {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
  className?: string
}

function PageHeader({ title, subtitle, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header
      className={clsx(
        'flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-lg dark:border-slate-800/70 dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between md:p-7',
        className
      )}
    >
      <div className="space-y-2">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-300">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 md:text-3xl">{title}</h1>
        {subtitle && <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 md:justify-end">{actions}</div>}
    </header>
  )
}

export default PageHeader

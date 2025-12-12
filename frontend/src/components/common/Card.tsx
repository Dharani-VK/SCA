import clsx from 'clsx'
import { ReactNode } from 'react'

type CardProps = {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

function Card({ title, subtitle, actions, children, className }: CardProps) {
  return (
    <section
      className={clsx(
        'relative w-full overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 p-6 text-slate-700 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-colors dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-200 md:p-7',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/60 to-transparent dark:from-slate-900/60" />
      {(title || subtitle || actions) && (
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="space-y-4 text-slate-700 dark:text-slate-200">{children}</div>
    </section>
  )
}

export default Card

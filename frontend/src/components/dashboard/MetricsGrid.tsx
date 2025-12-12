import clsx from 'clsx'
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import type { DashboardMetric } from '../../types/dashboard'

type MetricsGridProps = {
  metrics: DashboardMetric[]
}

function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => {
        const isPositive = metric.changeDirection === 'up'
        const Icon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon

        return (
          <div
            key={metric.id}
            className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-elevated backdrop-blur"
          >
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-100">{metric.value}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium',
                  isPositive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {isPositive ? '+' : '-'}
                {metric.change}%
              </span>
              {metric.helperText && <span>{metric.helperText}</span>}
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default MetricsGrid

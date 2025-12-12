import { formatDistanceToNow } from 'date-fns'
import Card from '../common/Card'
import Badge from '../common/Badge'
import type { DashboardSystemStatus } from '../../types/dashboard'

const statusTone: Record<DashboardSystemStatus['status'], { label: string; tone: 'success' | 'warning' | 'danger' | 'default' }> = {
  operational: { label: 'Operational', tone: 'success' },
  degraded: { label: 'Degraded', tone: 'warning' },
  maintenance: { label: 'Maintenance', tone: 'default' },
}

type SystemStatusProps = {
  systems: DashboardSystemStatus[]
}

function SystemStatus({ systems }: SystemStatusProps) {
  return (
    <Card title="Platform Status" subtitle="Health snapshot for critical campus AI services.">
      <ul className="space-y-4">
        {systems.map((system) => {
          const status = statusTone[system.status]

          return (
            <li
              key={system.id}
              className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{system.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{system.description}</p>
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Updated {formatDistanceToNow(new Date(system.updatedAt), { addSuffix: true })}
              </p>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export default SystemStatus

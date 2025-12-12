import { formatDistanceToNow } from 'date-fns'
import Card from '../common/Card'
import Badge from '../common/Badge'
import type { DashboardActivity } from '../../types/dashboard'

type ActivityTimelineProps = {
  items: DashboardActivity[]
}

function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <Card
      title="Operational Pulse"
      subtitle="Recent automation and AI mentor activity across the campus cloud."
    >
      <ol className="relative space-y-6 border-l border-slate-800/60 pl-6">
        {items.map((item) => (
          <li key={item.id} className="relative space-y-2">
            <div className="absolute -left-3 mt-1 h-2 w-2 rounded-full bg-primary-400" />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Badge>{item.category}</Badge>
              <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
            </div>
            <p className="text-sm font-semibold text-slate-100">{item.title}</p>
            <p className="text-sm text-slate-400">{item.description}</p>
          </li>
        ))}
      </ol>
    </Card>
  )
}

export default ActivityTimeline

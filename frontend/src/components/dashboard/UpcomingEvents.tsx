import { format } from 'date-fns'
import Card from '../common/Card'
import Badge from '../common/Badge'
import type { DashboardEvent } from '../../types/dashboard'

type UpcomingEventsProps = {
  events: DashboardEvent[]
}

function UpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <Card title="Upcoming Campus Enablement" subtitle="High-impact sessions powered by your AI stack.">
      <ul className="space-y-4">
        {events.map((event) => (
          <li
            key={event.id}
            className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4"
          >
            <p className="text-sm font-semibold text-slate-100">{event.title}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {format(new Date(event.startTime), 'EEE, MMM d • h:mm a')}
            </p>
            <p className="mt-2 text-sm text-slate-400">{event.location}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <Badge key={tag} className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default UpcomingEvents

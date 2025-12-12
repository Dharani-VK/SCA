import { useNavigate } from 'react-router-dom'
import Card from '../common/Card'
import Button from '../common/Button'
import type { DashboardRecommendation } from '../../types/dashboard'

type RecommendationsProps = {
  items: DashboardRecommendation[]
}

function Recommendations({ items }: RecommendationsProps) {
  const navigate = useNavigate()

  const mapRecommendationToRoute = (id: string) => {
    switch (id) {
      case 'rec-upload':
      case 'rec-ingest':
        return '/upload'
      case 'rec-summary':
        return '/summary'
      case 'rec-quiz':
        return '/quiz'
      default:
        return '/'
    }
  }

  return (
    <Card
      title="Recommended Next Steps"
      subtitle="AI insights curated from usage trends and learning analytics."
    >
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/40"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
            <Button
              variant="secondary"
              className="mt-4 w-full justify-center sm:w-auto"
              onClick={() => navigate(mapRecommendationToRoute(item.id))}
            >
              {item.ctaLabel}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default Recommendations

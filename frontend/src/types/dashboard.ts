export type DashboardMetric = {
  id: string
  label: string
  value: string
  change: number
  changeDirection: 'up' | 'down'
  helperText?: string
}

export type DashboardActivity = {
  id: string
  title: string
  description: string
  category: string
  timestamp: string
}

export type DashboardEvent = {
  id: string
  title: string
  startTime: string
  location: string
  tags: string[]
}

export type DashboardSystemStatus = {
  id: string
  name: string
  status: 'operational' | 'degraded' | 'maintenance'
  updatedAt: string
  description?: string
}

export type DashboardRecommendation = {
  id: string
  title: string
  description: string
  ctaLabel: string
}

export type DashboardOverview = {
  metrics: DashboardMetric[]
  activity: DashboardActivity[]
  events: DashboardEvent[]
  systems: DashboardSystemStatus[]
  recommendations: DashboardRecommendation[]
}

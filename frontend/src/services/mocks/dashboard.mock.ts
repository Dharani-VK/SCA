import type { DashboardOverview } from '../../types/dashboard'

const now = new Date()

const overview: DashboardOverview = {
  metrics: [
    {
      id: 'metric-ingestions',
      label: 'Documents Ingested',
      value: '248',
      change: 18,
      changeDirection: 'up',
      helperText: 'vs. last 7 days',
    },
    {
      id: 'metric-qa',
      label: 'AI Responses',
      value: '1,082',
      change: 12,
      changeDirection: 'up',
      helperText: 'Avg. satisfaction 4.7/5',
    },
    {
      id: 'metric-latency',
      label: 'Median Latency',
      value: '620ms',
      change: 6,
      changeDirection: 'down',
      helperText: 'Optimized nightly retraining',
    },
    {
      id: 'metric-active-learners',
      label: 'Active Learners',
      value: '412',
      change: 9,
      changeDirection: 'up',
      helperText: 'Across 34 cohorts',
    },
  ],
  activity: [
    {
      id: 'activity-1',
      title: 'Adaptive quiz deck generated',
      description: '“Operating Systems – Midterm Review” for EE cohort B.',
      category: 'Quiz',
      timestamp: new Date(now.getTime() - 1000 * 60 * 14).toISOString(),
    },
    {
      id: 'activity-2',
      title: 'Summary refreshed from live data',
      description: 'Admissions policy handbook synced with new revision control.',
      category: 'Summary',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'activity-3',
      title: 'Large dataset ingestion',
      description: 'Campus energy analytics report uploaded by Sustainability Lab.',
      category: 'Ingestion',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'activity-4',
      title: 'Mentor answers trending',
      description: 'AI mentor handled 240 inquiries in the last 12 hours.',
      category: 'Engagement',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 9).toISOString(),
    },
  ],
  events: [
    {
      id: 'event-1',
      title: 'AI Policy Roundtable',
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 18).toISOString(),
      location: 'Innovation Hub • Room 202',
      tags: ['Faculty', 'Strategy'],
    },
    {
      id: 'event-2',
      title: 'Data Science Peer Lab',
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 42).toISOString(),
      location: 'Library Collaboration Suite',
      tags: ['Students', 'Workshop'],
    },
  ],
  systems: [
    {
      id: 'system-vector-db',
      name: 'Vector Database',
      status: 'operational',
      updatedAt: now.toISOString(),
      description: 'Healthy • 0.1% error rate in the last hour.',
    },
    {
      id: 'system-ml-pipeline',
      name: 'Model Training Pipeline',
      status: 'maintenance',
      updatedAt: new Date(now.getTime() - 1000 * 60 * 20).toISOString(),
      description: 'Nightly fine-tuning scheduled • ETA 35m.',
    },
    {
      id: 'system-ingestion',
      name: 'Ingestion Workers',
      status: 'degraded',
      updatedAt: new Date(now.getTime() - 1000 * 60 * 8).toISOString(),
      description: 'Queue depth above threshold • auto-scaling engaged.',
    },
  ],
  recommendations: [
    {
      id: 'rec-1',
      title: 'Review flagged ingestion queue',
      description: 'Two large PDF batches need manual categorization to train the AI mentor.',
      ctaLabel: 'Open upload console',
    },
    {
      id: 'rec-2',
      title: 'Schedule live coaching hour',
      description: 'Learning analytics suggest Electrical cohort C would benefit from a session.',
      ctaLabel: 'Book session',
    },
    {
      id: 'rec-3',
      title: 'Publish summary digest',
      description: 'Send weekly insights to stakeholders to keep everyone aligned.',
      ctaLabel: 'Preview digest',
    },
  ],
}

export async function mockGetDashboardOverview(): Promise<DashboardOverview> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(overview), 300)
  })
}

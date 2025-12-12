import { render, screen } from '@testing-library/react'
import MetricsGrid from '../MetricsGrid'
import type { DashboardMetric } from '../../../types/dashboard'

describe('MetricsGrid', () => {
  const metrics: DashboardMetric[] = [
    {
      id: 'm-1',
      label: 'Documents Ingested',
      value: '120',
      change: 12,
      changeDirection: 'up',
      helperText: 'vs. last week',
    },
    {
      id: 'm-2',
      label: 'Median Latency',
      value: '720ms',
      change: 5,
      changeDirection: 'down',
      helperText: 'Optimized overnight',
    },
  ]

  it('renders a card for each metric with value and helper text', () => {
    render(<MetricsGrid metrics={metrics} />)

    metrics.forEach((metric) => {
      expect(screen.getByText(metric.label)).toBeInTheDocument()
      expect(screen.getByText(metric.value)).toBeInTheDocument()
      if (metric.helperText) {
        expect(screen.getByText(metric.helperText)).toBeInTheDocument()
      }
    })
  })
})

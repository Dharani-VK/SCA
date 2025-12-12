import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Recommendations from '../Recommendations'
import type { DashboardRecommendation } from '../../../types/dashboard'

describe('Recommendations', () => {
  it('lists recommended actions with CTA buttons', () => {
    const items: DashboardRecommendation[] = [
      {
        id: 'rec-1',
        title: 'Review flagged queue',
        description: 'Two uploads need manual labeling.',
        ctaLabel: 'Open console',
      },
    ]

    render(<Recommendations items={items} />)

    expect(screen.getByText('Review flagged queue')).toBeInTheDocument()
    expect(screen.getByText('Two uploads need manual labeling.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open console' })).toBeInTheDocument()
  })
})

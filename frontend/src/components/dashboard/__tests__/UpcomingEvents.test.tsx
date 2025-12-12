import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import UpcomingEvents from '../UpcomingEvents'
import type { DashboardEvent } from '../../../types/dashboard'

describe('UpcomingEvents', () => {
  it('shows event details with location and tags', () => {
    const events: DashboardEvent[] = [
      {
        id: 'event-1',
        title: 'AI Policy Roundtable',
        startTime: '2025-02-10T15:30:00Z',
        location: 'Innovation Hub',
        tags: ['Faculty', 'Strategy'],
      },
    ]

    render(<UpcomingEvents events={events} />)

    expect(screen.getByText('AI Policy Roundtable')).toBeInTheDocument()
    expect(screen.getByText('Innovation Hub')).toBeInTheDocument()
    expect(screen.getByText('Faculty')).toBeInTheDocument()
    expect(screen.getByText('Strategy')).toBeInTheDocument()
  })
})

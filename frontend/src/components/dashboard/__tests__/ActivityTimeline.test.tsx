import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ActivityTimeline from '../ActivityTimeline'
import type { DashboardActivity } from '../../../types/dashboard'

const fixedNow = new Date('2025-01-01T12:00:00Z')

describe('ActivityTimeline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows activity items with categories and timestamps', () => {
    const items: DashboardActivity[] = [
      {
        id: 'activity-1',
        title: 'Generated new quiz set',
        description: 'Quiz deck created for Intro to AI.',
        category: 'Quiz',
        timestamp: new Date('2025-01-01T11:45:00Z').toISOString(),
      },
    ]

    render(<ActivityTimeline items={items} />)

    expect(screen.getByText('Generated new quiz set')).toBeInTheDocument()
    expect(screen.getByText('Quiz')).toBeInTheDocument()
    expect(screen.getByText(/15 minutes ago/i)).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SystemStatus from '../SystemStatus'
import type { DashboardSystemStatus } from '../../../types/dashboard'

const fixedNow = new Date('2025-01-01T12:00:00Z')

describe('SystemStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders system status badges and descriptions', () => {
    const systems: DashboardSystemStatus[] = [
      {
        id: 'sys-1',
        name: 'Vector Database',
        status: 'operational',
        updatedAt: new Date('2025-01-01T11:50:00Z').toISOString(),
        description: 'Healthy and fully indexed.',
      },
      {
        id: 'sys-2',
        name: 'Ingestion Workers',
        status: 'degraded',
        updatedAt: new Date('2025-01-01T11:40:00Z').toISOString(),
        description: 'Scaling to handle new uploads.',
      },
    ]

    render(<SystemStatus systems={systems} />)

    expect(screen.getByText('Vector Database')).toBeInTheDocument()
    expect(screen.getByText('Ingestion Workers')).toBeInTheDocument()
    expect(screen.getByText('Operational')).toBeInTheDocument()
    expect(screen.getByText('Degraded')).toBeInTheDocument()
  })
})

import { useCallback, useEffect, useState } from 'react'
import { getDashboardOverview } from '../services/api/dashboard'
import type { DashboardOverview } from '../types/dashboard'

export function useDashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getDashboardOverview()
      setData(response)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard overview'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    data,
    loading,
    error,
    refresh,
  }
}

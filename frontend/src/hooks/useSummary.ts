import { useCallback } from 'react'
import { generateSummary } from '../services/api/summary'
import useAppStore, { type AppState } from '../store/useAppStore'
import type { SummaryPayload } from '../types/summary'

export function useSummary() {
  const { summarySections, setSummarySections } = useAppStore((state: AppState) => ({
    summarySections: state.summarySections,
    setSummarySections: state.setSummarySections,
  }))

  const runSummary = useCallback(
    async (payload: SummaryPayload) => {
      const response = await generateSummary(payload)
      setSummarySections(response.sections)
      return response
    },
    [setSummarySections]
  )

  return { summarySections, runSummary }
}

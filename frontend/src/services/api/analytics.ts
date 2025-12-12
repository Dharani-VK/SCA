import { API_BASE_URL } from '../../utils/constants'
import { request } from '../httpClient'

export type AnalyticsSessionOption = {
  sessionId: string
  attempts: number
  accuracy: number
  startedAt: string | null
  lastAttemptAt: string | null
  primarySource?: string | null
}

export type AnalyticsSourceOption = {
  label: string
  value: string
  attempts: number
  accuracy: number
}

export type AnalyticsOptionsResponse = {
  sessions: AnalyticsSessionOption[]
  sources: AnalyticsSourceOption[]
  latestSessionId?: string | null
}

export async function fetchAnalyticsOptions(): Promise<AnalyticsOptionsResponse> {
  return request<AnalyticsOptionsResponse, undefined>(`${API_BASE_URL}/analytics/quiz/options`)
}

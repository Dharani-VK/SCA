import type { DashboardOverview } from '../../types/dashboard'
import { FEATURE_FLAGS, API_BASE_URL } from '../../utils/constants'
import { request } from '../httpClient'
import { mockGetDashboardOverview } from '../mocks/dashboard.mock'

export async function getDashboardOverview(): Promise<DashboardOverview> {
  if (FEATURE_FLAGS.useMocks) {
    return mockGetDashboardOverview()
  }

  const result = await request<DashboardOverview>(`${API_BASE_URL}/dashboard/overview`)
  return result
}

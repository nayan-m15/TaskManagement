import { useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../../types/auth'
import type { DashboardData } from '../../types/dashboard'

export interface DashboardOutletContextValue {
  session: AuthSession
  displayName: string
  data?: DashboardData
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  refetch: () => Promise<unknown>
  isLoggingOut: boolean
  logoutError: string | null
}

export function useDashboardOutlet() {
  return useOutletContext<DashboardOutletContextValue>()
}

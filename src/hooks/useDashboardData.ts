import { useQuery } from '@tanstack/react-query'
import { getBoardDetail, getDashboardData } from '../services/dashboardService'

export function useDashboardData(userId?: string) {
  return useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => getDashboardData(userId ?? ''),
    enabled: Boolean(userId),
  })
}

export function useBoardDetail(boardId?: string) {
  return useQuery({
    queryKey: ['board-detail', boardId],
    queryFn: () => getBoardDetail(boardId ?? ''),
    enabled: Boolean(boardId),
  })
}

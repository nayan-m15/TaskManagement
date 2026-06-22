import { useMutation, useQueryClient } from '@tanstack/react-query'
import { repairBoardColumns } from '../services/kanbanService'
import { createBoard, createWorkspace } from '../services/workspaceService'
import type { DashboardBoard, DashboardData, DashboardWorkspace } from '../types/dashboard'

function addWorkspaceToDashboard(data: DashboardData | undefined, workspace: DashboardWorkspace) {
  if (!data) {
    return data
  }

  if (data.workspaces.some((item) => item.id === workspace.id)) {
    return data
  }

  const workspaces = [workspace, ...data.workspaces].sort((first, second) =>
    first.name.localeCompare(second.name),
  )

  return {
    ...data,
    workspaces,
    summary: {
      ...data.summary,
      workspaceCount: workspaces.length,
    },
  }
}

function addBoardToDashboard(data: DashboardData | undefined, board: DashboardBoard) {
  if (!data) {
    return data
  }

  if (data.boards.some((item) => item.id === board.id)) {
    return data
  }

  const boards = [board, ...data.boards]
  const recentBoards = [board, ...data.recentBoards.filter((item) => item.id !== board.id)].slice(0, 6)
  const activityFeed = [
    {
      id: `board-created-${board.id}`,
      title: board.name,
      description: board.workspaceName
        ? `Board created in ${board.workspaceName}.`
        : 'Board created successfully.',
      category: 'board' as const,
      createdAt: board.createdAt,
      href: `/dashboard/boards/${board.id}`,
    },
    ...data.activityFeed.filter((item) => item.id !== `board-created-${board.id}`),
  ].slice(0, 8)

  return {
    ...data,
    boards,
    recentBoards,
    activityFeed,
    summary: {
      ...data.summary,
      recentBoardCount: recentBoards.length,
    },
  }
}

export function useWorkspaceManagement(userId?: string) {
  const queryClient = useQueryClient()
  const dashboardQueryKey = ['dashboard', userId]

  const createWorkspaceMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!userId) {
        throw new Error('You must be signed in to create a workspace.')
      }

      return createWorkspace(name, userId)
    },
    onSuccess: async (workspace) => {
      queryClient.setQueryData<DashboardData | undefined>(dashboardQueryKey, (current) =>
        addWorkspaceToDashboard(current, workspace),
      )
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKey })
    },
  })

  const createBoardMutation = useMutation({
    mutationFn: async (values: { workspaceId: string; title: string }) => {
      if (!userId) {
        throw new Error('You must be signed in to create a board.')
      }

      return createBoard(values.workspaceId, values.title, userId)
    },
    onSuccess: async (board) => {
      queryClient.setQueryData<DashboardData | undefined>(dashboardQueryKey, (current) =>
        addBoardToDashboard(current, board),
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['board-detail', board.id] }),
      ])
    },
  })

  const repairBoardColumnsMutation = useMutation({
    mutationFn: async (boardId: string) => {
      if (!userId) {
        throw new Error('You must be signed in to repair board columns.')
      }

      return repairBoardColumns(boardId, userId)
    },
    onSuccess: async (_columns, boardId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['kanban-board', boardId, userId] }),
        queryClient.invalidateQueries({ queryKey: ['board-detail', boardId] }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
      ])
    },
  })

  return {
    createWorkspace: createWorkspaceMutation.mutateAsync,
    createBoard: createBoardMutation.mutateAsync,
    repairBoardColumns: repairBoardColumnsMutation.mutateAsync,
    isCreatingWorkspace: createWorkspaceMutation.isPending,
    isCreatingBoard: createBoardMutation.isPending,
    isRepairingBoardColumns: repairBoardColumnsMutation.isPending,
    createWorkspaceError: createWorkspaceMutation.error,
    createBoardError: createBoardMutation.error,
    repairBoardColumnsError: repairBoardColumnsMutation.error,
  }
}

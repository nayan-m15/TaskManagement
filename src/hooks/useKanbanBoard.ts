import { useEffect, useMemo } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { getSupabaseClient } from '../lib/supabase'
import {
  createBoardTask,
  getKanbanBoard,
  isBoardColumnRealtimeEvent,
  isBoardTaskRealtimeEvent,
  reorderBoardTasks,
  updateBoardTask,
} from '../services/kanbanService'
import type {
  BoardDetails,
  ReorderTaskPosition,
  TaskFormValues,
} from '../types/kanban'

interface UseKanbanBoardOptions {
  boardId?: string
  userId?: string
}

interface CreateTaskVariables {
  values: TaskFormValues
}

interface UpdateTaskVariables {
  taskId: string
  values: TaskFormValues
}

interface ReorderTasksVariables {
  nextBoard: BoardDetails
  positions: ReorderTaskPosition[]
}

function getBoardQueryKey(boardId?: string, userId?: string) {
  return ['kanban-board', boardId, userId]
}

function normalizeTaskValues(values: TaskFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
    priority: values.priority || null,
    assignedTo: values.assignedTo || null,
    columnId: values.columnId,
  }
}

export function useKanbanBoard({ boardId, userId }: UseKanbanBoardOptions) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => getBoardQueryKey(boardId, userId), [boardId, userId])

  const query = useQuery({
    queryKey,
    queryFn: () => getKanbanBoard(boardId ?? '', userId ?? ''),
    enabled: Boolean(boardId && userId),
  })

  const createTaskMutation = useMutation({
    mutationFn: async ({ values }: CreateTaskVariables) => {
      if (!boardId || !userId) {
        throw new Error('Board context is missing.')
      }

      return createBoardTask(boardId, userId, normalizeTaskValues(values))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, values }: UpdateTaskVariables) =>
      updateBoardTask(taskId, normalizeTaskValues(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: async ({ positions }: ReorderTasksVariables) => reorderBoardTasks(positions),
    onMutate: async ({ nextBoard }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousBoard = queryClient.getQueryData<BoardDetails | null>(queryKey) ?? null

      queryClient.setQueryData(queryKey, nextBoard)

      return { previousBoard }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKey, context.previousBoard)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  useEffect(() => {
    if (!boardId || !query.data) {
      return
    }

    const client = getSupabaseClient()
    const columnIds = new Set(query.data.columns.map((column) => column.id))
    const channel = client
      .channel(`board-${boardId}-kanban`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'boards', filter: `id=eq.${boardId}` },
        async () => {
          await queryClient.invalidateQueries({ queryKey })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_columns' },
        async (payload) => {
          if (isBoardColumnRealtimeEvent(payload, boardId)) {
            await queryClient.invalidateQueries({ queryKey })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        async (payload) => {
          if (isBoardTaskRealtimeEvent(payload, columnIds)) {
            await queryClient.invalidateQueries({ queryKey })
          }
        },
      )

    void channel.subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [boardId, query.data, queryClient, queryKey])

  return {
    ...query,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    reorderTasks: reorderMutation.mutateAsync,
    isCreatingTask: createTaskMutation.isPending,
    isUpdatingTask: updateTaskMutation.isPending,
    isReorderingTasks: reorderMutation.isPending,
    createTaskError: createTaskMutation.error,
    updateTaskError: updateTaskMutation.error,
    reorderTaskError: reorderMutation.error,
  }
}

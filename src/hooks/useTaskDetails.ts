import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '../lib/supabase'
import {
  addTaskComment,
  createTaskLabel,
  deleteTaskComment,
  getTaskDetails,
  updateBoardTask,
  updateTaskComment,
  uploadTaskAttachment,
} from '../services/kanbanService'
import type { CreateTaskLabelInput, TaskMutationInput } from '../types/kanban'

interface UseTaskDetailsOptions {
  boardId?: string
  taskId?: string | null
  userId?: string
}

interface SaveTaskVariables {
  values: TaskMutationInput
}

interface AddCommentVariables {
  content: string
}

interface EditCommentVariables {
  commentId: string
  content: string
}

interface DeleteCommentVariables {
  commentId: string
}

interface UploadAttachmentVariables {
  file: File
}

function getBoardQueryKey(boardId?: string, userId?: string) {
  return ['kanban-board', boardId, userId]
}

function getTaskDetailsQueryKey(taskId?: string | null, userId?: string) {
  return ['task-details', taskId, userId]
}

export function useTaskDetails({ boardId, taskId, userId }: UseTaskDetailsOptions) {
  const queryClient = useQueryClient()
  const boardQueryKey = useMemo(() => getBoardQueryKey(boardId, userId), [boardId, userId])
  const taskQueryKey = useMemo(() => getTaskDetailsQueryKey(taskId, userId), [taskId, userId])

  const query = useQuery({
    queryKey: taskQueryKey,
    queryFn: () => getTaskDetails(taskId ?? '', userId ?? ''),
    enabled: Boolean(taskId && userId),
  })

  const saveTaskMutation = useMutation({
    mutationFn: async ({ values }: SaveTaskVariables) => {
      if (!taskId || !userId) {
        throw new Error('Task context is missing.')
      }

      return updateBoardTask(taskId, userId, values)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskQueryKey }),
        queryClient.invalidateQueries({ queryKey: boardQueryKey }),
      ])
    },
  })

  const addCommentMutation = useMutation({
    mutationFn: async ({ content }: AddCommentVariables) => {
      if (!taskId || !userId) {
        throw new Error('Task context is missing.')
      }

      return addTaskComment(taskId, userId, content)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskQueryKey }),
        queryClient.invalidateQueries({ queryKey: boardQueryKey }),
      ])
    },
  })

  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: EditCommentVariables) => {
      if (!taskId || !userId) {
        throw new Error('Task context is missing.')
      }

      return updateTaskComment(commentId, taskId, userId, content)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskQueryKey })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ commentId }: DeleteCommentVariables) => {
      if (!taskId || !userId) {
        throw new Error('Task context is missing.')
      }

      return deleteTaskComment(commentId, taskId, userId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskQueryKey })
    },
  })

  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ file }: UploadAttachmentVariables) => {
      if (!taskId || !userId) {
        throw new Error('Task context is missing.')
      }

      return uploadTaskAttachment(taskId, userId, file)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskQueryKey }),
        queryClient.invalidateQueries({ queryKey: boardQueryKey }),
      ])
    },
  })

  const createLabelMutation = useMutation({
    mutationFn: async (input: CreateTaskLabelInput) => {
      if (!taskId || !userId) {
        throw new Error('Task context is missing.')
      }

      return createTaskLabel(userId, taskId, input)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskQueryKey }),
        queryClient.invalidateQueries({ queryKey: boardQueryKey }),
      ])
    },
  })

  useEffect(() => {
    if (!taskId || !userId) {
      return
    }

    const client = getSupabaseClient()
    const channel = client
      .channel(`task-${taskId}-details`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${taskId}` },
        async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: taskQueryKey }),
            queryClient.invalidateQueries({ queryKey: boardQueryKey }),
          ])
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` },
        async () => {
          await queryClient.invalidateQueries({ queryKey: taskQueryKey })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_attachments', filter: `task_id=eq.${taskId}` },
        async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: taskQueryKey }),
            queryClient.invalidateQueries({ queryKey: boardQueryKey }),
          ])
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_label_assignments', filter: `task_id=eq.${taskId}` },
        async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: taskQueryKey }),
            queryClient.invalidateQueries({ queryKey: boardQueryKey }),
          ])
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_logs', filter: `task_id=eq.${taskId}` },
        async () => {
          await queryClient.invalidateQueries({ queryKey: taskQueryKey })
        },
      )

    void channel.subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [boardQueryKey, queryClient, taskId, taskQueryKey, userId])

  return {
    ...query,
    saveTask: saveTaskMutation.mutateAsync,
    addComment: addCommentMutation.mutateAsync,
    editComment: editCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    uploadAttachment: uploadAttachmentMutation.mutateAsync,
    createLabel: createLabelMutation.mutateAsync,
    isSavingTask: saveTaskMutation.isPending,
    isAddingComment: addCommentMutation.isPending,
    isEditingComment: editCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
    isUploadingAttachment: uploadAttachmentMutation.isPending,
    isCreatingLabel: createLabelMutation.isPending,
    saveTaskError: saveTaskMutation.error,
    commentError: addCommentMutation.error ?? editCommentMutation.error ?? deleteCommentMutation.error,
    attachmentError: uploadAttachmentMutation.error,
    createLabelError: createLabelMutation.error,
  }
}

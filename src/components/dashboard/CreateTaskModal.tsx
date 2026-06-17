import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { z } from 'zod'
import { useKanbanBoard } from '../../hooks/useKanbanBoard'
import type { DashboardBoard, DashboardWorkspace } from '../../types/dashboard'
import type { TaskFormValues } from '../../types/kanban'
import AssigneeSelector from '../board/AssigneeSelector'
import LabelSelector from '../board/LabelSelector'

const createTaskSchema = z.object({
  workspaceId: z.string(),
  boardId: z.string().trim().min(1, 'Choose a board.'),
  title: z.string().trim().min(1, 'Task title is required.'),
  description: z.string(),
  dueDate: z.string(),
  priority: z.union([z.literal(''), z.enum(['low', 'medium', 'high', 'urgent'])]),
  assignedTo: z.string(),
  columnId: z.string().trim().min(1, 'Choose a column.'),
  labelIds: z.array(z.string()),
})

type CreateTaskFormValues = z.infer<typeof createTaskSchema>

interface CreateTaskModalProps {
  userId: string
  workspaces: DashboardWorkspace[]
  boards: DashboardBoard[]
  isDashboardLoading: boolean
  isOpen: boolean
  onClose: () => void
}

function CreateTaskModal({
  userId,
  workspaces,
  boards,
  isDashboardLoading,
  isOpen,
  onClose,
}: CreateTaskModalProps) {
  const queryClient = useQueryClient()
  const defaultBoard = boards[0]

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      workspaceId: defaultBoard?.workspaceId ?? '',
      boardId: defaultBoard?.id ?? '',
      title: '',
      description: '',
      dueDate: '',
      priority: '',
      assignedTo: '',
      columnId: '',
      labelIds: [],
    },
  })

  const selectedWorkspaceId = useWatch({ control, name: 'workspaceId' })
  const selectedBoardId = useWatch({ control, name: 'boardId' })
  const selectedColumnId = useWatch({ control, name: 'columnId' })
  const filteredBoards = useMemo(
    () =>
      selectedWorkspaceId
        ? boards.filter((board) => board.workspaceId === selectedWorkspaceId)
        : boards,
    [boards, selectedWorkspaceId],
  )
  const hasAvailableBoards = boards.length > 0
  const hasBoardsInSelectedWorkspace = filteredBoards.length > 0

  const boardDetails = useKanbanBoard({
    boardId: selectedBoardId || undefined,
    userId,
  })

  useEffect(() => {
    if (!isOpen) {
      return
    }

    reset({
      workspaceId: defaultBoard?.workspaceId ?? '',
      boardId: defaultBoard?.id ?? '',
      title: '',
      description: '',
      dueDate: '',
      priority: '',
      assignedTo: '',
      columnId: '',
      labelIds: [],
    })
  }, [defaultBoard?.id, defaultBoard?.workspaceId, isOpen, reset])

  useEffect(() => {
    if (!selectedWorkspaceId) {
      return
    }

    const hasMatchingBoard = filteredBoards.some((board) => board.id === selectedBoardId)
    if (!hasMatchingBoard) {
      const nextBoard = filteredBoards[0]
      setValue('boardId', nextBoard?.id ?? '')
      setValue('columnId', '')
      setValue('labelIds', [])
      setValue('assignedTo', '')
    }
  }, [filteredBoards, selectedBoardId, selectedWorkspaceId, setValue])

  useEffect(() => {
    const firstColumnId = boardDetails.data?.columns[0]?.id ?? ''
    const availableColumnIds = new Set(boardDetails.data?.columns.map((column) => column.id) ?? [])

    if (!availableColumnIds.has(selectedColumnId) && firstColumnId) {
      setValue('columnId', firstColumnId)
    }
  }, [boardDetails.data, selectedColumnId, setValue])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  async function onSubmit(values: CreateTaskFormValues) {
    const taskValues: TaskFormValues = {
      title: values.title,
      description: values.description,
      dueDate: values.dueDate,
      priority: values.priority,
      assignedTo: values.assignedTo,
      columnId: values.columnId,
      labelIds: values.labelIds,
    }

    await boardDetails.createTask({ values: taskValues })
    await queryClient.invalidateQueries({ queryKey: ['dashboard', userId] })
    await queryClient.invalidateQueries({ queryKey: ['board-detail'] })
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="kanban-modal-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="kanban-modal dashboard-create-task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-create-task-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="kanban-modal-header">
          <div>
            <p className="dashboard-card-label">Create task</p>
            <h2 id="dashboard-create-task-title">Add work from anywhere</h2>
            <p className="auth-copy">
              Choose a workspace and board first, then capture the task with the right status,
              assignee, priority, and due date.
            </p>
          </div>
          <button type="button" className="kanban-modal-close" onClick={onClose} aria-label="Close create task modal">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {isDashboardLoading ? (
          <div className="dashboard-empty-state">
            <h3>Loading board options</h3>
            <p>We are checking which workspaces, boards, columns, and members are available for task creation.</p>
          </div>
        ) : !hasAvailableBoards ? (
          <div className="dashboard-empty-state">
            <h3>No boards available yet</h3>
            <p>Create or join a board before adding tasks from the dashboard. The button stays available so this state is visible instead of silently failing.</p>
          </div>
        ) : (
          <form className="kanban-task-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="kanban-form-grid">
              <div className="auth-field">
                <label htmlFor="task-workspace">Workspace</label>
                <select id="task-workspace" className="kanban-input" {...register('workspaceId')}>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label htmlFor="task-board">Board</label>
                <select id="task-board" className="kanban-input" {...register('boardId')}>
                  {filteredBoards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
                {!hasBoardsInSelectedWorkspace ? (
                  <p className="auth-message" role="status">
                    No boards are available in this workspace yet. Choose another workspace or create a board first.
                  </p>
                ) : null}
                {errors.boardId ? (
                  <p className="auth-message auth-message-error">{errors.boardId.message}</p>
                ) : null}
              </div>

              <div className="auth-field auth-field-span-2">
                <label htmlFor="task-title">Title</label>
                <input
                  id="task-title"
                  className="kanban-input"
                  placeholder="Ship workspace navigation redesign"
                  {...register('title')}
                />
                {errors.title ? (
                  <p className="auth-message auth-message-error">{errors.title.message}</p>
                ) : null}
              </div>

              <div className="auth-field auth-field-span-2">
                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  className="kanban-textarea"
                  rows={5}
                  placeholder="Add implementation notes, acceptance criteria, or context"
                  {...register('description')}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="task-column">Column</label>
                <select
                  id="task-column"
                  className="kanban-input"
                  {...register('columnId')}
                  disabled={boardDetails.isLoading || !boardDetails.data?.columns.length}
                >
                  {(boardDetails.data?.columns ?? []).map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
                {errors.columnId ? (
                  <p className="auth-message auth-message-error">{errors.columnId.message}</p>
                ) : null}
              </div>

              <div className="auth-field">
                <label htmlFor="task-priority">Priority</label>
                <select id="task-priority" className="kanban-input" {...register('priority')}>
                  <option value="">No priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="auth-field">
                <label htmlFor="task-due-date">Due date</label>
                <div className="task-inline-field">
                  <input
                    id="task-due-date"
                    type="datetime-local"
                    className="kanban-input"
                    {...register('dueDate')}
                  />
                  <button
                    type="button"
                    className="auth-submit auth-submit-secondary task-inline-button"
                    onClick={() => setValue('dueDate', '')}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="task-assignee">Assignee</label>
                <Controller
                  control={control}
                  name="assignedTo"
                  render={({ field }) => (
                    <AssigneeSelector
                      id="task-assignee"
                      members={boardDetails.data?.members ?? []}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="auth-field auth-field-span-2">
                <label>Labels</label>
                <Controller
                  control={control}
                  name="labelIds"
                  render={({ field }) => (
                    <LabelSelector
                      labels={boardDetails.data?.availableLabels ?? []}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            {boardDetails.isLoading ? (
              <p className="auth-message" role="status">
                Loading board members, columns, and labels...
              </p>
            ) : null}

            {boardDetails.error ? (
              <p className="auth-message auth-message-error" role="alert">
                {boardDetails.error instanceof Error
                  ? boardDetails.error.message
                  : 'Unable to load board details.'}
              </p>
            ) : null}

            {boardDetails.createTaskError ? (
              <p className="auth-message auth-message-error" role="alert">
                {boardDetails.createTaskError instanceof Error
                  ? boardDetails.createTaskError.message
                  : 'Unable to create the task.'}
              </p>
            ) : null}

            <div className="kanban-modal-actions">
              <button type="button" className="auth-submit auth-submit-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="auth-submit"
                disabled={
                  boardDetails.isLoading ||
                  boardDetails.isCreatingTask ||
                  !selectedBoardId ||
                  !hasBoardsInSelectedWorkspace ||
                  !boardDetails.data?.columns.length
                }
              >
                {boardDetails.isCreatingTask ? 'Creating...' : 'Create task'}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  )
}

export default CreateTaskModal

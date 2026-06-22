import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { z } from 'zod'
import { useWorkspaceManagement } from '../../hooks/useWorkspaceManagement'
import type { DashboardWorkspace } from '../../types/dashboard'

const createBoardSchema = z.object({
  workspaceId: z.string().trim().min(1, 'Choose a workspace.'),
  title: z.string().trim().min(1, 'Board title is required.'),
})

type CreateBoardFormValues = z.infer<typeof createBoardSchema>

interface CreateBoardModalProps {
  userId: string
  workspaces: DashboardWorkspace[]
  isOpen: boolean
  initialWorkspaceId?: string
  onClose: () => void
  onRequestCreateWorkspace: () => void
  onCreated?: (boardName: string) => void
}

function CreateBoardModal({
  userId,
  workspaces,
  isOpen,
  initialWorkspaceId,
  onClose,
  onRequestCreateWorkspace,
  onCreated,
}: CreateBoardModalProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    createBoard,
    isCreatingBoard,
    createBoardError,
  } = useWorkspaceManagement(userId)
  const defaultWorkspaceId = useMemo(
    () => initialWorkspaceId || workspaces[0]?.id || '',
    [initialWorkspaceId, workspaces],
  )
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBoardFormValues>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: {
      workspaceId: defaultWorkspaceId,
      title: '',
    },
  })

  const handleClose = useCallback(() => {
    setSuccessMessage(null)
    reset({
      workspaceId: defaultWorkspaceId,
      title: '',
    })
    onClose()
  }, [defaultWorkspaceId, onClose, reset])

  useEffect(() => {
    if (isOpen) {
      reset({
        workspaceId: defaultWorkspaceId,
        title: '',
      })
    }
  }, [defaultWorkspaceId, isOpen, reset])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isCreatingBoard) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [handleClose, isCreatingBoard, isOpen])

  async function onSubmit(values: CreateBoardFormValues) {
    const board = await createBoard({
      workspaceId: values.workspaceId,
      title: values.title,
    })
    setSuccessMessage(`Board "${board.name}" created successfully.`)
    onCreated?.(board.name)
    reset({
      workspaceId: values.workspaceId,
      title: '',
    })
    window.setTimeout(() => {
      handleClose()
    }, 500)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="kanban-modal-backdrop" role="presentation" onClick={() => !isCreatingBoard && handleClose()}>
      <aside
        className="kanban-modal dashboard-creation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-board-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="kanban-modal-header">
          <div>
            <p className="dashboard-card-label">Create board</p>
            <h2 id="create-board-title">Add a board to a workspace</h2>
            <p className="auth-copy">
              New boards start with Todo, In Progress, Review, and Done so the team can add tasks right away.
            </p>
          </div>
          <button
            type="button"
            className="kanban-modal-close"
            onClick={handleClose}
            aria-label="Close create board modal"
            disabled={isCreatingBoard}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {workspaces.length === 0 ? (
          <div className="dashboard-empty-state">
            <h3>Create a workspace first</h3>
            <p>You need a workspace before you can add a board, because every board belongs to a workspace.</p>
            <button type="button" className="auth-submit" onClick={onRequestCreateWorkspace}>
              Create Workspace
            </button>
          </div>
        ) : (
          <form className="kanban-task-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-field">
              <label htmlFor="board-workspace">Workspace</label>
              <select
                id="board-workspace"
                className="kanban-input"
                {...register('workspaceId')}
                disabled={isCreatingBoard}
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
              {errors.workspaceId ? (
                <p className="auth-message auth-message-error" role="alert">
                  {errors.workspaceId.message}
                </p>
              ) : null}
            </div>

            <div className="auth-field">
              <label htmlFor="board-title">Board title</label>
              <input
                id="board-title"
                className="kanban-input"
                placeholder="Sprint planning"
                {...register('title')}
                disabled={isCreatingBoard}
              />
              {errors.title ? (
                <p className="auth-message auth-message-error" role="alert">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            {successMessage ? (
              <p className="auth-message auth-message-success" role="status">
                {successMessage}
              </p>
            ) : null}

            {createBoardError ? (
              <p className="auth-message auth-message-error" role="alert">
                {createBoardError instanceof Error
                  ? createBoardError.message
                  : 'Unable to create the board.'}
              </p>
            ) : null}

            <div className="kanban-modal-actions">
              <button
                type="button"
                className="auth-submit auth-submit-secondary"
                onClick={handleClose}
                disabled={isCreatingBoard}
              >
                Cancel
              </button>
              <button type="submit" className="auth-submit" disabled={isCreatingBoard}>
                {isCreatingBoard ? 'Creating board...' : 'Create Board'}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  )
}

export default CreateBoardModal

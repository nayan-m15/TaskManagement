import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { z } from 'zod'
import { useWorkspaceManagement } from '../../hooks/useWorkspaceManagement'

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, 'Workspace name is required.'),
})

type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>

interface CreateWorkspaceModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onCreated?: (workspaceName: string) => void
}

function CreateWorkspaceModal({
  userId,
  isOpen,
  onClose,
  onCreated,
}: CreateWorkspaceModalProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    createWorkspace,
    isCreatingWorkspace,
    createWorkspaceError,
  } = useWorkspaceManagement(userId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
    },
  })

  const handleClose = useCallback(() => {
    setSuccessMessage(null)
    reset({ name: '' })
    onClose()
  }, [onClose, reset])

  useEffect(() => {
    if (isOpen) {
      reset({ name: '' })
    }
  }, [isOpen, reset])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isCreatingWorkspace) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [handleClose, isCreatingWorkspace, isOpen])

  async function onSubmit(values: CreateWorkspaceFormValues) {
    const workspace = await createWorkspace(values.name)
    setSuccessMessage(`Workspace "${workspace.name}" created successfully.`)
    onCreated?.(workspace.name)
    reset({ name: '' })
    window.setTimeout(() => {
      handleClose()
    }, 500)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="kanban-modal-backdrop" role="presentation" onClick={() => !isCreatingWorkspace && handleClose()}>
      <aside
        className="kanban-modal dashboard-creation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workspace-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="kanban-modal-header">
          <div>
            <p className="dashboard-card-label">Create workspace</p>
            <h2 id="create-workspace-title">Start a new workspace</h2>
            <p className="auth-copy">
              Workspaces group boards, members, and tasks so each team or initiative has a clean home.
            </p>
          </div>
          <button
            type="button"
            className="kanban-modal-close"
            onClick={handleClose}
            aria-label="Close create workspace modal"
            disabled={isCreatingWorkspace}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form className="kanban-task-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="auth-field">
            <label htmlFor="workspace-name">Workspace name</label>
            <input
              id="workspace-name"
              className="kanban-input"
              placeholder="Product design"
              {...register('name')}
              disabled={isCreatingWorkspace}
            />
            {errors.name ? (
              <p className="auth-message auth-message-error" role="alert">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          {successMessage ? (
            <p className="auth-message auth-message-success" role="status">
              {successMessage}
            </p>
          ) : null}

          {createWorkspaceError ? (
            <p className="auth-message auth-message-error" role="alert">
              {createWorkspaceError instanceof Error
                ? createWorkspaceError.message
                : 'Unable to create the workspace.'}
            </p>
          ) : null}

          <div className="kanban-modal-actions">
            <button
              type="button"
              className="auth-submit auth-submit-secondary"
              onClick={handleClose}
              disabled={isCreatingWorkspace}
            >
              Cancel
            </button>
            <button type="submit" className="auth-submit" disabled={isCreatingWorkspace}>
              {isCreatingWorkspace ? 'Creating workspace...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}

export default CreateWorkspaceModal

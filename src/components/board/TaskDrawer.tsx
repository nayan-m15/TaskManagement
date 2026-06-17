import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { X } from 'lucide-react'
import { z } from 'zod'
import { useTaskDetails } from '../../hooks/useTaskDetails'
import type { BoardDetails, BoardTask, TaskFormValues } from '../../types/kanban'
import AssigneeSelector from './AssigneeSelector'
import AttachmentList from './AttachmentList'
import ActivityHistory from './ActivityHistory'
import CommentThread from './CommentThread'
import DueDateBadge from './DueDateBadge'
import LabelSelector from './LabelSelector'
import TaskPriorityBadge from './TaskPriorityBadge'

const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required.'),
  description: z.string(),
  dueDate: z.string(),
  priority: z.union([z.literal(''), z.enum(['low', 'medium', 'high', 'urgent'])]),
  assignedTo: z.string(),
  columnId: z.string().trim().min(1, 'Choose a column.'),
  labelIds: z.array(z.string()),
})

interface TaskDrawerProps {
  mode: 'create' | 'edit'
  board: BoardDetails
  task?: BoardTask | null
  selectedColumnId: string
  currentUserId?: string
  isCreatingTask: boolean
  createTaskError?: string | null
  onClose: () => void
  onCreateTask: (values: TaskFormValues) => Promise<void>
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function TaskDrawer({
  mode,
  board,
  task,
  selectedColumnId,
  currentUserId,
  isCreatingTask,
  createTaskError,
  onClose,
  onCreateTask,
}: TaskDrawerProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const taskDetails = useTaskDetails({
    boardId: board.id,
    taskId: mode === 'edit' ? task?.id ?? null : null,
    userId: currentUserId,
  })

  const detail = taskDetails.data
  const availableLabels = detail?.availableLabels ?? board.availableLabels
  const defaultValues = useMemo<TaskFormValues>(
    () => ({
      title: detail?.title ?? task?.title ?? '',
      description: detail?.description ?? task?.description ?? '',
      dueDate: toDateTimeLocalValue(detail?.dueDate ?? task?.dueDate),
      priority: detail?.priority ?? task?.priority ?? '',
      assignedTo: detail?.assignedTo ?? task?.assignedTo ?? '',
      columnId: detail?.columnId ?? task?.columnId ?? selectedColumnId,
      labelIds: detail?.labels.map((label) => label.id) ?? task?.labels.map((label) => label.id) ?? [],
    }),
    [detail, selectedColumnId, task],
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const currentPriority = useWatch({ control, name: 'priority' })
  const currentDueDate = useWatch({ control, name: 'dueDate' })

  async function handleFormSubmit(values: TaskFormValues) {
    setStatusMessage(null)

    if (mode === 'create') {
      await onCreateTask(values)
      onClose()
      return
    }

    await taskDetails.saveTask({
      values: {
        title: values.title.trim(),
        description: values.description.trim() || null,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
        priority: values.priority || null,
        assignedTo: values.assignedTo || null,
        columnId: values.columnId,
        labelIds: values.labelIds,
      },
    })

    setStatusMessage('Task changes saved.')
  }

  return (
    <div className="task-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="task-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="task-drawer-header">
          <div>
            <p className="dashboard-card-label">{mode === 'create' ? 'New task' : 'Task details'}</p>
            <h2 id="task-drawer-title">{mode === 'create' ? 'Create task' : detail?.title || task?.title || 'Task'}</h2>
            <p className="auth-copy">
              {mode === 'create'
                ? 'Create a task and capture ownership, timing, and labels from the start.'
                : 'Review the task, update details, and follow comments, files, and history in one place.'}
            </p>
          </div>
          <button type="button" className="kanban-modal-close" onClick={onClose} aria-label="Close task drawer">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="task-drawer-body">
          <section className="task-drawer-main">
            {mode === 'edit' && taskDetails.isLoading ? (
              <section className="dashboard-feedback-card" aria-live="polite">
                <p className="dashboard-card-label">Loading</p>
                <h2>Loading task details</h2>
                <p>We are gathering labels, comments, attachments, and activity for this task.</p>
              </section>
            ) : null}

            {mode === 'edit' && taskDetails.isError ? (
              <section className="dashboard-feedback-card" role="alert">
                <p className="dashboard-card-label">Unavailable</p>
                <h2>Task details could not be loaded</h2>
                <p>{taskDetails.error instanceof Error ? taskDetails.error.message : 'Try again in a moment.'}</p>
              </section>
            ) : null}

            {detail?.warnings.length ? (
              <section className="dashboard-banner" role="status" aria-live="polite">
                <div>
                  <strong>Some task features are partially configured.</strong>
                  <p>{detail.warnings[0]}</p>
                </div>
              </section>
            ) : null}

            <form className="task-drawer-form" onSubmit={handleSubmit(handleFormSubmit)}>
              <section className="task-drawer-section">
                <div className="task-section-header">
                  <div>
                    <p className="dashboard-card-label">Overview</p>
                    <h3>Task details</h3>
                  </div>
                  <div className="dashboard-badge-row">
                    <TaskPriorityBadge priority={currentPriority || null} />
                    <DueDateBadge dueDate={currentDueDate ? new Date(currentDueDate).toISOString() : null} />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="task-title">Title</label>
                  <input
                    id="task-title"
                    className="kanban-input"
                    placeholder="Add a clear task title"
                    {...register('title')}
                  />
                  {errors.title ? <p className="auth-message auth-message-error">{errors.title.message}</p> : null}
                </div>

                <div className="auth-field">
                  <label htmlFor="task-description">Description</label>
                  <textarea
                    id="task-description"
                    className="kanban-textarea"
                    rows={5}
                    placeholder="Add implementation notes, acceptance criteria, or context"
                    {...register('description')}
                  />
                </div>

                <div className="kanban-form-grid">
                  <div className="auth-field">
                    <label htmlFor="task-column">Column</label>
                    <select id="task-column" className="kanban-input" {...register('columnId')}>
                      {board.columns.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.title}
                        </option>
                      ))}
                    </select>
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
                      <input id="task-due-date" type="datetime-local" className="kanban-input" {...register('dueDate')} />
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
                          members={board.members}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
              </section>

              <section className="task-drawer-section">
                <div className="task-section-header">
                  <div>
                    <p className="dashboard-card-label">Labels</p>
                    <h3>Classification</h3>
                  </div>
                </div>

                <Controller
                  control={control}
                  name="labelIds"
                  render={({ field }) => (
                    <LabelSelector
                      labels={availableLabels}
                      value={field.value}
                      isCreatingLabel={taskDetails.isCreatingLabel}
                      onChange={field.onChange}
                      onCreateLabel={mode === 'edit' ? taskDetails.createLabel : undefined}
                    />
                  )}
                />

                {mode === 'create' ? (
                  <p className="task-section-help">
                    New labels can be created after the task exists. Existing board labels can already be assigned now.
                  </p>
                ) : null}

                {taskDetails.createLabelError ? (
                  <p className="auth-message auth-message-error" role="alert">
                    {taskDetails.createLabelError instanceof Error
                      ? taskDetails.createLabelError.message
                      : 'Unable to create the label.'}
                  </p>
                ) : null}
              </section>

              {statusMessage ? (
                <p className="auth-message auth-message-success" role="status">
                  {statusMessage}
                </p>
              ) : null}

              {createTaskError ? (
                <p className="auth-message auth-message-error" role="alert">
                  {createTaskError}
                </p>
              ) : null}

              {taskDetails.saveTaskError ? (
                <p className="auth-message auth-message-error" role="alert">
                  {taskDetails.saveTaskError instanceof Error
                    ? taskDetails.saveTaskError.message
                    : 'Unable to save task changes.'}
                </p>
              ) : null}

              <div className="kanban-modal-actions">
                <button type="button" className="auth-submit auth-submit-secondary" onClick={onClose}>
                  Close
                </button>
                <button type="submit" className="auth-submit" disabled={isCreatingTask || taskDetails.isSavingTask}>
                  {isCreatingTask || taskDetails.isSavingTask
                    ? 'Saving...'
                    : mode === 'create'
                      ? 'Create task'
                      : 'Save changes'}
                </button>
              </div>
            </form>
          </section>

          <section className="task-drawer-sidebar">
            {mode === 'edit' && detail ? (
              <>
                <AttachmentList
                  attachments={detail.attachments}
                  canUpload={detail.supports.attachmentUpload}
                  isUploading={taskDetails.isUploadingAttachment}
                  helpMessage={
                    detail.supports.attachmentUpload
                      ? null
                      : 'Attachment uploads require a public Supabase storage bucket and the attachment metadata migration.'
                  }
                  onUpload={async (file) => {
                    await taskDetails.uploadAttachment({ file })
                  }}
                />

                {taskDetails.attachmentError ? (
                  <p className="auth-message auth-message-error" role="alert">
                    {taskDetails.attachmentError instanceof Error
                      ? taskDetails.attachmentError.message
                      : 'Unable to upload the attachment.'}
                  </p>
                ) : null}

                <CommentThread
                  comments={detail.comments}
                  currentUserId={currentUserId}
                  isSubmitting={taskDetails.isAddingComment}
                  isMutatingComment={taskDetails.isEditingComment || taskDetails.isDeletingComment}
                  errorMessage={
                    taskDetails.commentError instanceof Error ? taskDetails.commentError.message : null
                  }
                  onAddComment={async (content) => {
                    await taskDetails.addComment({ content })
                  }}
                  onEditComment={async (commentId, content) => {
                    await taskDetails.editComment({ commentId, content })
                  }}
                  onDeleteComment={async (commentId) => {
                    await taskDetails.deleteComment({ commentId })
                  }}
                />

                <ActivityHistory activity={detail.activity} />
              </>
            ) : (
              <>
                <AttachmentList
                  attachments={[]}
                  canUpload={false}
                  isUploading={false}
                  emptyMessage="Create the task first, then files can be attached from this drawer."
                />
                <CommentThread
                  comments={[]}
                  currentUserId={currentUserId}
                  disabled
                  onAddComment={async () => undefined}
                  onEditComment={async () => undefined}
                  onDeleteComment={async () => undefined}
                />
                <ActivityHistory activity={[]} />
              </>
            )}
          </section>
        </div>
      </aside>
    </div>
  )
}

export default TaskDrawer

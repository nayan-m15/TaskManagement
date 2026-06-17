import { useMemo } from 'react'
import { X } from 'lucide-react'
import type { BoardColumn, BoardTask, TaskFormValues } from '../../types/kanban'
import type { BoardAssignee } from '../../types/kanban'
import TaskForm from './TaskForm'

interface TaskModalProps {
  mode: 'create' | 'edit'
  columns: BoardColumn[]
  members: BoardAssignee[]
  task?: BoardTask | null
  selectedColumnId: string
  isSubmitting: boolean
  errorMessage?: string | null
  onClose: () => void
  onSubmit: (values: TaskFormValues) => Promise<void>
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

function TaskModal({
  mode,
  columns,
  members,
  task,
  selectedColumnId,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const defaultValues = useMemo<TaskFormValues>(
    () => ({
      title: task?.title ?? '',
      description: task?.description ?? '',
      dueDate: toDateTimeLocalValue(task?.dueDate),
      priority: task?.priority === 'low' || task?.priority === 'medium' || task?.priority === 'high'
        ? task.priority
        : '',
      assignedTo: task?.assignedTo ?? '',
      columnId: task?.columnId ?? selectedColumnId,
    }),
    [selectedColumnId, task],
  )

  return (
    <div className="kanban-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="kanban-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="kanban-modal-header">
          <div>
            <p className="dashboard-card-label">{mode === 'create' ? 'New task' : 'Edit task'}</p>
            <h2 id="task-modal-title">
              {mode === 'create' ? 'Create task' : 'Update task'}
            </h2>
            <p className="auth-copy">
              {mode === 'create'
                ? 'Add a task to the selected column with assignment, schedule, and priority details.'
                : 'Update the task details without losing the rest of the current task data.'}
            </p>
          </div>
          <button type="button" className="kanban-modal-close" onClick={onClose} aria-label="Close task dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <TaskForm
          columns={columns}
          members={members}
          defaultValues={defaultValues}
          isSubmitting={isSubmitting}
          submitLabel={mode === 'create' ? 'Create task' : 'Save changes'}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </section>
    </div>
  )
}

export default TaskModal

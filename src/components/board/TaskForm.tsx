import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  TASK_PRIORITY_OPTIONS,
  type BoardAssignee,
  type BoardColumn,
  type TaskFormValues,
} from '../../types/kanban'

const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required.'),
  description: z.string(),
  dueDate: z.string(),
  priority: z.union([z.literal(''), z.enum(TASK_PRIORITY_OPTIONS)]),
  assignedTo: z.string(),
  columnId: z.string().trim().min(1, 'Choose a column.'),
})

interface TaskFormProps {
  columns: BoardColumn[]
  members: BoardAssignee[]
  defaultValues: TaskFormValues
  isSubmitting: boolean
  submitLabel: string
  errorMessage?: string | null
  onSubmit: (values: TaskFormValues) => Promise<void>
  onCancel: () => void
}

function TaskForm({
  columns,
  members,
  defaultValues,
  isSubmitting,
  submitLabel,
  errorMessage,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  })

  return (
    <form className="kanban-task-form" onSubmit={handleSubmit(onSubmit)}>
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
          rows={4}
          placeholder="Summarize the work, context, or acceptance notes"
          {...register('description')}
        />
      </div>

      <div className="kanban-form-grid">
        <div className="auth-field">
          <label htmlFor="task-column">Column</label>
          <select id="task-column" className="kanban-input" {...register('columnId')}>
            {columns.map((column) => (
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
            {TASK_PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          <label htmlFor="task-due-date">Due date</label>
          <input id="task-due-date" type="datetime-local" className="kanban-input" {...register('dueDate')} />
        </div>

        <div className="auth-field">
          <label htmlFor="task-assignee">Assigned user</label>
          <select id="task-assignee" className="kanban-input" {...register('assignedTo')}>
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.username || member.email || member.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage ? <p className="auth-message auth-message-error">{errorMessage}</p> : null}

      <div className="kanban-modal-actions">
        <button type="button" className="auth-submit auth-submit-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default TaskForm

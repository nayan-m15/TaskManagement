import type { ButtonHTMLAttributes } from 'react'
import { CalendarDays, Clock3, GripVertical, Text } from 'lucide-react'
import { formatDate } from '../../utils/formatDate'
import type { BoardTask } from '../../types/kanban'

interface TaskCardProps {
  task: BoardTask
  isDragging?: boolean
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>
  onEdit: (task: BoardTask) => void
}

function TaskCard({ task, isDragging = false, dragHandleProps, onEdit }: TaskCardProps) {
  return (
    <article className={`kanban-task-card${isDragging ? ' kanban-task-card-dragging' : ''}`}>
      <div className="kanban-task-card-header">
        <button
          type="button"
          className="kanban-task-drag-handle"
          aria-label={`Drag task ${task.title}`}
          {...dragHandleProps}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>
        {task.priority ? <span className="kanban-priority-pill">{task.priority}</span> : null}
      </div>

      <button
        type="button"
        className="kanban-task-card-button"
        onClick={() => onEdit(task)}
      >
        <div className="kanban-task-card-content">
          <div className="kanban-task-card-heading">
            <h3>{task.title}</h3>
            {task.description ? (
              <p className="kanban-task-card-description">{task.description}</p>
            ) : (
              <p className="kanban-task-card-description-empty">
                No description yet
              </p>
            )}
          </div>

          <div className="kanban-task-meta">
            {task.dueDate ? (
              <span>
                <CalendarDays size={14} aria-hidden="true" />
                Due {formatDate(task.dueDate)}
              </span>
            ) : null}
            {task.createdAt ? (
              <span>
                <Clock3 size={14} aria-hidden="true" />
                Created {formatDate(task.createdAt)}
              </span>
            ) : null}
            {task.description ? (
              <span>
                <Text size={14} aria-hidden="true" />
                Notes attached
              </span>
            ) : null}
          </div>

          <div className="kanban-task-footer">
            {task.assignee ? (
              <span className="kanban-assignee-pill">
                {task.assignee.username || task.assignee.email || 'Assigned'}
              </span>
            ) : (
              <span className="kanban-assignee-pill kanban-assignee-pill-muted">
                Unassigned
              </span>
            )}
          </div>
        </div>
      </button>
    </article>
  )
}

export default TaskCard

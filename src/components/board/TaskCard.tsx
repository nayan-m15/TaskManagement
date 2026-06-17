import type { ButtonHTMLAttributes } from 'react'
import { Clock3, GripVertical, MessageSquare, Tags, Text } from 'lucide-react'
import { formatDate } from '../../utils/formatDate'
import type { BoardTask } from '../../types/kanban'
import DueDateBadge from './DueDateBadge'
import TaskPriorityBadge from './TaskPriorityBadge'

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
        <div className="dashboard-badge-row">
          <TaskPriorityBadge priority={task.priority} />
        </div>
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
            <DueDateBadge dueDate={task.dueDate} />
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
            {task.labels.length ? (
              <span>
                <Tags size={14} aria-hidden="true" />
                {task.labels.length} label{task.labels.length === 1 ? '' : 's'}
              </span>
            ) : null}
            <span>
              <MessageSquare size={14} aria-hidden="true" />
              Open details
            </span>
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
            {task.labels.length ? (
              <div className="task-card-label-row" aria-label="Task labels">
                {task.labels.slice(0, 2).map((label) => (
                  <span key={label.id} className="task-mini-label">
                    <span
                      className="task-mini-label-dot"
                      style={{ backgroundColor: label.color || 'var(--color-text-muted)' }}
                      aria-hidden="true"
                    />
                    {label.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </button>
    </article>
  )
}

export default TaskCard

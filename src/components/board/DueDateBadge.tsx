import { CalendarDays } from 'lucide-react'
import { getTaskDueLabel, getTaskDueState } from '../../utils/taskPresentation'

interface DueDateBadgeProps {
  dueDate?: string | null
}

function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  const dueState = getTaskDueState(dueDate)

  return (
    <span className={`task-badge task-badge-${dueState}`}>
      <CalendarDays size={14} aria-hidden="true" />
      {getTaskDueLabel(dueDate)}
    </span>
  )
}

export default DueDateBadge

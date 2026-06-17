import type { TaskPriority } from '../../types/kanban'
import { getTaskPriorityLabel, getTaskPriorityTone } from '../../utils/taskPresentation'

interface TaskPriorityBadgeProps {
  priority?: TaskPriority | null
}

function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  return (
    <span className={`task-badge task-badge-${getTaskPriorityTone(priority)}`}>
      {getTaskPriorityLabel(priority)}
    </span>
  )
}

export default TaskPriorityBadge

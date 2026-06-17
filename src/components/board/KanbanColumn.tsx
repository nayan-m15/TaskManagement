import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { BoardColumn, BoardTask } from '../../types/kanban'
import SortableTaskCard from './SortableTaskCard'

interface KanbanColumnProps {
  column: BoardColumn
  onAddTask: (columnId: string) => void
  onEditTask: (task: BoardTask) => void
}

function KanbanColumn({ column, onAddTask, onEditTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
  })

  return (
    <section className="kanban-column">
      <header className="kanban-column-header">
        <div>
          <p className="dashboard-card-label">Column</p>
          <h2>{column.title}</h2>
        </div>
        <span className="home-status-pill">{column.tasks.length}</span>
      </header>

      <button
        type="button"
        className="kanban-column-add-button"
        onClick={() => onAddTask(column.id)}
      >
        <Plus size={16} aria-hidden="true" />
        Add task
      </button>

      <div
        ref={setNodeRef}
        className={`kanban-column-body${isOver ? ' kanban-column-body-over' : ''}`}
      >
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.length > 0 ? (
            <div className="kanban-task-list">
              {column.tasks.map((task) => (
                <SortableTaskCard key={task.id} task={task} onEdit={onEditTask} />
              ))}
            </div>
          ) : (
            <div className="kanban-empty-column">
              <h3>No tasks yet</h3>
              <p>Create a task here or drag one in from another column.</p>
            </div>
          )}
        </SortableContext>
      </div>
    </section>
  )
}

export default KanbanColumn

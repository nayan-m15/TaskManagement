import { useMemo, useState } from 'react'
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import type {
  BoardColumn,
  BoardDetails,
  BoardTask,
  ReorderTaskPosition,
} from '../../types/kanban'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'

interface KanbanBoardProps {
  board: BoardDetails
  isSavingOrder: boolean
  onAddTask: (columnId: string) => void
  onEditTask: (task: BoardTask) => void
  onReorder: (nextBoard: BoardDetails, positions: ReorderTaskPosition[]) => Promise<void>
}

function findTaskLocation(columns: BoardColumn[], taskId: string) {
  for (const column of columns) {
    const index = column.tasks.findIndex((task) => task.id === taskId)
    if (index >= 0) {
      return {
        columnId: column.id,
        index,
      }
    }
  }

  return null
}

function normalizeBoardPositions(board: BoardDetails) {
  return {
    ...board,
    columns: board.columns.map((column, columnIndex) => ({
      ...column,
      position: columnIndex,
      tasks: column.tasks.map((task, taskIndex) => ({
        ...task,
        columnId: column.id,
        position: taskIndex,
      })),
    })),
  } satisfies BoardDetails
}

function getReorderPayload(board: BoardDetails) {
  return board.columns.flatMap((column) =>
    column.tasks.map((task, index) => ({
      id: task.id,
      columnId: column.id,
      position: index,
    })),
  )
}

function moveTask(board: BoardDetails, activeTaskId: string, overId: string) {
  const sourceLocation = findTaskLocation(board.columns, activeTaskId)
  if (!sourceLocation) {
    return board
  }

  const targetColumnId = overId.startsWith('column-')
    ? overId.replace('column-', '')
    : (findTaskLocation(board.columns, overId)?.columnId ?? sourceLocation.columnId)

  const targetLocation = overId.startsWith('column-')
    ? null
    : findTaskLocation(board.columns, overId)

  const nextColumns = board.columns.map((column) => ({
    ...column,
    tasks: [...column.tasks],
  }))
  const sourceColumn = nextColumns.find((column) => column.id === sourceLocation.columnId)
  const destinationColumn = nextColumns.find((column) => column.id === targetColumnId)

  if (!sourceColumn || !destinationColumn) {
    return board
  }

  const [activeTask] = sourceColumn.tasks.splice(sourceLocation.index, 1)
  if (!activeTask) {
    return board
  }

  const destinationIndex =
    targetLocation && targetLocation.columnId === targetColumnId
      ? sourceLocation.columnId === targetColumnId && sourceLocation.index < targetLocation.index
        ? targetLocation.index - 1
        : targetLocation.index
      : destinationColumn.tasks.length

  destinationColumn.tasks.splice(destinationIndex, 0, {
    ...activeTask,
    columnId: targetColumnId,
  })

  return normalizeBoardPositions({
    ...board,
    columns: nextColumns,
  })
}

function hasBoardOrderChanged(first: BoardDetails, second: BoardDetails) {
  const firstTasks = getReorderPayload(first)
  const secondTasks = getReorderPayload(second)

  if (firstTasks.length !== secondTasks.length) {
    return true
  }

  return firstTasks.some((task, index) => {
    const otherTask = secondTasks[index]
    return (
      task.id !== otherTask.id ||
      task.columnId !== otherTask.columnId ||
      task.position !== otherTask.position
    )
  })
}

function KanbanBoard({
  board,
  isSavingOrder,
  onAddTask,
  onEditTask,
  onReorder,
}: KanbanBoardProps) {
  const [stagedBoard, setStagedBoard] = useState<BoardDetails | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const localBoard = stagedBoard ?? board

  const activeTask = useMemo(
    () =>
      activeTaskId
        ? localBoard.columns.flatMap((column) => column.tasks).find((task) => task.id === activeTaskId) ?? null
        : null,
    [activeTaskId, localBoard.columns],
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    if (!event.over) {
      return
    }

    const activeId = String(event.active.id)
    const overId = String(event.over.id)

    if (activeId === overId) {
      return
    }

    setStagedBoard((currentBoard) => moveTask(currentBoard ?? board, activeId, overId))
  }

  async function handleDragEnd(event: DragEndEvent) {
    const overId = event.over ? String(event.over.id) : null

    setActiveTaskId(null)

    if (!overId) {
      setStagedBoard(null)
      return
    }

    const nextBoard = localBoard

    if (!hasBoardOrderChanged(board, nextBoard)) {
      setStagedBoard(null)
      return
    }

    try {
      await onReorder(nextBoard, getReorderPayload(nextBoard))
    } finally {
      setStagedBoard(null)
    }
  }

  return (
    <section className="kanban-board-shell" aria-label="Kanban board">
      <div className="kanban-board-toolbar">
        <div>
          <p className="dashboard-card-label">Board flow</p>
          <h2>Columns and task cards</h2>
          <p className="auth-copy">
            Drag tasks between columns, create new work in context, and keep ordering synced.
          </p>
        </div>
        <span className="home-status-pill">
          {isSavingOrder ? 'Saving order...' : `${board.columns.length} columns`}
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragCancel={() => {
          setActiveTaskId(null)
          setStagedBoard(null)
        }}
        onDragEnd={(event) => {
          void handleDragEnd(event)
        }}
      >
        <div className="kanban-board-grid">
          {localBoard.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onEdit={onEditTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </section>
  )
}

export default KanbanBoard

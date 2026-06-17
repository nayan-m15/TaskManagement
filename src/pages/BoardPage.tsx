import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft, FolderKanban, ListTodo, Users } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { useKanbanBoard } from '../hooks/useKanbanBoard'
import KanbanBoard from '../components/board/KanbanBoard'
import TaskDrawer from '../components/board/TaskDrawer'
import { ROUTES } from '../routes/routeConstants'
import type { BoardTask, TaskFormValues } from '../types/kanban'

type ModalState =
  | {
      mode: 'create'
      columnId: string
      task?: undefined
    }
  | {
      mode: 'edit'
      columnId: string
      task: BoardTask
    }
  | null

function BoardPage() {
  const { boardId } = useParams()
  const { session } = useAuth()
  const [modalState, setModalState] = useState<ModalState>(null)
  const {
    data,
    isLoading,
    isError,
    error,
    createTask,
    reorderTasks,
    isCreatingTask,
    isReorderingTasks,
    createTaskError,
    refetch,
  } = useKanbanBoard({
    boardId,
    userId: session?.user.id,
  })

  const boardStats = useMemo(() => {
    if (!data) {
      return []
    }

    const totalTasks = data.columns.reduce((count, column) => count + column.tasks.length, 0)

    return [
      {
        label: 'Columns',
        value: data.columns.length,
        icon: FolderKanban,
      },
      {
        label: 'Tasks',
        value: totalTasks,
        icon: ListTodo,
      },
      {
        label: 'Members',
        value: data.members.length,
        icon: Users,
      },
    ]
  }, [data])

  const hashModalState = useMemo<ModalState>(() => {
    if (!data) {
      return null
    }

    const taskIdFromHash = window.location.hash.startsWith('#task-')
      ? window.location.hash.replace('#task-', '')
      : ''

    if (!taskIdFromHash) {
      return null
    }

    const matchedTask = data.columns
      .flatMap((column) => column.tasks)
      .find((task) => task.id === taskIdFromHash)

    if (!matchedTask) {
      return null
    }

    return {
      mode: 'edit',
      task: matchedTask,
      columnId: matchedTask.columnId,
    }
  }, [data])

  const activeDrawerState = modalState ?? hashModalState

  if (!boardId) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  async function handleTaskSubmit(values: TaskFormValues) {
    if (!modalState) {
      return
    }

    if (modalState.mode !== 'create') {
      return
    }

    await createTask({ values })
    setModalState(null)
  }

  function handleCloseDrawer() {
    if (window.location.hash.startsWith('#task-')) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }

    setModalState(null)
  }

  return (
    <DashboardLayout>
      <main className="dashboard-shell dashboard-shell-board">
        <div className="dashboard-main">
          <header className="dashboard-header dashboard-header-board">
            <div>
              <Link className="dashboard-inline-link" to={ROUTES.dashboard}>
                <ChevronLeft size={16} aria-hidden="true" />
                Back to dashboard
              </Link>
              <p className="auth-eyebrow">Board workspace</p>
              <h1>{data?.title ?? 'Board details'}</h1>
              <p className="auth-copy">
                {data?.workspaceName
                  ? `Manage tasks for ${data.workspaceName} with multi-column planning, realtime updates, and drag-and-drop ordering.`
                  : 'Manage tasks with multi-column planning, realtime updates, and drag-and-drop ordering.'}
              </p>
            </div>
            <div className="dashboard-header-actions">
              <button
                type="button"
                className="auth-submit"
                onClick={() =>
                  setModalState({
                    mode: 'create',
                    columnId: data?.columns[0]?.id ?? '',
                  })
                }
                disabled={!data?.columns.length}
              >
                New task
              </button>
              <button
                type="button"
                className="auth-submit auth-submit-secondary"
                onClick={() => void refetch()}
              >
                Refresh board
              </button>
            </div>
          </header>

          {isLoading ? (
            <section className="dashboard-feedback-card" aria-live="polite">
              <p className="dashboard-card-label">Loading</p>
              <h2>Loading your board</h2>
              <p>We are preparing columns, tasks, members, and board context.</p>
            </section>
          ) : null}

          {!isLoading && isError ? (
            <section className="dashboard-feedback-card" role="alert">
              <p className="dashboard-card-label">Unavailable</p>
              <h2>Board could not be loaded</h2>
              <p>{error instanceof Error ? error.message : 'Try again in a moment.'}</p>
            </section>
          ) : null}

          {!isLoading && !isError && !data ? (
            <section className="dashboard-feedback-card">
              <p className="dashboard-card-label">Not found</p>
              <h2>Board not found</h2>
              <p>No board matched this link, or your session no longer has access to it.</p>
            </section>
          ) : null}

          {!isLoading && !isError && data ? (
            <>
              <section className="dashboard-stats-grid dashboard-stats-grid-compact" aria-label="Board summary">
                {boardStats.map((stat) => {
                  const Icon = stat.icon

                  return (
                    <article key={stat.label} className="dashboard-stat-card">
                      <div className="dashboard-stat-icon">
                        <Icon size={18} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="dashboard-card-label">{stat.label}</p>
                        <strong>{stat.value}</strong>
                      </div>
                    </article>
                  )
                })}
              </section>

              <KanbanBoard
                board={data}
                isSavingOrder={isReorderingTasks}
                onAddTask={(columnId) =>
                  setModalState({
                    mode: 'create',
                    columnId,
                  })
                }
                onEditTask={(task) =>
                  setModalState({
                    mode: 'edit',
                    task,
                    columnId: task.columnId,
                  })
                }
                onReorder={async (nextBoard, positions) => {
                  await reorderTasks({
                    nextBoard,
                    positions,
                  })
                }}
              />
            </>
          ) : null}
        </div>
      </main>

      {data && activeDrawerState ? (
        <TaskDrawer
          mode={activeDrawerState.mode}
          board={data}
          task={activeDrawerState.mode === 'edit' ? activeDrawerState.task : null}
          selectedColumnId={activeDrawerState.columnId}
          currentUserId={session?.user.id}
          isCreatingTask={isCreatingTask}
          createTaskError={createTaskError instanceof Error ? createTaskError.message : null}
          onClose={handleCloseDrawer}
          onCreateTask={handleTaskSubmit}
        />
      ) : null}
    </DashboardLayout>
  )
}

export default BoardPage

import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import DashboardSection from '../../components/dashboard/DashboardSection'
import {
  BoardList,
  DashboardPageIntro,
} from '../../components/dashboard/DashboardViews'
import { useDashboardOutlet } from './dashboardContext'

function BoardsPage() {
  const { data, isError, isLoading, openCreateBoard, openCreateWorkspace } = useDashboardOutlet()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedWorkspaceId = searchParams.get('workspace') ?? ''

  const taskCountsByBoardId = useMemo(() => {
    const counts = new Map<string, number>()

    for (const task of data?.tasks ?? []) {
      if (!task.boardId) {
        continue
      }

      counts.set(task.boardId, (counts.get(task.boardId) ?? 0) + 1)
    }

    return counts
  }, [data?.tasks])

  const boards = selectedWorkspaceId
    ? (data?.boards ?? []).filter((board) => board.workspaceId === selectedWorkspaceId)
    : (data?.boards ?? [])

  return (
    <>
      <DashboardPageIntro
        eyebrow="Boards"
        title="Boards you can access"
        description="Review active boards across your workspaces, filter by workspace, and jump directly into the kanban view."
        actions={
          <>
            <label className="dashboard-select-field">
              <span className="dashboard-card-label">Workspace filter</span>
              <select
                className="kanban-input"
                value={selectedWorkspaceId}
                onChange={(event) => {
                  const nextWorkspaceId = event.target.value
                  if (!nextWorkspaceId) {
                    setSearchParams({})
                    return
                  }

                  setSearchParams({ workspace: nextWorkspaceId })
                }}
              >
                <option value="">All workspaces</option>
                {(data?.workspaces ?? []).map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="auth-submit auth-submit-secondary"
              onClick={() =>
                data?.workspaces.length
                  ? openCreateBoard(selectedWorkspaceId || data.workspaces[0]?.id)
                  : openCreateWorkspace()
              }
            >
              Create Board
            </button>
          </>
        }
      />

      {isLoading ? (
        <section className="dashboard-feedback-card" aria-live="polite">
          <p className="dashboard-card-label">Loading</p>
          <h2>Loading boards</h2>
          <p>We are gathering the boards currently visible to your session.</p>
        </section>
      ) : null}

      {!isLoading && isError ? (
        <section className="dashboard-feedback-card" role="alert">
          <p className="dashboard-card-label">Unavailable</p>
          <h2>Boards could not be loaded</h2>
          <p>Try refreshing the dashboard. If the problem continues, check board and workspace access rules.</p>
        </section>
      ) : null}

      {!isLoading && !isError && data ? (
        <DashboardSection
          eyebrow="Board directory"
          title={selectedWorkspaceId ? 'Workspace boards' : 'All boards'}
          description="Each board keeps its existing realtime kanban workflow. Opening one takes you to the full board page."
          action={<span className="home-status-pill">{boards.length} boards</span>}
        >
          <BoardList
            boards={boards}
            taskCountsByBoardId={taskCountsByBoardId}
            onCreateBoard={() =>
              data?.workspaces.length
                ? openCreateBoard(selectedWorkspaceId || data.workspaces[0]?.id)
                : openCreateWorkspace()
            }
          />
        </DashboardSection>
      ) : null}
    </>
  )
}

export default BoardsPage

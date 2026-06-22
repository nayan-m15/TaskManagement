import DashboardSection from '../../components/dashboard/DashboardSection'
import {
  DashboardPageIntro,
  WorkspaceList,
} from '../../components/dashboard/DashboardViews'
import { useDashboardOutlet } from './dashboardContext'

function WorkspacesPage() {
  const { data, displayName, isError, isLoading, openCreateWorkspace, openCreateBoard } =
    useDashboardOutlet()

  const workspaceTaskCounts = new Map<string, number>()
  const workspaceBoardCounts = new Map<string, number>()

  for (const board of data?.boards ?? []) {
    if (!board.workspaceId) {
      continue
    }

    workspaceBoardCounts.set(
      board.workspaceId,
      (workspaceBoardCounts.get(board.workspaceId) ?? 0) + 1,
    )
  }

  for (const task of data?.tasks ?? []) {
    if (!task.workspaceId) {
      continue
    }

    workspaceTaskCounts.set(
      task.workspaceId,
      (workspaceTaskCounts.get(task.workspaceId) ?? 0) + 1,
    )
  }

  return (
    <>
      <DashboardPageIntro
        eyebrow="Workspaces"
        title="Workspace access"
        description={`${displayName}, these are the workspaces your current session can safely access, along with role and workload context where available.`}
      />

      {isLoading ? (
        <section className="dashboard-feedback-card" aria-live="polite">
          <p className="dashboard-card-label">Loading</p>
          <h2>Loading workspaces</h2>
          <p>We are checking your memberships and accessible workspace context.</p>
        </section>
      ) : null}

      {!isLoading && isError ? (
        <section className="dashboard-feedback-card" role="alert">
          <p className="dashboard-card-label">Unavailable</p>
          <h2>Workspaces could not be loaded</h2>
          <p>Try refreshing the dashboard. If the problem continues, check workspace membership policies.</p>
        </section>
      ) : null}

      {!isLoading && !isError && data ? (
        <DashboardSection
          eyebrow="Membership"
          title="Your workspaces"
          description="Workspace summaries include the number of visible boards and tasks so you can jump into the right context quickly."
          action={
            <>
              <span className="home-status-pill">{data.workspaces.length} total</span>
              <button type="button" className="auth-submit auth-submit-secondary" onClick={openCreateWorkspace}>
                Create Workspace
              </button>
            </>
          }
        >
          <WorkspaceList
            workspaces={data.workspaces}
            workspaceTaskCounts={workspaceTaskCounts}
            workspaceBoardCounts={workspaceBoardCounts}
            onCreateWorkspace={openCreateWorkspace}
            onCreateBoard={openCreateBoard}
          />
        </DashboardSection>
      ) : null}
    </>
  )
}

export default WorkspacesPage

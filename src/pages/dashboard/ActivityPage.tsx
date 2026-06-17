import DashboardSection from '../../components/dashboard/DashboardSection'
import {
  ActivityFeedList,
  DashboardPageIntro,
} from '../../components/dashboard/DashboardViews'
import { useDashboardOutlet } from './dashboardContext'

function ActivityPage() {
  const { data, isError, isLoading } = useDashboardOutlet()

  return (
    <>
      <DashboardPageIntro
        eyebrow="Activity"
        title="Recent activity"
        description="Review recent workspace, board, task, and comment activity. When dedicated activity logs are unavailable, this view derives a safe feed from existing data."
      />

      {isLoading ? (
        <section className="dashboard-feedback-card" aria-live="polite">
          <p className="dashboard-card-label">Loading</p>
          <h2>Loading activity feed</h2>
          <p>We are collecting recent board, task, and workspace changes now.</p>
        </section>
      ) : null}

      {!isLoading && isError ? (
        <section className="dashboard-feedback-card" role="alert">
          <p className="dashboard-card-label">Unavailable</p>
          <h2>Activity could not be loaded</h2>
          <p>Try refreshing the dashboard. If the problem continues, inspect activity log access and fallback queries.</p>
        </section>
      ) : null}

      {!isLoading && !isError && data ? (
        <DashboardSection
          eyebrow="Timeline"
          title="Recent changes"
          description="This feed is sorted from most recent to oldest using either activity logs or derived workspace and task signals."
          action={<span className="home-status-pill">{data.activityFeed.length} items</span>}
        >
          <ActivityFeedList activityFeed={data.activityFeed} />
        </DashboardSection>
      ) : null}
    </>
  )
}

export default ActivityPage

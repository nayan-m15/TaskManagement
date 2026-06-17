import DashboardSection from '../../components/dashboard/DashboardSection'
import {
  DashboardPageIntro,
  NotificationList,
} from '../../components/dashboard/DashboardViews'
import { useDashboardOutlet } from './dashboardContext'

function NotificationsPage() {
  const { data, isError, isLoading } = useDashboardOutlet()

  return (
    <>
      <DashboardPageIntro
        eyebrow="Notifications"
        title="Recent notifications"
        description="This view uses the notification system when available and safely falls back to recent assignments, due work, and board updates."
      />

      {isLoading ? (
        <section className="dashboard-feedback-card" aria-live="polite">
          <p className="dashboard-card-label">Loading</p>
          <h2>Loading notifications</h2>
          <p>We are checking recent notifications and fallback signals now.</p>
        </section>
      ) : null}

      {!isLoading && isError ? (
        <section className="dashboard-feedback-card" role="alert">
          <p className="dashboard-card-label">Unavailable</p>
          <h2>Notifications could not be loaded</h2>
          <p>Try refreshing the dashboard. If the problem continues, inspect notification access and fallback data queries.</p>
        </section>
      ) : null}

      {!isLoading && !isError && data ? (
        <DashboardSection
          eyebrow="Inbox"
          title="Team and task signals"
          description="Assignments, reminders, comments, and board updates appear here with safe fallbacks."
          action={<span className="home-status-pill">{data.notifications.length} items</span>}
        >
          <NotificationList notifications={data.notifications} />
        </DashboardSection>
      ) : null}
    </>
  )
}

export default NotificationsPage

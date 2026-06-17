import { compareAsc, differenceInCalendarDays, parseISO } from 'date-fns'
import DashboardSection from '../../components/dashboard/DashboardSection'
import {
  DashboardPageIntro,
  TaskList,
} from '../../components/dashboard/DashboardViews'
import { useDashboardOutlet } from './dashboardContext'

function CalendarPage() {
  const { data, isError, isLoading } = useDashboardOutlet()
  const tasksWithDueDates = (data?.tasks ?? [])
    .filter((task) => task.dueDate)
    .sort((first, second) => compareAsc(parseISO(first.dueDate ?? ''), parseISO(second.dueDate ?? '')))
  const overdueTasks = tasksWithDueDates.filter(
    (task) => differenceInCalendarDays(parseISO(task.dueDate ?? ''), new Date()) < 0,
  )
  const dueTodayTasks = tasksWithDueDates.filter(
    (task) => differenceInCalendarDays(parseISO(task.dueDate ?? ''), new Date()) === 0,
  )
  const upcomingTasks = tasksWithDueDates.filter((task) => {
    const daysUntilDue = differenceInCalendarDays(parseISO(task.dueDate ?? ''), new Date())
    return daysUntilDue > 0 && daysUntilDue <= 7
  })

  return (
    <>
      <DashboardPageIntro
        eyebrow="Due soon"
        title="Deadlines and upcoming work"
        description="Review overdue tasks, work due today, and the next week of upcoming deadlines across your accessible boards."
      />

      {isLoading ? (
        <section className="dashboard-feedback-card" aria-live="polite">
          <p className="dashboard-card-label">Loading</p>
          <h2>Loading deadlines</h2>
          <p>We are sorting overdue tasks and upcoming due dates now.</p>
        </section>
      ) : null}

      {!isLoading && isError ? (
        <section className="dashboard-feedback-card" role="alert">
          <p className="dashboard-card-label">Unavailable</p>
          <h2>Deadline data could not be loaded</h2>
          <p>Try refreshing the dashboard. If the problem continues, inspect due date access on tasks.</p>
        </section>
      ) : null}

      {!isLoading && !isError && data ? (
        <section className="dashboard-sections-grid">
          <DashboardSection
            eyebrow="Overdue"
            title="Past due tasks"
            description="These tasks have due dates earlier than the current time."
          >
            <TaskList
              tasks={overdueTasks}
              emptyMessage="No overdue tasks are visible right now."
            />
          </DashboardSection>

          <DashboardSection
            eyebrow="Today"
            title="Due today"
            description="Tasks due today are grouped here for quick review."
          >
            <TaskList
              tasks={dueTodayTasks}
              emptyMessage="Nothing is due today at the moment."
            />
          </DashboardSection>

          <DashboardSection
            eyebrow="Next seven days"
            title="Upcoming deadlines"
            description="This section helps you see what is approaching soon before it becomes urgent."
          >
            <TaskList
              tasks={upcomingTasks}
              emptyMessage="No upcoming due dates are visible in the next seven days."
            />
          </DashboardSection>
        </section>
      ) : null}
    </>
  )
}

export default CalendarPage

import { Activity } from 'lucide-react'
import type { TaskActivityEntry } from '../../types/kanban'
import { formatTaskDateTime } from '../../utils/taskPresentation'

interface ActivityHistoryProps {
  activity: TaskActivityEntry[]
}

function ActivityHistory({ activity }: ActivityHistoryProps) {
  return (
    <section className="task-drawer-section">
      <div className="task-section-header">
        <div>
          <p className="dashboard-card-label">Activity</p>
          <h3>History</h3>
        </div>
        <span className="home-status-pill">{activity.length}</span>
      </div>

      {activity.length ? (
        <ol className="task-activity-list" aria-label="Task activity history">
          {activity.map((entry) => (
            <li key={entry.id} className="task-activity-item">
              <div className="task-activity-icon" aria-hidden="true">
                <Activity size={16} />
              </div>
              <div className="task-activity-content">
                <strong>{entry.action}</strong>
                <div className="dashboard-meta-row">
                  <span>{entry.actor?.username || entry.actor?.email || 'System'}</span>
                  <span>{formatTaskDateTime(entry.createdAt)}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="dashboard-empty-state">
          <h3>No recorded activity yet</h3>
          <p>Important task changes will appear here once activity logging is available.</p>
        </div>
      )}
    </section>
  )
}

export default ActivityHistory

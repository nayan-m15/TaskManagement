import { differenceInCalendarDays, parseISO } from 'date-fns'

export function getDueState(dueDate?: string) {
  if (!dueDate) {
    return null
  }

  const daysUntilDue = differenceInCalendarDays(parseISO(dueDate), new Date())

  if (daysUntilDue < 0) {
    return {
      label: 'Overdue',
      className: 'dashboard-badge-danger',
    }
  }

  if (daysUntilDue === 0) {
    return {
      label: 'Due today',
      className: 'dashboard-badge-warning',
    }
  }

  return {
    label: `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
    className: 'dashboard-badge-success',
  }
}

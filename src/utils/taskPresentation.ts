import { differenceInCalendarDays, format, isToday, isValid, parseISO } from 'date-fns'
import type { TaskDueState, TaskPriority } from '../types/kanban'

const priorityLabelMap: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

const priorityToneMap: Record<TaskPriority, string> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

function parseTaskDate(value?: string | null) {
  if (!value) {
    return null
  }

  const date = parseISO(value)
  return isValid(date) ? date : null
}

export function getTaskPriorityLabel(priority?: TaskPriority | null) {
  if (!priority) {
    return 'No priority'
  }

  return priorityLabelMap[priority]
}

export function getTaskPriorityTone(priority?: TaskPriority | null) {
  if (!priority) {
    return 'neutral'
  }

  return priorityToneMap[priority]
}

export function getTaskDueState(dueDate?: string | null): TaskDueState {
  const date = parseTaskDate(dueDate)

  if (!date) {
    return 'none'
  }

  if (isToday(date)) {
    return 'due-today'
  }

  const daysUntilDue = differenceInCalendarDays(date, new Date())
  return daysUntilDue < 0 ? 'overdue' : 'upcoming'
}

export function getTaskDueLabel(dueDate?: string | null) {
  const date = parseTaskDate(dueDate)

  if (!date) {
    return 'No due date'
  }

  const state = getTaskDueState(dueDate)

  if (state === 'overdue') {
    return `Overdue since ${format(date, 'MMM d, yyyy')}`
  }

  if (state === 'due-today') {
    return `Due today at ${format(date, 'p')}`
  }

  return `Due ${format(date, 'MMM d, yyyy')}`
}

export function formatTaskDateTime(value?: string | null, fallback = 'Not available') {
  const date = parseTaskDate(value)
  return date ? format(date, 'MMM d, yyyy p') : fallback
}

export function formatTaskDateShort(value?: string | null, fallback = 'No due date') {
  const date = parseTaskDate(value)
  return date ? format(date, 'MMM d') : fallback
}

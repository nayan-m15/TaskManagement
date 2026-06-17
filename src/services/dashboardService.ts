import type { SupabaseClient } from '@supabase/supabase-js'
import { compareAsc, compareDesc, differenceInCalendarDays, parseISO } from 'date-fns'
import { getSupabaseClient } from '../lib/supabase'
import type {
  DashboardActivityItem,
  DashboardBoard,
  DashboardBoardDetail,
  DashboardData,
  DashboardNotification,
  DashboardTask,
  DashboardWorkspace,
} from '../types/dashboard'

type UnknownRecord = Record<string, unknown>

const MAX_WORKSPACES = 8
const MAX_RECENT_BOARDS = 6
const MAX_DUE_SOON_TASKS = 8
const MAX_ASSIGNED_TASKS = 8
const MAX_NOTIFICATIONS = 6
const MAX_ACTIVITY = 8

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

function getString(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return undefined
}

function getNestedRecord(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) {
      const firstItem = value.find((item) => isRecord(item))
      if (firstItem) {
        return firstItem
      }
    }

    if (isRecord(value)) {
      return value
    }
  }

  return null
}

function getDateValue(record: UnknownRecord, keys: string[]) {
  const value = getString(record, keys)
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : value
}

function getNormalizedId(record: UnknownRecord) {
  return getString(record, ['id', 'uuid'])
}

function normalizeWorkspace(record: UnknownRecord): DashboardWorkspace | null {
  const relatedWorkspace =
    getNestedRecord(record, ['workspace', 'workspaces']) ?? record
  const id = getNormalizedId(relatedWorkspace) ?? getNormalizedId(record)
  const name = getString(relatedWorkspace, ['name', 'title'])

  if (!id || !name) {
    return null
  }

  return {
    id,
    name,
    role: getString(record, ['role', 'member_role']),
    createdAt: getDateValue(relatedWorkspace, ['created_at', 'createdAt']),
    updatedAt: getDateValue(relatedWorkspace, ['updated_at', 'updatedAt']),
  } satisfies DashboardWorkspace
}

function normalizeBoard(
  record: UnknownRecord,
  workspacesById: Map<string, DashboardWorkspace>,
): DashboardBoard | null {
  const id = getNormalizedId(record)
  const name = getString(record, ['name', 'title'])

  if (!id || !name) {
    return null
  }

  const workspaceId = getString(record, ['workspace_id', 'workspaceId'])
  const relatedWorkspace = getNestedRecord(record, ['workspace', 'workspaces'])
  const workspaceName =
    getString(relatedWorkspace ?? {}, ['name', 'title']) ??
    (workspaceId ? workspacesById.get(workspaceId)?.name : undefined)

  return {
    id,
    name,
    workspaceId,
    workspaceName,
    createdAt: getDateValue(record, ['created_at', 'createdAt']),
    updatedAt: getDateValue(record, ['updated_at', 'updatedAt']),
  } satisfies DashboardBoard
}

function normalizeTask(
  record: UnknownRecord,
  boardsById: Map<string, DashboardBoard>,
): DashboardTask | null {
  const id = getNormalizedId(record)
  const title = getString(record, ['title', 'name'])

  if (!id || !title) {
    return null
  }

  const boardId = getString(record, ['board_id', 'boardId'])
  const relatedBoard = getNestedRecord(record, ['board', 'boards'])
  const relatedColumn = getNestedRecord(record, ['column', 'columns'])
  const relatedBoardName =
    getString(relatedBoard ?? {}, ['name', 'title']) ??
    (boardId ? boardsById.get(boardId)?.name : undefined)

  return {
    id,
    title,
    description: getString(record, ['description', 'details']),
    boardId,
    boardName: relatedBoardName,
    workspaceId:
      getString(record, ['workspace_id', 'workspaceId']) ??
      (boardId ? boardsById.get(boardId)?.workspaceId : undefined),
    columnId: getString(record, ['column_id', 'columnId']),
    columnName: getString(relatedColumn ?? {}, ['name', 'title']),
    status: getString(record, ['status', 'state']),
    priority: getString(record, ['priority', 'importance']),
    dueDate: getDateValue(record, ['due_date', 'dueDate', 'deadline', 'due_at']),
    assigneeId: getString(record, ['assignee_id', 'assigneeId', 'assigned_to', 'user_id']),
    createdById: getString(record, ['created_by', 'createdBy']),
    createdAt: getDateValue(record, ['created_at', 'createdAt']),
    updatedAt: getDateValue(record, ['updated_at', 'updatedAt']),
  } satisfies DashboardTask
}

function normalizeNotification(record: UnknownRecord): DashboardNotification | null {
  const id = getNormalizedId(record)
  const title = getString(record, ['title', 'subject', 'name'])
  const description = getString(record, ['description', 'message', 'body'])

  if (!id || !title || !description) {
    return null
  }

  const categoryValue = getString(record, ['type', 'category', 'event_type'])
  const category = mapNotificationCategory(categoryValue)

  return {
    id,
    title,
    description,
    category,
    createdAt: getDateValue(record, ['created_at', 'createdAt']),
    href: buildHrefFromRecord(record),
  } satisfies DashboardNotification
}

function normalizeActivity(record: UnknownRecord): DashboardActivityItem | null {
  const id = getNormalizedId(record)
  const title =
    getString(record, ['title', 'summary', 'name']) ??
    getString(record, ['action', 'event_type'])
  const description = getString(record, ['description', 'message', 'details'])

  if (!id || !title || !description) {
    return null
  }

  return {
    id,
    title,
    description,
    category: mapActivityCategory(getString(record, ['type', 'category', 'entity_type'])),
    createdAt: getDateValue(record, ['created_at', 'createdAt']),
    href: buildHrefFromRecord(record),
  } satisfies DashboardActivityItem
}

function buildHrefFromRecord(record: UnknownRecord) {
  const boardId = getString(record, ['board_id', 'boardId'])
  return boardId ? `/dashboard/boards/${boardId}` : undefined
}

function mapNotificationCategory(value?: string): DashboardNotification['category'] {
  const normalizedValue = value?.toLowerCase() ?? ''

  if (normalizedValue.includes('assign')) {
    return 'assignment'
  }

  if (normalizedValue.includes('comment')) {
    return 'comment'
  }

  if (normalizedValue.includes('invite')) {
    return 'invite'
  }

  if (normalizedValue.includes('status') || normalizedValue.includes('move')) {
    return 'status'
  }

  if (normalizedValue.includes('board')) {
    return 'board'
  }

  return 'reminder'
}

function mapActivityCategory(value?: string): DashboardActivityItem['category'] {
  const normalizedValue = value?.toLowerCase() ?? ''

  if (normalizedValue.includes('comment')) {
    return 'comment'
  }

  if (normalizedValue.includes('board')) {
    return 'board'
  }

  if (normalizedValue.includes('workspace')) {
    return 'workspace'
  }

  return 'task'
}

function compareRecent(first?: string, second?: string) {
  if (!first && !second) {
    return 0
  }

  if (!first) {
    return 1
  }

  if (!second) {
    return -1
  }

  return compareDesc(parseISO(first), parseISO(second))
}

function compareDueSoon(first: DashboardTask, second: DashboardTask) {
  const firstDue = first.dueDate ? parseISO(first.dueDate) : null
  const secondDue = second.dueDate ? parseISO(second.dueDate) : null

  if (!firstDue && !secondDue) {
    return 0
  }

  if (!firstDue) {
    return 1
  }

  if (!secondDue) {
    return -1
  }

  return compareAsc(firstDue, secondDue)
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return items.filter((item, index) => items.findIndex((entry) => entry.id === item.id) === index)
}

function isCandidateError(error: unknown) {
  if (!isRecord(error)) {
    return false
  }

  const code = getString(error, ['code'])
  const message = getString(error, ['message']) ?? ''

  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST200' ||
    code === 'PGRST201' ||
    code === 'PGRST204' ||
    message.includes('relationship') ||
    message.includes('column') ||
    message.includes('schema cache')
  )
}

async function resolveCandidate<T>(candidates: Array<() => Promise<T>>) {
  for (const candidate of candidates) {
    try {
      return await candidate()
    } catch (error) {
      if (isCandidateError(error)) {
        continue
      }

      throw error
    }
  }

  return null
}

function sortAndLimitBoards(boards: DashboardBoard[]) {
  return uniqueById(boards)
    .sort((first, second) => compareRecent(first.updatedAt ?? first.createdAt, second.updatedAt ?? second.createdAt))
    .slice(0, MAX_RECENT_BOARDS)
}

function sortAndLimitAssignedTasks(tasks: DashboardTask[], userId: string) {
  return uniqueById(tasks)
    .filter((task) => task.assigneeId === userId)
    .sort((first, second) => compareDueSoon(first, second))
    .slice(0, MAX_ASSIGNED_TASKS)
}

function sortAndLimitDueSoonTasks(tasks: DashboardTask[]) {
  return uniqueById(tasks)
    .filter((task) => {
      if (!task.dueDate) {
        return false
      }

      const daysUntilDue = differenceInCalendarDays(parseISO(task.dueDate), new Date())
      return daysUntilDue <= 7
    })
    .sort((first, second) => compareDueSoon(first, second))
    .slice(0, MAX_DUE_SOON_TASKS)
}

function deriveNotifications(
  dueSoonTasks: DashboardTask[],
  assignedTasks: DashboardTask[],
  recentBoards: DashboardBoard[],
) {
  const upcomingNotifications: DashboardNotification[] = dueSoonTasks.slice(0, 3).map((task) => ({
    id: `due-${task.id}`,
    title: task.title,
    description: task.dueDate
      ? `Due ${formatRelativeDueDate(task.dueDate)}${task.boardName ? ` in ${task.boardName}` : ''}.`
      : 'A due date is approaching.',
    category: 'reminder',
    createdAt: task.dueDate,
    href: task.boardId ? `/dashboard/boards/${task.boardId}` : undefined,
  }))

  const assignmentNotifications: DashboardNotification[] = assignedTasks
    .slice(0, 2)
    .map((task) => ({
      id: `assignment-${task.id}`,
      title: task.title,
      description: task.boardName
        ? `Assigned to you in ${task.boardName}.`
        : 'Assigned to you recently.',
      category: 'assignment',
      createdAt: task.updatedAt ?? task.createdAt,
      href: task.boardId ? `/dashboard/boards/${task.boardId}` : undefined,
    }))

  const boardNotifications: DashboardNotification[] = recentBoards.slice(0, 1).map((board) => ({
    id: `board-${board.id}`,
    title: board.name,
    description: board.workspaceName
      ? `Recently updated in ${board.workspaceName}.`
      : 'Recently updated board.',
    category: 'board',
    createdAt: board.updatedAt ?? board.createdAt,
    href: `/dashboard/boards/${board.id}`,
  }))

  return uniqueById([...upcomingNotifications, ...assignmentNotifications, ...boardNotifications])
    .sort((first, second) => compareRecent(first.createdAt, second.createdAt))
    .slice(0, MAX_NOTIFICATIONS)
}

function deriveActivityFeed(
  workspaces: DashboardWorkspace[],
  boards: DashboardBoard[],
  tasks: DashboardTask[],
) {
  const workspaceActivity: DashboardActivityItem[] = workspaces.slice(0, 2).map((workspace) => ({
    id: `workspace-${workspace.id}`,
    title: workspace.name,
    description: workspace.role
      ? `You are active in this workspace as ${workspace.role}.`
      : 'Workspace membership is active.',
    category: 'workspace',
    createdAt: workspace.updatedAt ?? workspace.createdAt,
  }))

  const boardActivity: DashboardActivityItem[] = boards.slice(0, 3).map((board) => ({
    id: `board-activity-${board.id}`,
    title: board.name,
    description: board.workspaceName
      ? `Board updated in ${board.workspaceName}.`
      : 'Board updated recently.',
    category: 'board',
    createdAt: board.updatedAt ?? board.createdAt,
    href: `/dashboard/boards/${board.id}`,
  }))

  const taskActivity: DashboardActivityItem[] = tasks.slice(0, 3).map((task) => ({
    id: `task-activity-${task.id}`,
    title: task.title,
    description: task.boardName
      ? `Task activity recorded in ${task.boardName}.`
      : 'Task activity recorded recently.',
    category: 'task',
    createdAt: task.updatedAt ?? task.createdAt ?? task.dueDate,
    href: task.boardId ? `/dashboard/boards/${task.boardId}` : undefined,
  }))

  return uniqueById([...workspaceActivity, ...boardActivity, ...taskActivity])
    .sort((first, second) => compareRecent(first.createdAt, second.createdAt))
    .slice(0, MAX_ACTIVITY)
}

function formatRelativeDueDate(value: string) {
  const daysUntilDue = differenceInCalendarDays(parseISO(value), new Date())

  if (daysUntilDue < 0) {
    return `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} ago`
  }

  if (daysUntilDue === 0) {
    return 'today'
  }

  if (daysUntilDue === 1) {
    return 'tomorrow'
  }

  return `in ${daysUntilDue} days`
}

async function fetchRows(
  client: SupabaseClient,
  table: string,
  selectClause = '*',
  limit?: number,
) {
  let query = client.from(table).select(selectClause)

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as UnknownRecord[]
}

async function fetchWorkspaces(client: SupabaseClient, userId: string) {
  const rows =
    (await resolveCandidate<UnknownRecord[]>([
      async () => {
        const { data, error } = await client
          .from('workspace_members')
          .select('id, role, created_at, updated_at, workspace:workspaces(id, name, created_at, updated_at)')
          .eq('user_id', userId)
          .limit(MAX_WORKSPACES)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as UnknownRecord[]
      },
      async () => {
        const { data, error } = await client
          .from('workspace_memberships')
          .select('id, role, created_at, updated_at, workspace:workspaces(id, name, created_at, updated_at)')
          .eq('user_id', userId)
          .limit(MAX_WORKSPACES)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as UnknownRecord[]
      },
      async () => {
        const { data, error } = await client
          .from('workspace_users')
          .select('id, role, created_at, updated_at, workspace:workspaces(id, name, created_at, updated_at)')
          .eq('user_id', userId)
          .limit(MAX_WORKSPACES)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as UnknownRecord[]
      },
      async () => {
        const { data, error } = await client
          .from('workspaces')
          .select('id, name, created_at, updated_at')
          .eq('owner_id', userId)
          .limit(MAX_WORKSPACES)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as UnknownRecord[]
      },
      async () => fetchRows(client, 'workspaces', 'id, name, created_at, updated_at', MAX_WORKSPACES),
    ])) ?? []

  return uniqueById(rows.map(normalizeWorkspace).filter(isDefined))
}

async function fetchBoards(
  client: SupabaseClient,
  workspacesById: Map<string, DashboardWorkspace>,
) {
  const rows =
    (await resolveCandidate<UnknownRecord[]>([
      async () =>
        fetchRows(
          client,
          'boards',
          'id, name, title, workspace_id, created_at, updated_at, workspace:workspaces(id, name)',
          24,
        ),
      async () =>
        fetchRows(client, 'boards', 'id, name, title, workspace_id, created_at, updated_at', 24),
      async () => fetchRows(client, 'project_boards', 'id, name, title, workspace_id, created_at, updated_at', 24),
    ])) ?? []

  return uniqueById(rows.map((row) => normalizeBoard(row, workspacesById)).filter(isDefined))
}

async function fetchTasks(client: SupabaseClient, boardsById: Map<string, DashboardBoard>) {
  const rows =
    (await resolveCandidate<UnknownRecord[]>([
      async () =>
        fetchRows(
          client,
          'tasks',
          'id, title, name, description, board_id, column_id, assignee_id, user_id, assigned_to, created_by, status, state, priority, due_date, deadline, created_at, updated_at, board:boards(id, name, title), column:columns(id, name, title)',
          80,
        ),
      async () =>
        fetchRows(
          client,
          'tasks',
          'id, title, name, description, board_id, column_id, assignee_id, user_id, assigned_to, created_by, status, state, priority, due_date, deadline, created_at, updated_at',
          80,
        ),
      async () => fetchRows(client, 'board_tasks', '*', 80),
    ])) ?? []

  return uniqueById(rows.map((row) => normalizeTask(row, boardsById)).filter(isDefined))
}

async function fetchNotifications(client: SupabaseClient, userId: string) {
  const rows =
    (await resolveCandidate<UnknownRecord[]>([
      async () => {
        const { data, error } = await client
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(MAX_NOTIFICATIONS)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as UnknownRecord[]
      },
      async () => {
        const { data, error } = await client
          .from('user_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(MAX_NOTIFICATIONS)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as UnknownRecord[]
      },
    ])) ?? []

  return uniqueById(
    rows
      .map(normalizeNotification)
      .filter(isDefined),
  )
}

async function fetchActivity(client: SupabaseClient) {
  const rows =
    (await resolveCandidate<UnknownRecord[]>([
      async () => {
        const { data, error } = await client
          .from('activity')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(MAX_ACTIVITY)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as UnknownRecord[]
      },
      async () => {
        const { data, error } = await client
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(MAX_ACTIVITY)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as UnknownRecord[]
      },
      async () => {
        const { data, error } = await client
          .from('board_activity')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(MAX_ACTIVITY)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as UnknownRecord[]
      },
    ])) ?? []

  return uniqueById(
    rows.map(normalizeActivity).filter(isDefined),
  )
}

function createSummary(
  workspaces: DashboardWorkspace[],
  recentBoards: DashboardBoard[],
  dueSoonTasks: DashboardTask[],
  assignedTasks: DashboardTask[],
) {
  return {
    workspaceCount: workspaces.length,
    recentBoardCount: recentBoards.length,
    dueSoonCount: dueSoonTasks.length,
    assignedTaskCount: assignedTasks.length,
  }
}

function getQueryErrorMessage(error: unknown, fallbackMessage: string) {
  if (isRecord(error)) {
    const message = getString(error, ['message'])
    if (message) {
      return message
    }
  }

  return fallbackMessage
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const client = getSupabaseClient()
  const warnings: string[] = []

  const workspaces: DashboardWorkspace[] = await fetchWorkspaces(client, userId).catch((error) => {
    warnings.push(getQueryErrorMessage(error, 'Workspaces could not be loaded.'))
    return []
  })
  const workspacesById = new Map(workspaces.map((workspace) => [workspace.id, workspace]))

  const boards: DashboardBoard[] = await fetchBoards(client, workspacesById).catch((error) => {
    warnings.push(getQueryErrorMessage(error, 'Boards could not be loaded.'))
    return []
  })
  const boardsById = new Map(boards.map((board) => [board.id, board]))

  const tasks: DashboardTask[] = await fetchTasks(client, boardsById).catch((error) => {
    warnings.push(getQueryErrorMessage(error, 'Tasks could not be loaded.'))
    return []
  })

  const recentBoards = sortAndLimitBoards(boards)
  const dueSoonTasks = sortAndLimitDueSoonTasks(tasks)
  const assignedTasks = sortAndLimitAssignedTasks(tasks, userId)

  const notifications: DashboardNotification[] = await fetchNotifications(client, userId).catch((error) => {
    warnings.push(getQueryErrorMessage(error, 'Notifications could not be loaded.'))
    return []
  })

  const activityFeed: DashboardActivityItem[] = await fetchActivity(client).catch((error) => {
    warnings.push(getQueryErrorMessage(error, 'Activity could not be loaded.'))
    return []
  })

  return {
    workspaces,
    boards,
    tasks,
    recentBoards,
    dueSoonTasks,
    assignedTasks,
    notifications:
      notifications.length > 0
        ? notifications
        : deriveNotifications(dueSoonTasks, assignedTasks, recentBoards),
    activityFeed:
      activityFeed.length > 0
        ? activityFeed
        : deriveActivityFeed(workspaces, recentBoards, tasks),
    summary: createSummary(workspaces, recentBoards, dueSoonTasks, assignedTasks),
    warnings,
  }
}

function normalizeBoardDetail(board: DashboardBoard | null, tasks: DashboardTask[]) {
  return {
    board,
    tasks: tasks.sort((first, second) => compareDueSoon(first, second)),
  } satisfies DashboardBoardDetail
}

export async function getBoardDetail(boardId: string): Promise<DashboardBoardDetail> {
  const client = getSupabaseClient()

  const boardRow =
    (await resolveCandidate<UnknownRecord | null>([
      async () => {
        const { data, error } = await client
          .from('boards')
          .select('id, name, title, workspace_id, created_at, updated_at, workspace:workspaces(id, name)')
          .eq('id', boardId)
          .maybeSingle()

        if (error) {
          throw error
        }

        return (data as UnknownRecord | null) ?? null
      },
      async () => {
        const { data, error } = await client
          .from('boards')
          .select('id, name, title, workspace_id, created_at, updated_at')
          .eq('id', boardId)
          .maybeSingle()

        if (error) {
          throw error
        }

        return (data as UnknownRecord | null) ?? null
      },
    ])) ?? null

  const normalizedBoard = boardRow
    ? normalizeBoard(boardRow, new Map<string, DashboardWorkspace>())
    : null
  const boardsById = new Map<string, DashboardBoard>(
    normalizedBoard ? [[normalizedBoard.id, normalizedBoard]] : [],
  )

  const taskRows =
    (await resolveCandidate<UnknownRecord[]>([
      async () => {
        const { data, error } = await client
          .from('tasks')
          .select(
            'id, title, name, board_id, column_id, assignee_id, user_id, assigned_to, status, state, priority, due_date, deadline, created_at, updated_at, column:columns(id, name, title)',
          )
          .eq('board_id', boardId)
          .limit(100)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as UnknownRecord[]
      },
      async () => {
        const { data, error } = await client
          .from('board_tasks')
          .select('*')
          .eq('board_id', boardId)
          .limit(100)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as UnknownRecord[]
      },
    ])) ?? []

  const tasks = taskRows
    .map((row) => normalizeTask(row, boardsById))
    .filter(isDefined)

  return normalizeBoardDetail(normalizedBoard, tasks)
}

import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabase'
import { DEFAULT_BOARD_COLUMNS } from '../types/kanban'
import type {
  BoardAssignee,
  BoardDetails,
  BoardTask,
  ReorderTaskPosition,
  TaskMutationInput,
} from '../types/kanban'

type UnknownRecord = Record<string, unknown>

interface BoardQueryRow {
  id: string
  title?: string | null
  name?: string | null
  workspace_id: string
  created_by: string
  created_at?: string | null
  workspace?: {
    id: string
    name?: string | null
    owner_id?: string | null
  } | null
}

interface BoardColumnRow {
  id: string
  board_id: string
  title: string
  position: number
}

interface ProfileRow {
  id: string
  username?: string | null
  email?: string | null
  avatar_url?: string | null
}

interface WorkspaceMemberRow {
  user_id: string
  role?: string | null
  profile?: ProfileRow | null
  profiles?: ProfileRow | null
}

interface TaskRow {
  id: string
  column_id: string
  title: string
  description?: string | null
  due_date?: string | null
  priority?: string | null
  assigned_to?: string | null
  position?: number | null
  created_by?: string | null
  created_at?: string | null
  assignee?: ProfileRow | null
  profiles?: ProfileRow | null
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (isRecord(error) && typeof error.message === 'string') {
    return error.message
  }

  return fallbackMessage
}

function isCandidateError(error: unknown) {
  if (!isRecord(error)) {
    return false
  }

  const code = typeof error.code === 'string' ? error.code : ''
  const message = typeof error.message === 'string' ? error.message : ''

  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST200' ||
    code === 'PGRST201' ||
    code === 'PGRST204' ||
    message.includes('relationship') ||
    message.includes('schema cache') ||
    message.includes('does not exist')
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

function normalizeAssignee(profile: ProfileRow | null | undefined, role?: string | null): BoardAssignee | null {
  if (!profile?.id) {
    return null
  }

  return {
    id: profile.id,
    username: profile.username ?? undefined,
    email: profile.email ?? undefined,
    avatarUrl: profile.avatar_url ?? null,
    role: role ?? undefined,
  }
}

function getRelatedProfile(value: unknown) {
  if (Array.isArray(value)) {
    const firstProfile = value.find((item) => isRecord(item))
    return firstProfile ? (firstProfile as unknown as ProfileRow) : null
  }

  if (isRecord(value)) {
    return value as unknown as ProfileRow
  }

  return null
}

function normalizeTask(row: TaskRow, membersById: Map<string, BoardAssignee>) {
  const assignee = getRelatedProfile(row.assignee) ?? getRelatedProfile(row.profiles)

  return {
    id: row.id,
    columnId: row.column_id,
    title: row.title,
    description: row.description ?? null,
    dueDate: row.due_date ?? null,
    priority: row.priority ?? null,
    assignedTo: row.assigned_to ?? null,
    position: row.position ?? 0,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at ?? null,
    assignee:
      (row.assigned_to ? membersById.get(row.assigned_to) : undefined) ??
      normalizeAssignee(assignee) ??
      null,
  } satisfies BoardTask
}

function compareByPosition<T extends { position: number; createdAt?: string | null }>(first: T, second: T) {
  if (first.position !== second.position) {
    return first.position - second.position
  }

  if (!first.createdAt && !second.createdAt) {
    return 0
  }

  if (!first.createdAt) {
    return 1
  }

  if (!second.createdAt) {
    return -1
  }

  return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
}

async function ensureBoardAccess(client: SupabaseClient, boardId: string, userId: string) {
  const { data, error } = await client
    .from('boards')
    .select('id, title, name, workspace_id, created_by, created_at, workspace:workspaces(id, name, owner_id)')
    .eq('id', boardId)
    .maybeSingle()

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load this board.'))
  }

  const board = data as BoardQueryRow | null

  if (!board) {
    return null
  }

  if (board.created_by === userId || board.workspace?.owner_id === userId) {
    return board
  }

  const { data: membership, error: membershipError } = await client
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', board.workspace_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError) {
    throw new Error(getErrorMessage(membershipError, 'Unable to verify board access.'))
  }

  if (!membership) {
    throw new Error('You do not have access to this board.')
  }

  return board
}

async function ensureDefaultColumns(client: SupabaseClient, boardId: string) {
  const { data, error } = await client
    .from('board_columns')
    .select('id, board_id, title, position')
    .eq('board_id', boardId)
    .order('position', { ascending: true })

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load board columns.'))
  }

  const columns = (data ?? []) as BoardColumnRow[]

  if (columns.length > 0) {
    return columns
  }

  const defaultColumns = DEFAULT_BOARD_COLUMNS.map((title, index) => ({
    board_id: boardId,
    title,
    position: index,
  }))

  const { data: insertedColumns, error: insertError } = await client
    .from('board_columns')
    .insert(defaultColumns)
    .select('id, board_id, title, position')
    .order('position', { ascending: true })

  if (insertError) {
    throw new Error(getErrorMessage(insertError, 'Unable to create default board columns.'))
  }

  return (insertedColumns ?? []) as BoardColumnRow[]
}

async function fetchBoardMembers(client: SupabaseClient, workspaceId: string) {
  const rows =
    (await resolveCandidate<WorkspaceMemberRow[]>([
      async () => {
        const { data, error } = await client
          .from('workspace_members')
          .select('user_id, role, profile:profiles!workspace_members_user_id_fkey(id, username, email, avatar_url)')
          .eq('workspace_id', workspaceId)
          .order('role', { ascending: true })

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as WorkspaceMemberRow[]
      },
      async () => {
        const { data, error } = await client
          .from('workspace_members')
          .select('user_id, role, profiles(id, username, email, avatar_url)')
          .eq('workspace_id', workspaceId)

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as WorkspaceMemberRow[]
      },
    ])) ?? []

  return rows
    .map((row) => normalizeAssignee(getRelatedProfile(row.profile) ?? getRelatedProfile(row.profiles), row.role))
    .filter((member): member is BoardAssignee => member !== null)
}

async function fetchTasksByColumns(client: SupabaseClient, columnIds: string[], membersById: Map<string, BoardAssignee>) {
  if (columnIds.length === 0) {
    return []
  }

  const rows =
    (await resolveCandidate<TaskRow[]>([
      async () => {
        const { data, error } = await client
          .from('tasks')
          .select(
            'id, column_id, title, description, due_date, priority, assigned_to, position, created_by, created_at, assignee:profiles!tasks_assigned_to_fkey(id, username, email, avatar_url)',
          )
          .in('column_id', columnIds)
          .order('position', { ascending: true })
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }

        return (data ?? []) as unknown as TaskRow[]
      },
      async () => {
        const { data, error } = await client
          .from('tasks')
          .select('id, column_id, title, description, due_date, priority, assigned_to, position, created_by, created_at')
          .in('column_id', columnIds)
          .order('position', { ascending: true })
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }

        return (data ?? []) as TaskRow[]
      },
    ])) ?? []

  return rows.map((row) => normalizeTask(row, membersById))
}

function buildBoardDetails(
  board: BoardQueryRow,
  columns: BoardColumnRow[],
  tasks: BoardTask[],
  members: BoardAssignee[],
) {
  const tasksByColumnId = new Map<string, BoardTask[]>()

  for (const task of tasks) {
    const columnTasks = tasksByColumnId.get(task.columnId) ?? []
    columnTasks.push(task)
    tasksByColumnId.set(task.columnId, columnTasks)
  }

  return {
    id: board.id,
    title: board.title ?? board.name ?? 'Untitled board',
    workspaceId: board.workspace_id,
    workspaceName: board.workspace?.name ?? undefined,
    createdBy: board.created_by,
    createdAt: board.created_at ?? null,
    members,
    columns: columns
      .sort((first, second) => first.position - second.position)
      .map((column) => ({
        id: column.id,
        boardId: column.board_id,
        title: column.title,
        position: column.position,
        tasks: (tasksByColumnId.get(column.id) ?? []).sort(compareByPosition),
      })),
  } satisfies BoardDetails
}

export async function getKanbanBoard(boardId: string, userId: string) {
  const client = getSupabaseClient()
  const board = await ensureBoardAccess(client, boardId, userId)

  if (!board) {
    return null
  }

  const columns = await ensureDefaultColumns(client, boardId)
  const members = await fetchBoardMembers(client, board.workspace_id)
  const membersById = new Map(members.map((member) => [member.id, member]))
  const tasks = await fetchTasksByColumns(
    client,
    columns.map((column) => column.id),
    membersById,
  )

  return buildBoardDetails(board, columns, tasks, members)
}

export async function createBoardTask(
  boardId: string,
  userId: string,
  input: TaskMutationInput,
) {
  const client = getSupabaseClient()
  const board = await ensureBoardAccess(client, boardId, userId)

  if (!board) {
    throw new Error('Board not found.')
  }

  const { count, error: countError } = await client
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('column_id', input.columnId)

  if (countError) {
    throw new Error(getErrorMessage(countError, 'Unable to determine the next task position.'))
  }

  const insertPayload = {
    column_id: input.columnId,
    title: input.title,
    description: input.description ?? null,
    due_date: input.dueDate ?? null,
    priority: input.priority ?? null,
    assigned_to: input.assignedTo ?? null,
    position: count ?? 0,
    created_by: userId,
  }

  const { data, error } = await client
    .from('tasks')
    .insert(insertPayload)
    .select('id, column_id, title, description, due_date, priority, assigned_to, position, created_by, created_at')
    .single()

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to create the task.'))
  }

  return data as TaskRow
}

export async function updateBoardTask(
  taskId: string,
  input: TaskMutationInput,
) {
  const client = getSupabaseClient()
  const { data: existingTask, error: existingTaskError } = await client
    .from('tasks')
    .select('id, column_id, position')
    .eq('id', taskId)
    .single()

  if (existingTaskError) {
    throw new Error(getErrorMessage(existingTaskError, 'Unable to load the existing task state.'))
  }

  const isMovingColumns = existingTask.column_id !== input.columnId
  let position = typeof existingTask.position === 'number' ? existingTask.position : 0

  if (isMovingColumns) {
    const { count, error: countError } = await client
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('column_id', input.columnId)

    if (countError) {
      throw new Error(getErrorMessage(countError, 'Unable to determine the destination position.'))
    }

    position = count ?? 0
  }

  const payload = {
    column_id: input.columnId,
    title: input.title,
    description: input.description ?? null,
    due_date: input.dueDate ?? null,
    priority: input.priority ?? null,
    assigned_to: input.assignedTo ?? null,
    position,
  }

  const { data, error } = await client
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select('id, column_id, title, description, due_date, priority, assigned_to, position, created_by, created_at')
    .single()

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to update the task.'))
  }

  return data as TaskRow
}

export async function reorderBoardTasks(taskPositions: ReorderTaskPosition[]) {
  const client = getSupabaseClient()

  const updates = taskPositions.map((task) =>
    client
      .from('tasks')
      .update({
        column_id: task.columnId,
        position: task.position,
      })
      .eq('id', task.id),
  )

  const results = await Promise.all(updates)
  const failedUpdate = results.find((result) => result.error)

  if (failedUpdate?.error) {
    throw new Error(getErrorMessage(failedUpdate.error, 'Unable to save task order.'))
  }
}

export function isBoardTaskRealtimeEvent(
  payload: RealtimePostgresChangesPayload<UnknownRecord>,
  columnIds: Set<string>,
) {
  const newColumnId =
    isRecord(payload.new) && typeof payload.new.column_id === 'string'
      ? payload.new.column_id
      : undefined
  const oldColumnId =
    isRecord(payload.old) && typeof payload.old.column_id === 'string'
      ? payload.old.column_id
      : undefined

  return Boolean(
    (newColumnId && columnIds.has(newColumnId)) || (oldColumnId && columnIds.has(oldColumnId)),
  )
}

export function isBoardColumnRealtimeEvent(
  payload: RealtimePostgresChangesPayload<UnknownRecord>,
  boardId: string,
) {
  const newBoardId =
    isRecord(payload.new) && typeof payload.new.board_id === 'string'
      ? payload.new.board_id
      : undefined
  const oldBoardId =
    isRecord(payload.old) && typeof payload.old.board_id === 'string'
      ? payload.old.board_id
      : undefined

  return newBoardId === boardId || oldBoardId === boardId
}

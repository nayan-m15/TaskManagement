import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabase'
import { DEFAULT_BOARD_COLUMNS, TASK_PRIORITY_OPTIONS } from '../types/kanban'
import type {
  BoardAssignee,
  BoardDetails,
  BoardTask,
  BoardTaskDetail,
  CreateTaskLabelInput,
  ReorderTaskPosition,
  TaskActivityEntry,
  TaskAttachment,
  TaskComment,
  TaskLabel,
  TaskMutationInput,
  TaskPriority,
} from '../types/kanban'

type UnknownRecord = Record<string, unknown>

const TASK_ATTACHMENTS_BUCKET = import.meta.env.VITE_SUPABASE_TASK_ATTACHMENTS_BUCKET?.trim() || ''

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
  updated_at?: string | null
  assignee?: ProfileRow | null
  profiles?: ProfileRow | null
}

interface TaskLabelRow {
  id: string
  name: string
  color?: string | null
}

interface TaskLabelAssignmentRow {
  task_id: string
  label?: TaskLabelRow | null
  task_labels?: TaskLabelRow | null
}

interface TaskCommentRow {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at?: string | null
  updated_at?: string | null
  author?: ProfileRow | null
  profiles?: ProfileRow | null
}

interface TaskAttachmentRow {
  id: string
  task_id: string
  file_url: string
  file_name?: string | null
  file_type?: string | null
  file_size?: number | null
  storage_path?: string | null
  uploaded_by?: string | null
  created_at?: string | null
  uploader?: ProfileRow | null
  profiles?: ProfileRow | null
}

interface ActivityLogRow {
  id: string
  action: string
  user_id?: string | null
  task_id?: string | null
  created_at?: string | null
  actor?: ProfileRow | null
  profiles?: ProfileRow | null
}

interface TaskAccessContext {
  board: BoardQueryRow
  column: BoardColumnRow
  task: TaskRow
}

interface TaskDetailsSupport {
  comments: boolean
  attachments: boolean
  attachmentUpload: boolean
  activity: boolean
  labels: boolean
}

interface TaskDetailsCollectionResult<T> {
  items: T[]
  warnings: string[]
  supported: boolean
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
    code === 'PGRST116' ||
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

function getRelatedProfile(value: unknown) {
  if (Array.isArray(value)) {
    const profile = value.find((item) => isRecord(item))
    return profile ? (profile as unknown as ProfileRow) : null
  }

  if (isRecord(value)) {
    return value as unknown as ProfileRow
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

function normalizeLabel(row: TaskLabelRow | null | undefined): TaskLabel | null {
  if (!row?.id) {
    return null
  }

  return {
    id: row.id,
    name: row.name,
    color: row.color ?? null,
  }
}

function normalizeTask(
  row: TaskRow,
  membersById: Map<string, BoardAssignee>,
  labels: TaskLabel[] = [],
): BoardTask {
  const assignee = getRelatedProfile(row.assignee) ?? getRelatedProfile(row.profiles)

  const priority = TASK_PRIORITY_OPTIONS.includes(row.priority as TaskPriority)
    ? (row.priority as TaskPriority)
    : null

  return {
    id: row.id,
    columnId: row.column_id,
    title: row.title,
    description: row.description ?? null,
    dueDate: row.due_date ?? null,
    priority,
    assignedTo: row.assigned_to ?? null,
    position: row.position ?? 0,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    assignee:
      (row.assigned_to ? membersById.get(row.assigned_to) : undefined) ??
      normalizeAssignee(assignee) ??
      null,
    labels,
  }
}

function normalizeComment(row: TaskCommentRow): TaskComment {
  const author = getRelatedProfile(row.author) ?? getRelatedProfile(row.profiles)

  return {
    id: row.id,
    taskId: row.task_id,
    authorId: row.user_id,
    content: row.content,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    author: normalizeAssignee(author),
  }
}

function normalizeAttachment(row: TaskAttachmentRow): TaskAttachment {
  const uploader = getRelatedProfile(row.uploader) ?? getRelatedProfile(row.profiles)

  return {
    id: row.id,
    taskId: row.task_id,
    fileUrl: row.file_url,
    fileName: row.file_name ?? null,
    fileType: row.file_type ?? null,
    fileSize: row.file_size ?? null,
    storagePath: row.storage_path ?? null,
    uploadedBy: row.uploaded_by ?? null,
    uploadedAt: row.created_at ?? null,
    uploader: normalizeAssignee(uploader),
  }
}

function normalizeActivity(row: ActivityLogRow): TaskActivityEntry {
  const actor = getRelatedProfile(row.actor) ?? getRelatedProfile(row.profiles)

  return {
    id: row.id,
    action: row.action,
    taskId: row.task_id ?? null,
    userId: row.user_id ?? null,
    createdAt: row.created_at ?? null,
    actor: normalizeAssignee(actor),
  }
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

function toSentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-')
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

async function ensureBoardColumn(client: SupabaseClient, boardId: string, columnId: string) {
  const { data, error } = await client
    .from('board_columns')
    .select('id, board_id, title, position')
    .eq('id', columnId)
    .eq('board_id', boardId)
    .maybeSingle()

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to verify the selected column.'))
  }

  if (!data) {
    throw new Error('The selected column does not belong to this board.')
  }

  return data as BoardColumnRow
}

async function ensureTaskAccess(client: SupabaseClient, taskId: string, userId: string): Promise<TaskAccessContext> {
  const taskRow =
    (await resolveCandidate<TaskRow>([
      async () => {
        const { data, error } = await client
          .from('tasks')
          .select(
            'id, column_id, title, description, due_date, priority, assigned_to, position, created_by, created_at, updated_at, assignee:profiles!tasks_assigned_to_fkey(id, username, email, avatar_url)',
          )
          .eq('id', taskId)
          .single()

        if (error) {
          throw error
        }

        return data as unknown as TaskRow
      },
      async () => {
        const { data, error } = await client
          .from('tasks')
          .select('id, column_id, title, description, due_date, priority, assigned_to, position, created_by, created_at')
          .eq('id', taskId)
          .single()

        if (error) {
          throw error
        }

        return data as TaskRow
      },
    ])) ?? null

  if (!taskRow) {
    throw new Error('Task not found.')
  }

  const { data: columnData, error: columnError } = await client
    .from('board_columns')
    .select('id, board_id, title, position')
    .eq('id', taskRow.column_id)
    .single()

  if (columnError) {
    throw new Error(getErrorMessage(columnError, 'Unable to load the task column.'))
  }

  const column = columnData as BoardColumnRow
  const board = await ensureBoardAccess(client, column.board_id, userId)

  if (!board) {
    throw new Error('Board not found.')
  }

  return {
    board,
    column,
    task: taskRow,
  }
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

  const { data: insertedColumns, error: insertError } = await client
    .from('board_columns')
    .insert(
      DEFAULT_BOARD_COLUMNS.map((title, index) => ({
        board_id: boardId,
        title,
        position: index,
      })),
    )
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

        return data as unknown as WorkspaceMemberRow[]
      },
      async () => {
        const { data, error } = await client
          .from('workspace_members')
          .select('user_id, role, profiles(id, username, email, avatar_url)')
          .eq('workspace_id', workspaceId)

        if (error) {
          throw error
        }

        return data as unknown as WorkspaceMemberRow[]
      },
    ])) ?? []

  return rows
    .map((row) => normalizeAssignee(getRelatedProfile(row.profile) ?? getRelatedProfile(row.profiles), row.role))
    .filter((member): member is BoardAssignee => member !== null)
}

async function ensureWorkspaceAssignee(client: SupabaseClient, workspaceId: string, assignedTo?: string | null) {
  if (!assignedTo) {
    return
  }

  const { data, error } = await client
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', assignedTo)
    .maybeSingle()

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to verify the selected assignee.'))
  }

  if (!data) {
    throw new Error('The selected assignee is not part of this workspace.')
  }
}

async function fetchTaskLabelsByTaskIds(client: SupabaseClient, taskIds: string[]) {
  const labelsByTaskId = new Map<string, TaskLabel[]>()

  if (taskIds.length === 0) {
    return {
      labelsByTaskId,
      supported: true,
    }
  }

  const rows =
    (await resolveCandidate<TaskLabelAssignmentRow[]>([
      async () => {
        const { data, error } = await client
          .from('task_label_assignments')
          .select('task_id, label:task_labels!task_label_assignments_label_id_fkey(id, name, color)')
          .in('task_id', taskIds)

        if (error) {
          throw error
        }

        return data as unknown as TaskLabelAssignmentRow[]
      },
      async () => {
        const { data, error } = await client
          .from('task_label_assignments')
          .select('task_id, task_labels(id, name, color)')
          .in('task_id', taskIds)

        if (error) {
          throw error
        }

        return data as unknown as TaskLabelAssignmentRow[]
      },
    ])) ?? null

  if (!rows) {
    return {
      labelsByTaskId,
      supported: false,
    }
  }

  for (const row of rows) {
    const label = normalizeLabel((row.label ?? row.task_labels) as TaskLabelRow | null)
    if (!label) {
      continue
    }

    const taskLabels = labelsByTaskId.get(row.task_id) ?? []
    taskLabels.push(label)
    labelsByTaskId.set(row.task_id, taskLabels)
  }

  return {
    labelsByTaskId,
    supported: true,
  }
}

async function fetchTasksByColumns(client: SupabaseClient, columnIds: string[], membersById: Map<string, BoardAssignee>) {
  if (columnIds.length === 0) {
    return {
      tasks: [] as BoardTask[],
      labelsSupported: true,
    }
  }

  const rows =
    (await resolveCandidate<TaskRow[]>([
      async () => {
        const { data, error } = await client
          .from('tasks')
          .select(
            'id, column_id, title, description, due_date, priority, assigned_to, position, created_by, created_at, updated_at, assignee:profiles!tasks_assigned_to_fkey(id, username, email, avatar_url)',
          )
          .in('column_id', columnIds)
          .order('position', { ascending: true })
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }

        return data as unknown as TaskRow[]
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

        return data as TaskRow[]
      },
    ])) ?? []

  const { labelsByTaskId, supported } = await fetchTaskLabelsByTaskIds(
    client,
    rows.map((row) => row.id),
  )

  return {
    tasks: rows.map((row) => normalizeTask(row, membersById, labelsByTaskId.get(row.id) ?? [])),
    labelsSupported: supported,
  }
}

function buildBoardDetails(
  board: BoardQueryRow,
  columns: BoardColumnRow[],
  tasks: BoardTask[],
  members: BoardAssignee[],
) {
  const tasksByColumnId = new Map<string, BoardTask[]>()
  const availableLabels = new Map<string, TaskLabel>()

  for (const task of tasks) {
    const columnTasks = tasksByColumnId.get(task.columnId) ?? []
    columnTasks.push(task)
    tasksByColumnId.set(task.columnId, columnTasks)

    for (const label of task.labels) {
      availableLabels.set(label.id, label)
    }
  }

  return {
    id: board.id,
    title: board.title ?? board.name ?? 'Untitled board',
    workspaceId: board.workspace_id,
    workspaceName: board.workspace?.name ?? undefined,
    createdBy: board.created_by,
    createdAt: board.created_at ?? null,
    members,
    availableLabels: Array.from(availableLabels.values()).sort((first, second) =>
      first.name.localeCompare(second.name),
    ),
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

async function syncTaskLabels(client: SupabaseClient, taskId: string, labelIds: string[]) {
  const requestedLabelIds = Array.from(new Set(labelIds.filter(Boolean)))

  const { data, error } = await client
    .from('task_label_assignments')
    .select('label_id')
    .eq('task_id', taskId)

  if (error) {
    if (isCandidateError(error)) {
      return false
    }

    throw new Error(getErrorMessage(error, 'Unable to load current task labels.'))
  }

  const existingLabelIds = new Set(((data ?? []) as Array<{ label_id: string }>).map((row) => row.label_id))
  const nextLabelIds = new Set(requestedLabelIds)
  const labelsToRemove = Array.from(existingLabelIds).filter((labelId) => !nextLabelIds.has(labelId))
  const labelsToAdd = requestedLabelIds.filter((labelId) => !existingLabelIds.has(labelId))

  if (labelsToRemove.length > 0) {
    const { error: deleteError } = await client
      .from('task_label_assignments')
      .delete()
      .eq('task_id', taskId)
      .in('label_id', labelsToRemove)

    if (deleteError) {
      throw new Error(getErrorMessage(deleteError, 'Unable to remove task labels.'))
    }
  }

  if (labelsToAdd.length > 0) {
    const { error: insertError } = await client
      .from('task_label_assignments')
      .insert(labelsToAdd.map((labelId) => ({ task_id: taskId, label_id: labelId })))

    if (insertError) {
      throw new Error(getErrorMessage(insertError, 'Unable to save task labels.'))
    }
  }

  return true
}

async function insertActivityLog(client: SupabaseClient, taskId: string, userId: string, action: string) {
  const { error } = await client
    .from('activity_logs')
    .insert({
      action,
      user_id: userId,
      task_id: taskId,
    })

  if (error) {
    if (isCandidateError(error)) {
      return false
    }

    throw new Error(getErrorMessage(error, 'Unable to record task activity.'))
  }

  return true
}

async function fetchTaskComments(client: SupabaseClient, taskId: string): Promise<TaskDetailsCollectionResult<TaskComment>> {
  const rows =
    (await resolveCandidate<TaskCommentRow[]>([
      async () => {
        const { data, error } = await client
          .from('task_comments')
          .select(
            'id, task_id, user_id, content, created_at, updated_at, author:profiles!task_comments_user_id_fkey(id, username, email, avatar_url)',
          )
          .eq('task_id', taskId)
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }

        return data as unknown as TaskCommentRow[]
      },
      async () => {
        const { data, error } = await client
          .from('task_comments')
          .select('id, task_id, user_id, content, created_at, profiles(id, username, email, avatar_url)')
          .eq('task_id', taskId)
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }

        return data as unknown as TaskCommentRow[]
      },
    ])) ?? null

  if (!rows) {
    return {
      items: [],
      warnings: ['Comments are unavailable until the `task_comments` table and relationships are available.'],
      supported: false,
    }
  }

  return {
    items: rows.map(normalizeComment),
    warnings: [],
    supported: true,
  }
}

async function fetchTaskAttachments(client: SupabaseClient, taskId: string): Promise<TaskDetailsCollectionResult<TaskAttachment>> {
  const rows =
    (await resolveCandidate<TaskAttachmentRow[]>([
      async () => {
        const { data, error } = await client
          .from('task_attachments')
          .select(
            'id, task_id, file_url, file_name, file_type, file_size, storage_path, uploaded_by, created_at, uploader:profiles!task_attachments_uploaded_by_fkey(id, username, email, avatar_url)',
          )
          .eq('task_id', taskId)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        return data as unknown as TaskAttachmentRow[]
      },
      async () => {
        const { data, error } = await client
          .from('task_attachments')
          .select('id, task_id, file_url, uploaded_by, created_at')
          .eq('task_id', taskId)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        return data as TaskAttachmentRow[]
      },
    ])) ?? null

  if (!rows) {
    return {
      items: [],
      warnings: ['Attachments are unavailable until the `task_attachments` table is present.'],
      supported: false,
    }
  }

  const warnings: string[] = []
  if (rows.some((row) => row.file_name === undefined)) {
    warnings.push('Attachment metadata columns are missing. File name, type, and size will stay limited until the migration is applied.')
  }

  return {
    items: rows.map(normalizeAttachment),
    warnings,
    supported: true,
  }
}

async function fetchTaskActivity(client: SupabaseClient, taskId: string): Promise<TaskDetailsCollectionResult<TaskActivityEntry>> {
  const rows =
    (await resolveCandidate<ActivityLogRow[]>([
      async () => {
        const { data, error } = await client
          .from('activity_logs')
          .select(
            'id, action, user_id, task_id, created_at, actor:profiles!activity_logs_user_id_fkey(id, username, email, avatar_url)',
          )
          .eq('task_id', taskId)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        return data as unknown as ActivityLogRow[]
      },
      async () => {
        const { data, error } = await client
          .from('activity_logs')
          .select('id, action, user_id, task_id, created_at')
          .eq('task_id', taskId)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        return data as ActivityLogRow[]
      },
    ])) ?? null

  if (!rows) {
    return {
      items: [],
      warnings: ['Activity history is unavailable until the `activity_logs` table is present.'],
      supported: false,
    }
  }

  return {
    items: rows.map(normalizeActivity),
    warnings: [],
    supported: true,
  }
}

async function buildTaskDetail(
  client: SupabaseClient,
  context: TaskAccessContext,
  members: BoardAssignee[],
) {
  const membersById = new Map(members.map((member) => [member.id, member]))
  const { labelsByTaskId, supported: labelsSupported } = await fetchTaskLabelsByTaskIds(client, [context.task.id])
  const commentsResult = await fetchTaskComments(client, context.task.id)
  const attachmentsResult = await fetchTaskAttachments(client, context.task.id)
  const activityResult = await fetchTaskActivity(client, context.task.id)

  const boardColumns = await ensureDefaultColumns(client, context.board.id)
  const boardTasksResult = await fetchTasksByColumns(
    client,
    boardColumns.map((column) => column.id),
    membersById,
  )

  const availableLabels = new Map<string, TaskLabel>()
  for (const task of boardTasksResult.tasks) {
    for (const label of task.labels) {
      availableLabels.set(label.id, label)
    }
  }

  const labels = labelsByTaskId.get(context.task.id) ?? []
  for (const label of labels) {
    availableLabels.set(label.id, label)
  }

  const warnings = [
    ...commentsResult.warnings,
    ...attachmentsResult.warnings,
    ...activityResult.warnings,
  ]

  if (!labelsSupported) {
    warnings.push('Task labels are unavailable until the `task_label_assignments` relationship is ready.')
  }

  return {
    ...normalizeTask(context.task, membersById, labels),
    boardId: context.board.id,
    workspaceId: context.board.workspace_id,
    workspaceName: context.board.workspace?.name ?? undefined,
    columnTitle: context.column.title,
    comments: commentsResult.items,
    attachments: attachmentsResult.items,
    activity: activityResult.items,
    availableLabels: Array.from(availableLabels.values()).sort((first, second) =>
      first.name.localeCompare(second.name),
    ),
    warnings,
    supports: {
      comments: commentsResult.supported,
      attachments: attachmentsResult.supported,
      attachmentUpload: attachmentsResult.supported && Boolean(TASK_ATTACHMENTS_BUCKET),
      activity: activityResult.supported,
      labels: labelsSupported,
    } satisfies TaskDetailsSupport,
  } satisfies BoardTaskDetail
}

function getTaskUpdateActivities(previousTask: TaskRow, nextInput: TaskMutationInput, previousColumnTitle: string, nextColumnTitle: string) {
  const activities: string[] = []

  if (previousTask.title !== nextInput.title) {
    activities.push('Title updated')
  }

  if ((previousTask.description ?? null) !== (nextInput.description ?? null)) {
    activities.push('Description updated')
  }

  if ((previousTask.due_date ?? null) !== (nextInput.dueDate ?? null)) {
    activities.push(
      nextInput.dueDate ? `Due date changed to ${new Date(nextInput.dueDate).toLocaleString()}` : 'Due date removed',
    )
  }

  if ((previousTask.priority ?? null) !== (nextInput.priority ?? null)) {
    activities.push(
      nextInput.priority ? `Priority changed to ${toSentenceCase(nextInput.priority)}` : 'Priority cleared',
    )
  }

  if ((previousTask.assigned_to ?? null) !== (nextInput.assignedTo ?? null)) {
    activities.push(nextInput.assignedTo ? 'Assignee changed' : 'Assignee cleared')
  }

  if (previousTask.column_id !== nextInput.columnId) {
    activities.push(`Task moved from ${previousColumnTitle} to ${nextColumnTitle}`)
  }

  return activities
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
  const taskResult = await fetchTasksByColumns(
    client,
    columns.map((column) => column.id),
    membersById,
  )

  return buildBoardDetails(board, columns, taskResult.tasks, members)
}

export async function repairBoardColumns(boardId: string, userId: string) {
  const client = getSupabaseClient()
  const board = await ensureBoardAccess(client, boardId, userId)

  if (!board) {
    throw new Error('Board not found.')
  }

  return ensureDefaultColumns(client, boardId)
}

export async function getTaskDetails(taskId: string, userId: string) {
  const client = getSupabaseClient()
  const context = await ensureTaskAccess(client, taskId, userId)
  const members = await fetchBoardMembers(client, context.board.workspace_id)
  return buildTaskDetail(client, context, members)
}

export async function createBoardTask(boardId: string, userId: string, input: TaskMutationInput) {
  const client = getSupabaseClient()
  const board = await ensureBoardAccess(client, boardId, userId)

  if (!board) {
    throw new Error('Board not found.')
  }

  await ensureBoardColumn(client, boardId, input.columnId)
  await ensureWorkspaceAssignee(client, board.workspace_id, input.assignedTo)

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

  await syncTaskLabels(client, data.id, input.labelIds)
  await insertActivityLog(client, data.id, userId, 'Task created')

  return data as TaskRow
}

export async function updateBoardTask(taskId: string, userId: string, input: TaskMutationInput) {
  const client = getSupabaseClient()
  const context = await ensureTaskAccess(client, taskId, userId)
  const previousLabelAssignments = await client
    .from('task_label_assignments')
    .select('label_id')
    .eq('task_id', taskId)

  await ensureBoardColumn(client, context.board.id, input.columnId)
  await ensureWorkspaceAssignee(client, context.board.workspace_id, input.assignedTo)

  const isMovingColumns = context.task.column_id !== input.columnId
  let position = typeof context.task.position === 'number' ? context.task.position : 0

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

  const destinationColumn = await ensureBoardColumn(client, context.board.id, input.columnId)
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

  const previousLabelIds = new Set(
    previousLabelAssignments.error
      ? []
      : ((previousLabelAssignments.data ?? []) as Array<{ label_id: string }>).map((row) => row.label_id),
  )

  await syncTaskLabels(client, taskId, input.labelIds)
  const activityEntries = getTaskUpdateActivities(context.task, input, context.column.title, destinationColumn.title)
  const nextLabelIds = new Set(input.labelIds)

  for (const labelId of nextLabelIds) {
    if (!previousLabelIds.has(labelId)) {
      activityEntries.push('Label added')
    }
  }

  for (const labelId of previousLabelIds) {
    if (!nextLabelIds.has(labelId)) {
      activityEntries.push('Label removed')
    }
  }

  for (const activity of activityEntries) {
    await insertActivityLog(client, taskId, userId, activity)
  }

  return data as TaskRow
}

export async function reorderBoardTasks(userId: string, taskPositions: ReorderTaskPosition[]) {
  const client = getSupabaseClient()

  if (taskPositions.length === 0) {
    return
  }

  await ensureTaskAccess(client, taskPositions[0].id, userId)

  const { data: existingTasks, error: existingError } = await client
    .from('tasks')
    .select('id, column_id')
    .in('id', taskPositions.map((task) => task.id))

  if (existingError) {
    throw new Error(getErrorMessage(existingError, 'Unable to verify existing task order.'))
  }

  const previousColumnByTaskId = new Map(
    ((existingTasks ?? []) as Array<{ id: string; column_id: string }>).map((task) => [task.id, task.column_id]),
  )

  const results = await Promise.all(
    taskPositions.map((task) =>
      client
        .from('tasks')
        .update({
          column_id: task.columnId,
          position: task.position,
        })
        .eq('id', task.id),
    ),
  )

  const failedUpdate = results.find((result) => result.error)

  if (failedUpdate?.error) {
    throw new Error(getErrorMessage(failedUpdate.error, 'Unable to save task order.'))
  }

  for (const task of taskPositions) {
    if (previousColumnByTaskId.get(task.id) !== task.columnId) {
      await insertActivityLog(client, task.id, userId, 'Task moved between columns')
    }
  }
}

export async function createTaskLabel(userId: string, taskId: string, input: CreateTaskLabelInput) {
  const client = getSupabaseClient()
  await ensureTaskAccess(client, taskId, userId)

  const existingQuery = await client
    .from('task_labels')
    .select('id, name, color')
    .eq('name', input.name.trim())
    .maybeSingle()

  if (existingQuery.error && !isCandidateError(existingQuery.error)) {
    throw new Error(getErrorMessage(existingQuery.error, 'Unable to load labels.'))
  }

  if (existingQuery.data) {
    return normalizeLabel(existingQuery.data as TaskLabelRow)
  }

  const { data, error } = await client
    .from('task_labels')
    .insert({
      name: input.name.trim(),
      color: input.color ?? null,
    })
    .select('id, name, color')
    .single()

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to create the label.'))
  }

  return normalizeLabel(data as TaskLabelRow)
}

export async function addTaskComment(taskId: string, userId: string, content: string) {
  const client = getSupabaseClient()
  await ensureTaskAccess(client, taskId, userId)

  const { data, error } = await client
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      content: content.trim(),
    })
    .select('id, task_id, user_id, content, created_at')
    .single()

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to add the comment.'))
  }

  await insertActivityLog(client, taskId, userId, 'Comment added')
  return data as TaskCommentRow
}

export async function updateTaskComment(commentId: string, taskId: string, userId: string, content: string) {
  const client = getSupabaseClient()
  await ensureTaskAccess(client, taskId, userId)

  const { data: comment, error: commentError } = await client
    .from('task_comments')
    .select('id, user_id')
    .eq('id', commentId)
    .eq('task_id', taskId)
    .single()

  if (commentError) {
    throw new Error(getErrorMessage(commentError, 'Unable to load the comment.'))
  }

  if (comment.user_id !== userId) {
    throw new Error('You can only edit your own comments.')
  }

  const { error } = await client
    .from('task_comments')
    .update({
      content: content.trim(),
    })
    .eq('id', commentId)

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to update the comment.'))
  }
}

export async function deleteTaskComment(commentId: string, taskId: string, userId: string) {
  const client = getSupabaseClient()
  await ensureTaskAccess(client, taskId, userId)

  const { data: comment, error: commentError } = await client
    .from('task_comments')
    .select('id, user_id')
    .eq('id', commentId)
    .eq('task_id', taskId)
    .single()

  if (commentError) {
    throw new Error(getErrorMessage(commentError, 'Unable to load the comment.'))
  }

  if (comment.user_id !== userId) {
    throw new Error('You can only delete your own comments.')
  }

  const { error } = await client.from('task_comments').delete().eq('id', commentId)

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete the comment.'))
  }
}

export async function uploadTaskAttachment(taskId: string, userId: string, file: File) {
  const client = getSupabaseClient()
  await ensureTaskAccess(client, taskId, userId)

  if (!TASK_ATTACHMENTS_BUCKET) {
    throw new Error('Attachment uploads require VITE_SUPABASE_TASK_ATTACHMENTS_BUCKET to be configured.')
  }

  const storagePath = `${taskId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
  const storage = client.storage.from(TASK_ATTACHMENTS_BUCKET)
  const uploadResult = await storage.upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (uploadResult.error) {
    throw new Error(getErrorMessage(uploadResult.error, 'Unable to upload the attachment.'))
  }

  const publicUrl = storage.getPublicUrl(storagePath).data.publicUrl
  const basePayload = {
    task_id: taskId,
    file_url: publicUrl,
    uploaded_by: userId,
  }

  const insertedAttachment =
    (await resolveCandidate<TaskAttachmentRow>([
      async () => {
        const { data, error } = await client
          .from('task_attachments')
          .insert({
            ...basePayload,
            file_name: file.name,
            file_type: file.type || null,
            file_size: file.size,
            storage_path: storagePath,
          })
          .select(
            'id, task_id, file_url, file_name, file_type, file_size, storage_path, uploaded_by, created_at',
          )
          .single()

        if (error) {
          throw error
        }

        return data as TaskAttachmentRow
      },
      async () => {
        const { data, error } = await client
          .from('task_attachments')
          .insert(basePayload)
          .select('id, task_id, file_url, uploaded_by, created_at')
          .single()

        if (error) {
          throw error
        }

        return data as TaskAttachmentRow
      },
    ])) ?? null

  if (!insertedAttachment) {
    await storage.remove([storagePath])
    throw new Error('Unable to store the uploaded attachment metadata.')
  }

  await insertActivityLog(client, taskId, userId, 'Attachment added')
  return insertedAttachment
}

export function getTaskAttachmentBucket() {
  return TASK_ATTACHMENTS_BUCKET
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

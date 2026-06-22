import { getSupabaseClient } from '../lib/supabase'
import type { DashboardBoard, DashboardWorkspace } from '../types/dashboard'
import { DEFAULT_BOARD_COLUMNS } from '../types/kanban'

type UnknownRecord = Record<string, unknown>

interface WorkspaceAccessResult {
  id: string
  name: string
  ownerId?: string | null
  role?: string
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
    code === '42883' ||
    code === 'PGRST116' ||
    code === 'PGRST200' ||
    code === 'PGRST202' ||
    code === 'PGRST204' ||
    message.includes('Could not find the function') ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  )
}

function normalizeWorkspace(record: {
  id: string
  name?: string | null
  created_at?: string | null
}): DashboardWorkspace {
  return {
    id: record.id,
    name: record.name?.trim() || 'Untitled workspace',
    role: 'owner',
    createdAt: record.created_at ?? undefined,
  }
}

function normalizeBoard(record: {
  id: string
  workspace_id: string
  title?: string | null
  name?: string | null
  created_at?: string | null
}, workspaceName?: string): DashboardBoard {
  const name = record.title?.trim() || record.name?.trim() || 'Untitled board'

  return {
    id: record.id,
    name,
    title: name,
    workspaceId: record.workspace_id,
    workspaceName,
    createdAt: record.created_at ?? undefined,
  }
}

async function ensureWorkspaceAccess(workspaceId: string, userId: string): Promise<WorkspaceAccessResult> {
  const client = getSupabaseClient()
  const { data: workspace, error: workspaceError } = await client
    .from('workspaces')
    .select('id, name, owner_id')
    .eq('id', workspaceId)
    .maybeSingle()

  if (workspaceError) {
    throw new Error(getErrorMessage(workspaceError, 'Unable to verify workspace access.'))
  }

  if (!workspace) {
    throw new Error('Workspace not found.')
  }

  if (workspace.owner_id === userId) {
    return {
      id: workspace.id,
      name: workspace.name ?? 'Untitled workspace',
      ownerId: workspace.owner_id,
      role: 'owner',
    }
  }

  const { data: membership, error: membershipError } = await client
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError) {
    throw new Error(getErrorMessage(membershipError, 'Unable to verify workspace membership.'))
  }

  if (!membership) {
    throw new Error('You can only create boards in workspaces you belong to.')
  }

  return {
    id: workspace.id,
    name: workspace.name ?? 'Untitled workspace',
    ownerId: workspace.owner_id,
    role: membership.role ?? 'member',
  }
}

async function createWorkspaceWithRpc(name: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('create_workspace_with_owner_membership', {
    workspace_name: name,
  })

  if (error) {
    throw error
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') {
    throw new Error('Workspace creation did not return a result.')
  }

  return row as {
    id: string
    name?: string | null
    created_at?: string | null
  }
}

async function createWorkspaceFallback(name: string, userId: string) {
  const client = getSupabaseClient()
  const { data: workspace, error: workspaceError } = await client
    .from('workspaces')
    .insert({
      name,
      owner_id: userId,
    })
    .select('id, name, created_at')
    .single()

  if (workspaceError) {
    throw new Error(getErrorMessage(workspaceError, 'Unable to create the workspace.'))
  }

  const { error: membershipError } = await client.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'owner',
  })

  if (membershipError) {
    throw new Error(
      getErrorMessage(
        membershipError,
        'The workspace was created, but the owner membership could not be added.',
      ),
    )
  }

  return workspace
}

async function createBoardWithRpc(workspaceId: string, title: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('create_board_with_default_columns', {
    target_workspace_id: workspaceId,
    board_title: title,
  })

  if (error) {
    throw error
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') {
    throw new Error('Board creation did not return a result.')
  }

  return row as {
    id: string
    workspace_id: string
    title?: string | null
    created_at?: string | null
  }
}

async function createBoardFallback(workspaceId: string, title: string, userId: string) {
  const client = getSupabaseClient()
  const { data: board, error: boardError } = await client
    .from('boards')
    .insert({
      workspace_id: workspaceId,
      title,
      created_by: userId,
    })
    .select('id, workspace_id, title, created_at')
    .single()

  if (boardError) {
    throw new Error(getErrorMessage(boardError, 'Unable to create the board.'))
  }

  const { error: columnError } = await client.from('board_columns').insert(
    DEFAULT_BOARD_COLUMNS.map((columnTitle, index) => ({
      board_id: board.id,
      title: columnTitle,
      position: index,
    })),
  )

  if (columnError) {
    throw new Error(
      getErrorMessage(columnError, 'The board was created, but the default columns could not be added.'),
    )
  }

  return board
}

export async function createWorkspace(name: string, userId: string) {
  const trimmedName = name.trim()

  if (!userId) {
    throw new Error('You must be signed in to create a workspace.')
  }

  if (!trimmedName) {
    throw new Error('Workspace name is required.')
  }

  try {
    const workspace = await createWorkspaceWithRpc(trimmedName)
    return normalizeWorkspace(workspace)
  } catch (error) {
    if (!isCandidateError(error)) {
      throw new Error(getErrorMessage(error, 'Unable to create the workspace.'), {
        cause: error,
      })
    }
  }

  const workspace = await createWorkspaceFallback(trimmedName, userId)
  return normalizeWorkspace(workspace)
}

export async function createBoard(workspaceId: string, title: string, userId: string) {
  const trimmedTitle = title.trim()

  if (!userId) {
    throw new Error('You must be signed in to create a board.')
  }

  if (!workspaceId) {
    throw new Error('Choose a workspace before creating a board.')
  }

  if (!trimmedTitle) {
    throw new Error('Board title is required.')
  }

  const workspace = await ensureWorkspaceAccess(workspaceId, userId)

  try {
    const board = await createBoardWithRpc(workspaceId, trimmedTitle)
    return normalizeBoard(board, workspace.name)
  } catch (error) {
    if (!isCandidateError(error)) {
      throw new Error(getErrorMessage(error, 'Unable to create the board.'), {
        cause: error,
      })
    }
  }

  const board = await createBoardFallback(workspaceId, trimmedTitle, userId)
  return normalizeBoard(board, workspace.name)
}

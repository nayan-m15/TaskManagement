import { getSupabaseClient } from '../lib/supabase'
import type { DashboardProfile, DashboardProfileSettings } from '../types/dashboard'

type UnknownRecord = Record<string, unknown>

interface ProfileUpdateInput {
  username: string
  fullName: string
  avatarUrl: string
  bio: string
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function getString(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string') {
      return value
    }
  }

  return undefined
}

function isCandidateError(error: unknown) {
  if (!isRecord(error)) {
    return false
  }

  const code = getString(error, ['code']) ?? ''
  const message = getString(error, ['message']) ?? ''

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

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (isRecord(error)) {
    const message = getString(error, ['message'])
    if (message) {
      return message
    }
  }

  return fallbackMessage
}

function normalizeProfile(record: UnknownRecord, fallbackEmail?: string | null): DashboardProfile {
  return {
    id: getString(record, ['id']) ?? '',
    email: getString(record, ['email']) ?? fallbackEmail ?? null,
    username: getString(record, ['username']),
    fullName: getString(record, ['full_name', 'fullName']),
    avatarUrl: getString(record, ['avatar_url', 'avatarUrl']) ?? null,
    bio: getString(record, ['bio']) ?? null,
  }
}

export async function getProfileSettings(
  userId: string,
  fallbackEmail?: string | null,
): Promise<DashboardProfileSettings> {
  const client = getSupabaseClient()

  const row = await resolveCandidate<UnknownRecord | null>([
    async () => {
      const { data, error } = await client
        .from('profiles')
        .select('id, email, username, full_name, avatar_url, bio')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return (data as UnknownRecord | null) ?? null
    },
    async () => {
      const { data, error } = await client
        .from('profiles')
        .select('id, email, username, avatar_url')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return (data as UnknownRecord | null) ?? null
    },
  ])

  if (!row) {
    return {
      profile: {
        id: userId,
        email: fallbackEmail ?? null,
        username: null,
        fullName: null,
        avatarUrl: null,
        bio: null,
      },
      supported: false,
      canEdit: false,
      warnings: [
        'Profile storage is not configured in a compatible `profiles` table yet, so settings are currently read-only.',
      ],
    }
  }

  return {
    profile: normalizeProfile(row, fallbackEmail),
    supported: true,
    canEdit: true,
    warnings: [],
  }
}

export async function updateProfileSettings(
  userId: string,
  values: ProfileUpdateInput,
): Promise<DashboardProfile> {
  const client = getSupabaseClient()
  const trimmedValues = {
    username: values.username.trim() || null,
    full_name: values.fullName.trim() || null,
    avatar_url: values.avatarUrl.trim() || null,
    bio: values.bio.trim() || null,
  }

  const updatedRow = await resolveCandidate<UnknownRecord>([
    async () => {
      const { data, error } = await client
        .from('profiles')
        .update(trimmedValues)
        .eq('id', userId)
        .select('id, email, username, full_name, avatar_url, bio')
        .single()

      if (error) {
        throw error
      }

      return data as UnknownRecord
    },
    async () => {
      const { data, error } = await client
        .from('profiles')
        .update({
          username: trimmedValues.username,
          avatar_url: trimmedValues.avatar_url,
        })
        .eq('id', userId)
        .select('id, email, username, avatar_url')
        .single()

      if (error) {
        throw error
      }

      return data as UnknownRecord
    },
  ])

  if (!updatedRow) {
    throw new Error('Profile updates are not supported by the current schema.')
  }

  return normalizeProfile(updatedRow)
}

export { getErrorMessage }

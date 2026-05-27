import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabase'
import type { AuthCredentials, AuthSession, RegisterCredentials } from '../types/auth'

function mapSession(session: Session | null): AuthSession | null {
  if (!session?.user) {
    return null
  }

  const username =
    typeof session.user.user_metadata.username === 'string'
      ? session.user.user_metadata.username
      : undefined
  const fullName =
    typeof session.user.user_metadata.full_name === 'string'
      ? session.user.user_metadata.full_name
      : undefined

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
      username,
      fullName,
    },
  }
}

function getPasswordResetRedirectTo() {
  if (typeof window === 'undefined') {
    return undefined
  }

  return `${window.location.origin}/login`
}

export async function getCurrentSession() {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getSession()

  if (error) {
    throw error
  }

  return mapSession(data.session)
}

export function subscribeToAuthChanges(
  callback: (session: AuthSession | null, event: AuthChangeEvent) => void,
) {
  const client = getSupabaseClient()
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((event, session) => {
    callback(mapSession(session), event)
  })

  return () => {
    subscription.unsubscribe()
  }
}

export async function login(credentials: AuthCredentials) {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) {
    throw error
  }

  return mapSession(data.session)
}

export async function register(credentials: RegisterCredentials) {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        username: credentials.username,
      },
    },
  })

  if (error) {
    throw error
  }

  return {
    session: mapSession(data.session),
    user: data.user,
    requiresEmailConfirmation: !data.session,
  }
}

export async function logout() {
  const client = getSupabaseClient()
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}

export async function requestPasswordReset(email: string) {
  const client = getSupabaseClient()
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetRedirectTo(),
  })

  if (error) {
    throw error
  }

  return 'If an account exists for that email, a reset link has been sent.'
}

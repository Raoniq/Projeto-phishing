/**
 * Session Management
 *
 * Handles session detection and provides auth context.
 * Falls back to mock auth when Supabase is not configured.
 */

import { mockSupabaseAuth } from './mockAuth'
import { supabase } from '../supabase'

export interface AuthContext {
  session: ReturnType<typeof supabase.auth.getSession> extends Promise<infer T>
    ? T extends { data: { session: infer S } }
      ? S
      : never
    : never
  isMockAuth: boolean
}

/**
 * Check if running in mock mode (no Supabase URL configured)
 */
export function isMockMode(): boolean {
  return !import.meta.env.VITE_SUPABASE_URL
}

/**
 * Get current session - prefers real Supabase, falls back to mock
 */
export async function getSession() {
  if (isMockMode()) {
    const { data } = await mockSupabaseAuth.getSession()
    return data.session
  }

  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Get current user - prefers real Supabase, falls back to mock
 */
export async function getCurrentUser() {
  if (isMockMode()) {
    const { data } = await mockSupabaseAuth.getUser()
    return data.user
  }

  const { data } = await supabase.auth.getUser()
  return data.user
}

/**
 * Get auth context for loaders
 */
export async function getAuthContext(): Promise<AuthContext> {
  const session = await getSession()
  return {
    session,
    isMockAuth: isMockMode()
  }
}

/**
 * Sign out - handles both real and mock auth
 */
export async function signOut() {
  if (isMockMode()) {
    return mockSupabaseAuth.signOut()
  }

  return supabase.auth.signOut()
}

/**
 * Authentication Header Helper
 *
 * Provides getAuthHeader() for making authenticated API calls to Workers.
 * Returns the Authorization header value with the current session's access token.
 */

import { supabase } from '../supabase'

/**
 * Gets the Authorization header value for API requests.
 * Used by Workers to validate requests via Supabase.
 *
 * @returns Object with Authorization header, or empty object if not authenticated
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/endpoint', {
 *   headers: {
 *     ...getAuthHeader(),
 *     'Content-Type': 'application/json'
 *   }
 * })
 * ```
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return {}
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  }
}

/**
 * Gets the auth token directly.
 * Use this when you need the raw token for custom handling.
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/**
 * Checks if user is currently authenticated (has a valid session).
 * Does not guarantee the token is valid (use getAccessToken for that).
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return session !== null && typeof session.access_token === 'string'
}

/**
 * Stores for different auth mechanisms - for Workers API calls.
 * MFA status check to enforce MFA for admin users.
 */
export interface MfaChallengeResult {
  verified: boolean
  nextChallenge: 'mfa' | null
}

/**
 * Checks if the current user's session requires MFA verification.
 * Admin users must have MFA enabled per security policy.
 */
export async function checkMfaStatus(): Promise<MfaChallengeResult> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { verified: false, nextChallenge: null }
  }

  // Check for MFA authenticator factor
  const factors = await supabase.auth.mfa.listFactors()
  if (factors.error) {
    console.error('[Auth] Error listing MFA factors:', factors.error.message)
    return { verified: false, nextChallenge: null }
  }

  const hasMfa = factors.data.totp.some(f => f.status === 'verified')

  // For admin users, MFA is required
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', session.user.id)
    .single()

  if (profile?.role === 'admin' && !hasMfa) {
    return { verified: false, nextChallenge: 'mfa' }
  }

  return { verified: true, nextChallenge: null }
}
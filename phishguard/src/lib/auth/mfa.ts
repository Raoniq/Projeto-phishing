/**
 * MFA (Multi-Factor Authentication) Helpers
 *
 * Provides MFA setup, challenge, and verification functions.
 * MFA is required for admin users per security policy.
 */

import { supabase } from '../supabase'
import type { AuthError } from '@supabase/supabase-js'

/**
 * MFA factor types supported
 */
export type MfaFactorType = 'totp' | 'phone'

/**
 * MFA challenge result
 */
export interface MfaChallengeResult {
  verified: boolean
  nextChallenge: MfaFactorType | null
  challengeId?: string
}

/**
 * MFA enrollment result
 */
export interface MfaEnrollResult {
  success: boolean
  factorId?: string
  qrCode?: string
  secret?: string
  error: AuthError | null
}

/**
 * List all MFA factors for the current user
 */
export async function listMfaFactors(): Promise<{
  factors: Array<{
    id: string
    type: MfaFactorType
    status: 'verified' | 'unverified' | 'throttled'
    createdAt: string
  }>
  error: AuthError | null
}> {
  const { data, error } = await supabase.auth.mfa.listFactors()

  if (error) {
    return { factors: [], error }
  }

  return {
    factors: (data.totp || []).map(f => ({
      id: f.id,
      type: 'totp' as MfaFactorType,
      status: f.status as 'verified' | 'unverified' | 'throttled',
      createdAt: f.created_at,
    })),
    error: null,
  }
}

/**
 * Check if current user has MFA enabled
 */
export async function hasMfaEnabled(): Promise<boolean> {
  const { factors } = await listMfaFactors()
  return factors.some(f => f.status === 'verified')
}

/**
 * Enroll a new TOTP authenticator
 * Returns QR code data URL and secret for authenticator app setup
 */
export async function enrollMfa(): Promise<MfaEnrollResult> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'PhishGuard',
  })

  if (error) {
    return { success: false, error }
  }

  if (!data) {
    return { success: false, error: { message: 'No enrollment data returned', status: 0 } as AuthError }
  }

  // Generate QR code URL for authenticator apps
  const qrCodeUrl = `otpauth://totp/PhishGuard:${data.totp.qr_code_data}?secret=${data.totp.secret}&issuer=PhishGuard`

  return {
    success: true,
    factorId: data.id,
    qrCode: qrCodeUrl,
    secret: data.totp.secret,
    error: null,
  }
}

/**
 * Verify a TOTP code to complete enrollment
 */
export async function verifyMfaEnrollment(
  factorId: string,
  code: string
): Promise<{ success: boolean; error: AuthError | null }> {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    code,
    challengeId: factorId, // Use factorId as challengeId for enrollment verification
  })

  if (error) {
    return { success: false, error }
  }

  return { success: data !== null, error: null }
}

/**
 * Challenge - request MFA verification
 * Use this to initiate an MFA challenge before sensitive operations
 */
export async function challengeMfa(): Promise<{
  challengeId: string | null
  error: AuthError | null
}> {
  const { data, error } = await supabase.auth.mfa.challenge()

  if (error) {
    return { challengeId: null, error }
  }

  return { challengeId: data.challengeId, error: null }
}

/**
 * Verify an MFA code for challenge
 */
export async function verifyMfaChallenge(
  factorId: string,
  code: string,
  challengeId?: string
): Promise<{ verified: boolean; error: AuthError | null }> {
  // Use provided challengeId or get a new one
  let actualChallengeId = challengeId

  if (!actualChallengeId) {
    const challenge = await challengeMfa()
    if (challenge.error || !challenge.challengeId) {
      return { verified: false, error: challenge.error }
    }
    actualChallengeId = challenge.challengeId
  }

  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    code,
    challengeId: actualChallengeId,
  })

  if (error) {
    return { verified: false, error }
  }

  return { verified: data !== null, error: null }
}

/**
 * Unenroll (remove) an MFA factor
 */
export async function unenrollMfa(factorId: string): Promise<{ success: boolean; error: AuthError | null }> {
  const { data, error } = await supabase.auth.mfa.unenroll({ factorId })

  if (error) {
    return { success: false, error }
  }

  return { success: data !== null, error: null }
}

/**
 * Check if admin users must have MFA enabled
 * Returns true if user is admin and MFA is not enabled
 */
export async function adminRequiresMfa(): Promise<{
  requiresMfa: boolean
  isAdmin: boolean
  hasMfa: boolean
}> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { requiresMfa: false, isAdmin: false, hasMfa: false }
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const hasMfa = await hasMfaEnabled()

  return {
    requiresMfa: isAdmin && !hasMfa,
    isAdmin,
    hasMfa,
  }
}

/**
 * Enforce MFA for admin users
 * Call this after login to check if admin needs MFA
 */
export async function enforceAdminMfa(): Promise<MfaChallengeResult> {
  const { requiresMfa, isAdmin, hasMfa } = await adminRequiresMfa()

  if (!isAdmin) {
    return { verified: true, nextChallenge: null }
  }

  if (requiresMfa) {
    return {
      verified: false,
      nextChallenge: 'totp',
      challengeId: undefined,
    }
  }

  return { verified: hasMfa, nextChallenge: null }
}
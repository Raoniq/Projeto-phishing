/**
 * Authentication Helpers - Signup, Signin, Signout
 *
 * Provides authentication functions for email/password and magic link.
 * All functions use Supabase client with RLS enforcement.
 */

import { supabase, type Database } from '../supabase'
import type { AuthError, Session, User } from '@supabase/supabase-js'

export type { Session, User }

/**
 * Result type for auth operations
 */
export interface AuthResult {
  session: Session | null
  user: User | null
  error: AuthError | null
}

/**
 * Sign up with email and password
 *
 * @param email - User's email
 * @param password - User's password (min 8 chars, must have upper, lower, number)
 * @param userData - Additional user profile data (name, company_id, role)
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  userData: {
    name: string
    companyId?: string
    role?: 'admin' | 'member' | 'viewer'
  }
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: userData.name,
        company_id: userData.companyId,
        role: userData.role || 'member',
      },
    },
  })

  return {
    session: data.session,
    user: data.user,
    error,
  }
}

/**
 * Sign in with email and password
 *
 * @param email - User's email
 * @param password - User's password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return {
    session: data.session,
    user: data.user,
    error,
  }
}

/**
 * Sign in with magic link (passwordless)
 *
 * @param email - User's email
 * @param redirectTo - URL to redirect after clicking magic link
 */
export async function signInWithMagicLink(
  email: string,
  redirectTo?: string
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo || window.location.origin,
    },
  })

  return { error }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Reset password for an email (sends reset email)
 *
 * @param email - User's email
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback/reset-password`,
  })
  return { error }
}

/**
 * Update user's password
 *
 * @param newPassword - New password
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  return {
    session: data.session,
    user: data.user,
    error,
  }
}

/**
 * Verify email with the verification token from email
 *
 * @param token - Verification token from email link
 */
export async function verifyEmail(token: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.verifyOtp({
    type: 'email',
    token,
  })

  return {
    session: data.session,
    user: data.user,
    error,
  }
}

/**
 * Resend verification email for unconfirmed users
 *
 * @param email - User's email
 */
export async function resendVerificationEmail(email: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  return { error }
}

/**
 * Get the currently authenticated user (with profile)
 */
export async function getAuthenticatedUser(): Promise<{
  user: User | null
  profile: Database['public']['Tables']['users']['Row'] | null
  error: AuthError | null
}> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { user: null, profile: null, error: authError }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  return {
    user,
    profile: profileError ? null : profile,
    error: profileError,
  }
}

/**
 * Check if current user has verified email
 */
export async function isEmailVerified(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email_confirmed_at != null
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) {
    console.error('[Auth] Error refreshing session:', error.message)
    return null
  }
  return data.session
}
/**
 * Auth Module
 *
 * Export all auth-related utilities from a single entry point.
 */

// Session management (getSession, requireAuth, getAuthContext, etc.)
export * from './session'

// Auth helpers (getAuthHeader, getAccessToken, isAuthenticated)
export * from './getAuthHeader'

// RBAC helpers (checkRole, requireRole, requireAdmin, etc.)
export * from './rbac'

// Sign up / Sign in / Sign out functions
export * from './signin'

// MFA helpers (enrollMfa, verifyMfaChallenge, enforceAdminMfa, etc.)
export * from './mfa'
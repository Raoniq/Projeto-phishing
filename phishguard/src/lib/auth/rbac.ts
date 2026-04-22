/**
 * RBAC (Role-Based Access Control) Helpers
 *
 * Provides role checking utilities for route guards.
 * All protected routes should use these helpers to check permissions.
 */

import { redirect } from 'react-router-dom';
import type { LoaderFunctionArgs } from 'react-router-dom';
import { getAuthContext } from './session';
import type { AuthContext } from './session';

/**
 * Role types for RBAC checks
 */
export type Role = 'admin' | 'user' | 'learner';

/**
 * Checks if the current user has the specified role.
 * Returns the auth context if authorized, null otherwise.
 */
export async function checkRole(requiredRole: Role): Promise<AuthContext | null> {
  const context = await getAuthContext();
  if (!context) return null;

  // Check if user's role matches the required role
  if (context.profile?.role !== requiredRole) {
    return null;
  }

  return context;
}

/**
 * Checks if the current user has ANY of the specified roles.
 */
export async function checkAnyRole(roles: Role[]): Promise<AuthContext | null> {
  const context = await getAuthContext();
  if (!context) return null;

  if (!roles.includes(context.profile?.role as Role)) {
    return null;
  }

  return context;
}

/**
 * Checks if the current user has ALL of the specified roles.
 */
export async function checkAllRoles(roles: Role[]): Promise<AuthContext | null> {
  const context = await getAuthContext();
  if (!context) return null;

  const userRole = context.profile?.role;
  if (!roles.every(r => userRole === r)) {
    return null;
  }

  return context;
}

/**
 * Loader helper that requires a specific role.
 * Use this as a route loader for role-protected routes.
 *
 * @param requiredRole - The role required to access the route
 * @param options - Optional configuration
 * @param options.returnTo - Custom returnTo URL (defaults to current path)
 * @param options.onUnauthorized - Custom redirect path for unauthorized access
 */
export function requireRole(
  requiredRole: Role,
  options?: {
    returnTo?: string;
    onUnauthorized?: string;
  }
) {
  return async function roleLoader(args: LoaderFunctionArgs) {
    const context = await checkRole(requiredRole);

    if (!context) {
      // User not authenticated or doesn't have the required role
      const isAuthenticated = context !== null || await getAuthContext() !== null;

      if (!isAuthenticated) {
        // Not authenticated - redirect to login with returnTo
        const url = new URL(args.request.url);
        const returnTo = options?.returnTo || url.pathname + url.search;
        throw redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      }

      // Authenticated but wrong role - redirect to 403
      const redirectPath = options?.onUnauthorized || '/403';
      throw redirect(redirectPath);
    }

    return context;
  };
}

/**
 * Loader helper that requires any of the specified roles.
 */
export function requireAnyRole(roles: Role[]) {
  return async function anyRoleLoader(args: LoaderFunctionArgs) {
    const context = await checkAnyRole(roles);

    if (!context) {
      const isAuthenticated = await getAuthContext() !== null;

      if (!isAuthenticated) {
        const url = new URL(args.request.url);
        const returnTo = url.pathname + url.search;
        throw redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      }

      throw redirect('/403');
    }

    return context;
  };
}

/**
 * Admin-only route guard.
 * Shorthand for requireRole('admin').
 */
export function requireAdmin(options?: { returnTo?: string; onUnauthorized?: string }) {
  return requireRole('admin', options);
}

/**
 * User route guard (any authenticated user).
 * Shorthand for requireRole('user').
 */
export function requireUser(options?: { returnTo?: string; onUnauthorized?: string }) {
  return requireRole('user', options);
}
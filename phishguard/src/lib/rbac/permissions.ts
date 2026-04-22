/**
 * RBAC Permission Checking Utilities
 *
 * Provides async permission checking functions that integrate with auth session.
 * Use these in loaders, actions, and components for permission checks.
 */

import { redirect } from 'react-router-dom';
import type { LoaderFunctionArgs } from 'react-router-dom';
import { getAuthContext } from '../auth/session';
import type { AuthContext } from '../auth/session';
import {
  type Role,
  type Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canManageRole,
  CAMPAIGN_APPROVAL_REQUIRED_ADMINS,
} from './config';

/**
 * Check if current user has a specific permission
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const context = await getAuthContext();
  if (!context?.profile?.role) return false;
  return hasPermission(context.profile.role as Role, permission);
}

/**
 * Check if current user has ANY of the specified permissions
 */
export async function checkAnyPermission(permissions: Permission[]): Promise<boolean> {
  const context = await getAuthContext();
  if (!context?.profile?.role) return false;
  return hasAnyPermission(context.profile.role as Role, permissions);
}

/**
 * Check if current user has ALL of the specified permissions
 */
export async function checkAllPermissions(permissions: Permission[]): Promise<boolean> {
  const context = await getAuthContext();
  if (!context?.profile?.role) return false;
  return hasAllPermissions(context.profile.role as Role, permissions);
}

/**
 * Get current user role
 */
export async function getCurrentRole(): Promise<Role | null> {
  const context = await getAuthContext();
  return (context?.profile?.role as Role) ?? null;
}

/**
 * Check if current user can manage a specific role
 */
export async function checkCanManageRole(targetRole: Role): Promise<boolean> {
  const context = await getAuthContext();
  if (!context?.profile?.role) return false;
  return canManageRole(context.profile.role as Role, targetRole);
}

/**
 * Check if user can approve campaigns (2-admin workflow)
 */
export async function canApproveCampaign(): Promise<boolean> {
  return checkPermission('approve_campaign');
}

/**
 * Require permission - returns AuthContext if authorized, throws redirect otherwise
 */
export async function requirePermission(
  permission: Permission,
  options?: {
    returnTo?: string;
    onUnauthorized?: string;
  }
): Promise<AuthContext> {
  const hasPerm = await checkPermission(permission);
  if (!hasPerm) {
    const context = await getAuthContext();
    if (!context) {
      const url = new URL(args?.request?.url ?? window.location.href);
      const returnTo = options?.returnTo || url.pathname + url.search;
      throw redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    throw redirect(options?.onUnauthorized || '/403');
  }
  return getAuthContext().then(ctx => ctx!);
}

// Re-export args type for use in loaders
interface _Args {
  request: Request;
}

/**
 * Loader helper that requires a specific permission.
 */
export function requirePermissionLoader(
  permission: Permission,
  options?: {
    returnTo?: string;
    onUnauthorized?: string;
  }
) {
  return async function permissionLoader(args: LoaderFunctionArgs) {
    const hasPerm = await checkPermission(permission);

    if (!hasPerm) {
      const context = await getAuthContext();
      if (!context) {
        const url = new URL(args.request.url);
        const returnTo = options?.returnTo || url.pathname + url.search;
        throw redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      }
      throw redirect(options?.onUnauthorized || '/403');
    }

    return getAuthContext();
  };
}

/**
 * Loader helper that requires any of the specified permissions.
 */
export function requireAnyPermissionLoader(
  permissions: Permission[],
  options?: {
    returnTo?: string;
    onUnauthorized?: string;
  }
) {
  return async function anyPermissionLoader(args: LoaderFunctionArgs) {
    const hasAny = await checkAnyPermission(permissions);

    if (!hasAny) {
      const context = await getAuthContext();
      if (!context) {
        const url = new URL(args.request.url);
        const returnTo = options?.returnTo || url.pathname + url.search;
        throw redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      }
      throw redirect(options?.onUnauthorized || '/403');
    }

    return getAuthContext();
  };
}

/**
 * Loader helper that requires all of the specified permissions.
 */
export function requireAllPermissionsLoader(
  permissions: Permission[],
  options?: {
    returnTo?: string;
    onUnauthorized?: string;
  }
) {
  return async function allPermissionsLoader(args: LoaderFunctionArgs) {
    const hasAll = await checkAllPermissions(permissions);

    if (!hasAll) {
      const context = await getAuthContext();
      if (!context) {
        const url = new URL(args.request.url);
        const returnTo = options?.returnTo || url.pathname + url.search;
        throw redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      }
      throw redirect(options?.onUnauthorized || '/403');
    }

    return getAuthContext();
  };
}

// Campaign approval workflow helpers

export interface CampaignApprovalState {
  requiredApprovals: number;
  currentApprovals: number;
  isApproved: boolean;
  approvers: Array<{ userId: string; name: string; approvedAt: string }>;
}

/**
 * Get campaign approval state
 */
export async function getCampaignApprovalState(
  _campaignId: string
): Promise<CampaignApprovalState> {
  const context = await getAuthContext();
  if (!context) {
    return {
      requiredApprovals: CAMPAIGN_APPROVAL_REQUIRED_ADMINS,
      currentApprovals: 0,
      isApproved: false,
      approvers: [],
    };
  }

  // This would fetch from a campaign_approvals table
  // For now, return mock state
  return {
    requiredApprovals: CAMPAIGN_APPROVAL_REQUIRED_ADMINS,
    currentApprovals: 0,
    isApproved: false,
    approvers: [],
  };
}

/**
 * Check if campaign can be launched (has required approvals)
 */
export async function canLaunchCampaign(campaignId: string): Promise<boolean> {
  const state = await getCampaignApprovalState(campaignId);
  return state.currentApprovals >= state.requiredApprovals;
}

// Role management helpers

export type { Role, Permission };
export { CAMPAIGN_APPROVAL_REQUIRED_ADMINS };

/**
 * RBAC (Role-Based Access Control) Module
 *
 * Exports all RBAC utilities, types, and configurations.
 */

export * from './config';
export * from './permissions';
export * from './audit';

// Re-export types from session for convenience
export type { AuthContext } from '../auth/session';

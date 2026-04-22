/**
 * RBAC Configuration
 *
 * Defines all roles and granular permissions for PhishGuard.
 * All permission checks should use this config - NO hardcoded permissions.
 */

// 4 Roles: super_admin, admin, manager, viewer
export type Role = 'super_admin' | 'admin' | 'manager' | 'viewer';

// Granular permissions
export type Permission =
  // Campaign permissions
  | 'create_campaign'
  | 'view_campaign'
  | 'edit_campaign'
  | 'delete_campaign'
  | 'launch_campaign'
  | 'approve_campaign'      // Required for 2-admin approval workflow
  // User/Admin management permissions
  | 'manage_users'
  | 'manage_admins'
  | 'view_reports'
  // Template permissions
  | 'create_template'
  | 'edit_template'
  | 'delete_template'
  // Domain management
  | 'manage_domains'
  // Learning track permissions
  | 'manage_tracks'
  | 'assign_tracks'
  // Settings & Audit
  | 'manage_settings'
  | 'view_audit_log'
  | 'export_audit_log'
  // Billing & Company
  | 'manage_billing'
  | 'manage_company';

// Role hierarchy - higher roles inherit lower roles' permissions
const roleHierarchy: Record<Role, number> = {
  viewer: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};

// Permission matrix - which roles have which permissions
// Format: permission -> Set of roles that have that permission
export const rolePermissions: Record<Permission, Set<Role>> = {
  // Campaign permissions
  create_campaign: new Set(['admin', 'super_admin', 'manager']),
  view_campaign: new Set(['admin', 'super_admin', 'manager', 'viewer']),
  edit_campaign: new Set(['admin', 'super_admin', 'manager']),
  delete_campaign: new Set(['admin', 'super_admin']),
  launch_campaign: new Set(['admin', 'super_admin']),       // Requires approval workflow
  approve_campaign: new Set(['admin', 'super_admin', 'manager']), // 2-admin workflow

  // User/Admin management
  manage_users: new Set(['admin', 'super_admin', 'manager']),
  manage_admins: new Set(['admin', 'super_admin']),
  view_reports: new Set(['admin', 'super_admin', 'manager', 'viewer']),

  // Template permissions
  create_template: new Set(['admin', 'super_admin', 'manager']),
  edit_template: new Set(['admin', 'super_admin', 'manager']),
  delete_template: new Set(['admin', 'super_admin']),

  // Domain management
  manage_domains: new Set(['admin', 'super_admin']),

  // Learning tracks
  manage_tracks: new Set(['admin', 'super_admin', 'manager']),
  assign_tracks: new Set(['admin', 'super_admin', 'manager']),

  // Settings & Audit
  manage_settings: new Set(['admin', 'super_admin']),
  view_audit_log: new Set(['admin', 'super_admin', 'manager']),
  export_audit_log: new Set(['admin', 'super_admin']),

  // Billing & Company
  manage_billing: new Set(['admin', 'super_admin']),
  manage_company: new Set(['admin', 'super_admin']),
};

// Role display names
export const roleDisplayNames: Record<Role, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  manager: 'Gerente',
  viewer: 'Visualizador',
};

// Permission display names
export const permissionDisplayNames: Record<Permission, string> = {
  create_campaign: 'Criar campanhas',
  view_campaign: 'Visualizar campanhas',
  edit_campaign: 'Editar campanhas',
  delete_campaign: 'Excluir campanhas',
  launch_campaign: 'Lançar campanhas',
  approve_campaign: 'Aprovar campanhas',
  manage_users: 'Gerenciar usuários',
  manage_admins: 'Gerenciar administradores',
  view_reports: 'Visualizar relatórios',
  create_template: 'Criar templates',
  edit_template: 'Editar templates',
  delete_template: 'Excluir templates',
  manage_domains: 'Gerenciar domínios',
  manage_tracks: 'Gerenciar trilhas',
  assign_tracks: 'Atribuir trilhas',
  manage_settings: 'Gerenciar configurações',
  view_audit_log: 'Visualizar log de auditoria',
  export_audit_log: 'Exportar log de auditoria',
  manage_billing: 'Gerenciar cobrança',
  manage_company: 'Gerenciar empresa',
};

// Permission categories for UI grouping
export const permissionCategories: Record<string, Permission[]> = {
  'Campanhas': ['create_campaign', 'view_campaign', 'edit_campaign', 'delete_campaign', 'launch_campaign', 'approve_campaign'],
  'Usuários': ['manage_users', 'manage_admins', 'view_reports'],
  'Templates': ['create_template', 'edit_template', 'delete_template'],
  'Domínios': ['manage_domains'],
  'Trilhas': ['manage_tracks', 'assign_tracks'],
  'Sistema': ['manage_settings', 'view_audit_log', 'export_audit_log', 'manage_billing', 'manage_company'],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[permission]?.has(role) ?? false;
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
  return Object.entries(rolePermissions)
    .filter(([_, roles]) => roles.has(role))
    .map(([permission]) => permission as Permission);
}

/**
 * Get roles that have a specific permission
 */
export function getRolesWithPermission(permission: Permission): Role[] {
  return Array.from(rolePermissions[permission] ?? []);
}

/**
 * Check if role1 is higher or equal to role2 in hierarchy
 */
export function isRoleHigherOrEqual(role1: Role, role2: Role): boolean {
  return roleHierarchy[role1] >= roleHierarchy[role2];
}

/**
 * Get default role for new users
 */
export function getDefaultRole(): Role {
  return 'viewer';
}

/**
 * Check if role can manage another role
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  // Super admin can manage anyone
  if (managerRole === 'super_admin') return true;
  // Admin can manage manager, viewer, and other admins (not super_admin)
  if (managerRole === 'admin') return targetRole !== 'super_admin';
  // Manager can only manage viewer
  if (managerRole === 'manager') return targetRole === 'viewer';
  // Viewer cannot manage anyone
  return false;
}

// Approval workflow constants
export const CAMPAIGN_APPROVAL_REQUIRED_ADMINS = 2;

import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canManageRole,
  getPermissions,
  getRolesWithPermission,
  isRoleHigherOrEqual,
  getDefaultRole,
} from './config'

describe('RBAC Config', () => {
  describe('hasPermission', () => {
    it('super_admin has all permissions', () => {
      expect(hasPermission('super_admin', 'create_campaign')).toBe(true)
      expect(hasPermission('super_admin', 'delete_campaign')).toBe(true)
      expect(hasPermission('super_admin', 'manage_admins')).toBe(true)
    })

    it('admin has most permissions but viewer does not', () => {
      expect(hasPermission('admin', 'create_campaign')).toBe(true)
      expect(hasPermission('admin', 'delete_campaign')).toBe(true)
      expect(hasPermission('admin', 'manage_admins')).toBe(true)
    })

    it('manager has limited permissions', () => {
      expect(hasPermission('manager', 'create_campaign')).toBe(true)
      expect(hasPermission('manager', 'view_campaign')).toBe(true)
      expect(hasPermission('manager', 'delete_campaign')).toBe(false)
      expect(hasPermission('manager', 'manage_admins')).toBe(false)
    })

    it('viewer has only view permissions', () => {
      expect(hasPermission('viewer', 'view_campaign')).toBe(true)
      expect(hasPermission('viewer', 'view_reports')).toBe(true)
      expect(hasPermission('viewer', 'create_campaign')).toBe(false)
      expect(hasPermission('viewer', 'manage_users')).toBe(false)
    })

    it('returns false for invalid permission', () => {
      expect(hasPermission('admin', 'invalid_permission' as any)).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true if role has any of the permissions', () => {
      expect(hasAnyPermission('admin', ['delete_campaign', 'manage_admins'])).toBe(true)
    })

    it('returns false if role has none of the permissions', () => {
      expect(hasAnyPermission('viewer', ['delete_campaign', 'manage_admins'])).toBe(false)
    })

    it('returns true if role has at least one permission', () => {
      expect(hasAnyPermission('manager', ['delete_campaign', 'create_campaign'])).toBe(true)
    })
  })

  describe('hasAllPermissions', () => {
    it('returns true if role has all permissions', () => {
      expect(hasAllPermissions('admin', ['create_campaign', 'view_campaign'])).toBe(true)
    })

    it('returns false if role is missing any permission', () => {
      expect(hasAllPermissions('manager', ['delete_campaign', 'create_campaign'])).toBe(false)
    })
  })

  describe('canManageRole', () => {
    it('super_admin can manage anyone', () => {
      expect(canManageRole('super_admin', 'admin')).toBe(true)
      expect(canManageRole('super_admin', 'manager')).toBe(true)
      expect(canManageRole('super_admin', 'viewer')).toBe(true)
      expect(canManageRole('super_admin', 'super_admin')).toBe(true)
    })

    it('admin cannot manage super_admin', () => {
      expect(canManageRole('admin', 'super_admin')).toBe(false)
    })

    it('admin can manage other roles', () => {
      expect(canManageRole('admin', 'admin')).toBe(true)
      expect(canManageRole('admin', 'manager')).toBe(true)
      expect(canManageRole('admin', 'viewer')).toBe(true)
    })

    it('manager can only manage viewer', () => {
      expect(canManageRole('manager', 'viewer')).toBe(true)
      expect(canManageRole('manager', 'manager')).toBe(false)
      expect(canManageRole('manager', 'admin')).toBe(false)
    })

    it('viewer cannot manage anyone', () => {
      expect(canManageRole('viewer', 'viewer')).toBe(false)
      expect(canManageRole('viewer', 'manager')).toBe(false)
    })
  })

  describe('getPermissions', () => {
    it('returns all permissions for admin', () => {
      const perms = getPermissions('admin')
      expect(perms).toContain('create_campaign')
      expect(perms).toContain('view_campaign')
      expect(perms).toContain('delete_campaign')
    })

    it('returns fewer permissions for viewer', () => {
      const adminPerms = getPermissions('admin')
      const viewerPerms = getPermissions('viewer')
      expect(viewerPerms.length).toBeLessThan(adminPerms.length)
    })

    it('viewer only has view permissions', () => {
      const perms = getPermissions('viewer')
      expect(perms).toContain('view_campaign')
      expect(perms).not.toContain('create_campaign')
    })
  })

  describe('getRolesWithPermission', () => {
    it('returns roles that have delete_campaign permission', () => {
      const roles = getRolesWithPermission('delete_campaign')
      expect(roles).toContain('admin')
      expect(roles).toContain('super_admin')
      expect(roles).not.toContain('manager')
      expect(roles).not.toContain('viewer')
    })

    it('returns viewer for view_campaign', () => {
      const roles = getRolesWithPermission('view_campaign')
      expect(roles).toContain('viewer')
    })
  })

  describe('isRoleHigherOrEqual', () => {
    it('super_admin is highest', () => {
      expect(isRoleHigherOrEqual('super_admin', 'admin')).toBe(true)
      expect(isRoleHigherOrEqual('super_admin', 'manager')).toBe(true)
      expect(isRoleHigherOrEqual('super_admin', 'viewer')).toBe(true)
    })

    it('admin is higher than manager and viewer', () => {
      expect(isRoleHigherOrEqual('admin', 'manager')).toBe(true)
      expect(isRoleHigherOrEqual('admin', 'viewer')).toBe(true)
    })

    it('same role returns true', () => {
      expect(isRoleHigherOrEqual('manager', 'manager')).toBe(true)
    })
  })

  describe('getDefaultRole', () => {
    it('returns viewer as default', () => {
      expect(getDefaultRole()).toBe('viewer')
    })
  })
})
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Check,
  X,
  Edit2,
  Save,
  RotateCcw,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  type Role,
  type Permission,
  permissionDisplayNames,
  permissionCategories,
  rolePermissions,
  getPermissions,
  CAMPAIGN_APPROVAL_REQUIRED_ADMINS,
} from '@/lib/rbac';

const ROLE_CONFIG: Record<Role, { label: string; color: string; description: string }> = {
  super_admin: {
    label: 'Super Admin',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Acesso irrestrito a todos os recursos'
  },
  admin: {
    label: 'Admin',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'Gerencia usuários e configurações'
  },
  manager: {
    label: 'Gerente',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Gerencia campanhas e relatórios'
  },
  viewer: {
    label: 'Visualizador',
    color: 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)] border-[var(--color-noir-600)]',
    description: 'Visualiza apenas informações'
  },
};

interface PermissionMatrixProps {
  isEditing?: boolean;
  onSave?: (changes: Record<Role, Set<Permission>>) => void;
}

export function PermissionMatrix({ isEditing = false, onSave }: PermissionMatrixProps) {
  const [editMode, setEditMode] = useState(isEditing);
  const [pendingChanges, setPendingChanges] = useState<Record<Role, Set<Permission>>(
    Object.fromEntries(
      (['super_admin', 'admin', 'manager', 'viewer'] as Role[]).map(role => [role, new Set(getPermissions(role))])
    )
  );

  // For now, use the actual config (edit mode would require API backend)
    const handleTogglePermission = (role: Role, permission: Permission) => {
    if (!editMode) return;

    setPendingChanges(prev => {
      const newSet = new Set(prev[role]);
      if (newSet.has(permission)) {
        newSet.delete(permission);
      } else {
        newSet.add(permission);
      }
      return { ...prev, [role]: newSet };
    });
  };

  const handleSave = () => {
    onSave?.(pendingChanges);
    setEditMode(false);
  };

  const handleCancel = () => {
    setPendingChanges(
      Object.fromEntries(
        (['super_admin', 'admin', 'manager', 'viewer'] as Role[]).map(role => [role, new Set(getPermissions(role))])
      )
    );
    setEditMode(false);
  };

  const roles: Role[] = ['super_admin', 'admin', 'manager', 'viewer'];
  const allPermissions = Object.entries(permissionCategories).flatMap(([, perms]) => perms);

  // Calculate permissions per role for summary
  const permissionsByRole = useMemo(() => {
    return Object.fromEntries(
      roles.map(role => [role, getPermissions(role).length])
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-fg-primary)]">
            Matriz de Permissões
          </h3>
          <p className="text-sm text-[var(--color-fg-secondary)]">
            Controle granular de acessos por função
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                <RotateCcw className="h-4 w-4" />
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
              <Edit2 className="h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-lg border p-4',
              ROLE_CONFIG[role].color
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4" />
              <span className="font-medium">{ROLE_CONFIG[role].label}</span>
            </div>
            <p className="text-xs opacity-70 mb-3">{ROLE_CONFIG[role].description}</p>
            <div className="text-2xl font-bold">
              {permissionsByRole[role]}/{allPermissions.length}
            </div>
            <p className="text-xs opacity-70">permissões ativas</p>
          </motion.div>
        ))}
      </div>

      {/* Permission Matrix Table */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-noir-700)]">
                  <th className="sticky left-0 bg-[var(--color-surface-2)] px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Permissão
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role}
                      className="px-4 py-3 text-center text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                    >
                      {ROLE_CONFIG[role].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-noir-700)]">
                {Object.entries(permissionCategories).map(([category, permissions]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-[var(--color-surface-2)]">
                      <td colSpan={5} className="px-4 py-2 text-xs font-semibold text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                        {category}
                      </td>
                    </tr>
                    {permissions.map((permission) => (
                      <tr
                        key={permission}
                        className="hover:bg-[var(--color-surface-2)]/50 transition-colors"
                      >
                        <td className="sticky left-0 bg-[var(--color-surface-1)] px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                              {permissionDisplayNames[permission]}
                            </p>
                            <p className="text-xs text-[var(--color-fg-muted)] font-mono">
                              {permission}
                            </p>
                          </div>
                        </td>
                        {roles.map((role) => {
                          const hasPerm = rolePermissions[permission]?.has(role);
                          return (
                            <td key={role} className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(role, permission)}
                                disabled={!editMode}
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-lg mx-auto transition-all',
                                  editMode ? 'hover:scale-110 cursor-pointer' : 'cursor-default',
                                  hasPerm
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/10 text-red-400/50'
                                )}
                              >
                                {hasPerm ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </React.Fragment>
              ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Approval Info */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-semibold text-[var(--color-fg-primary)]">
                Workflow de Aprovação de Campanhas
              </h4>
              <p className="text-sm text-[var(--color-fg-secondary)] mt-1">
                Campanhas requerem <strong>{CAMPAIGN_APPROVAL_REQUIRED_ADMINS} aprovações</strong> de administradores antes de serem lançadas.
                Apenas funções com permissão <code className="bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded text-xs">approve_campaign</code> podem aprovar.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                  Admin
                </Badge>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                  Super Admin
                </Badge>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  Manager
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PermissionMatrix;
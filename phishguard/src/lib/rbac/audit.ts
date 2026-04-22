/**
 * Audit Log Types and Utilities for Frontend
 *
 * Provides types and hooks for audit log display and filtering.
 */

import type { Database } from '../../lib/supabase';

// Database audit log type
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

// Action types for audit logs
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'launch'
  | 'pause'
  | 'restore'
  | 'approve'
  | 'login'
  | 'logout'
  | 'invite'
  | 'remove';

// Human-readable action descriptions
export const auditActionLabels: Record<AuditAction, string> = {
  create: 'Criou',
  update: 'Atualizou',
  delete: 'Excluiu',
  launch: 'Lançou',
  pause: 'Pausou',
  restore: 'Restaurou',
  approve: 'Aprovou',
  login: 'Entrou',
  logout: 'Saiu',
  invite: 'Convidou',
  remove: 'Removeu',
};

// Icon mapping for audit actions
export const auditActionIcons: Record<AuditAction, string> = {
  create: '+',
  update: '✎',
  delete: '✕',
  launch: '▶',
  pause: '⏸',
  restore: '↻',
  approve: '✓',
  login: '→',
  logout: '←',
  invite: '✉',
  remove: '✕',
};

// Table name labels
export const tableNameLabels: Record<string, string> = {
  campaigns: 'Campanha',
  users: 'Usuário',
  companies: 'Empresa',
  domains: 'Domínio',
  templates: 'Template',
  learning_tracks: 'Trilha',
  audit_logs: 'Log de Auditoria',
  campaign_targets: 'Alvo',
  campaign_approvals: 'Aprovação',
};

/**
 * Format audit log for display
 */
export function formatAuditLog(log: AuditLog): {
  actionLabel: string;
  tableLabel: string;
  description: string;
  icon: string;
} {
  const action = log.action as AuditAction;
  const tableLabel = tableNameLabels[log.table_name] || log.table_name;

  let description = `${auditActionLabels[action] || action} ${tableLabel.toLowerCase()}`;

  if (log.record_id) {
    description += ` (${log.record_id.slice(0, 8)}...)`;
  }

  return {
    actionLabel: auditActionLabels[action] || action,
    tableLabel,
    description,
    icon: auditActionIcons[action] || '•',
  };
}

/**
 * Format timestamp for display
 */
export function formatAuditTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Filter audit logs by user, action, or table
 */
export function filterAuditLogs(
  logs: AuditLog[],
  filters: {
    userId?: string;
    action?: AuditAction;
    tableName?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }
): AuditLog[] {
  return logs.filter(log => {
    if (filters.userId && log.user_id !== filters.userId) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.tableName && log.table_name !== filters.tableName) return false;
    if (filters.startDate && log.created_at < filters.startDate) return false;
    if (filters.endDate && log.created_at > filters.endDate) return false;
    return true;
  });
}

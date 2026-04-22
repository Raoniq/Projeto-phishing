import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Eye,
  Clock,
  User,
  Shield,
  FileText,
  Trash2,
  Edit,
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import {
  type AuditLog,
  type AuditAction,
  auditActionLabels,
  tableNameLabels,
} from '@/lib/rbac/audit';

interface AuditEntry extends AuditLog {
  userName?: string;
  userEmail?: string;
}

const ACTION_ICONS: Record<AuditAction, typeof Plus> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  launch: Play,
  pause: Pause,
  restore: RefreshCw,
  approve: CheckCircle,
  login: User,
  logout: User,
  invite: Plus,
  remove: XCircle,
};

const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'text-green-400',
  update: 'text-blue-400',
  delete: 'text-red-400',
  launch: 'text-amber-400',
  pause: 'text-amber-400',
  restore: 'text-purple-400',
  approve: 'text-green-400',
  login: 'text-blue-400',
  logout: 'text-gray-400',
  invite: 'text-green-400',
  remove: 'text-red-400',
};

// Generate mock audit data
function generateMockAuditLogs(count: number): AuditEntry[] {
  const actions: AuditAction[] = ['create', 'update', 'delete', 'launch', 'pause', 'approve', 'login', 'logout', 'invite', 'remove'];
  const tables = ['campaigns', 'users', 'companies', 'domains', 'templates', 'learning_tracks'];
  const userNames = ['Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Costa', 'Paula Souza', 'Roberto Lima'];

  return Array.from({ length: count }, (_, i) => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const tableName = tables[Math.floor(Math.random() * tables.length)];
    const userName = userNames[Math.floor(Math.random() * userNames.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);

    return {
      id: `audit-${i + 1}`,
      company_id: 'company-1',
      user_id: `user-${i + 1}`,
      action,
      table_name: tableName,
      record_id: `${tableName.slice(0, 4)}-${Math.random().toString(36).substr(2, 9)}`,
      old_data: action === 'update' ? { name: 'Old Name' } : null,
      new_data: { name: 'New Name' },
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      created_at: new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString(),
      userName,
      userEmail: `${userName.toLowerCase().replace(' ', '.')}@empresa.com`,
    };
  });
}

const ALL_AUDIT_LOGS = generateMockAuditLogs(500);

type SortField = 'created_at' | 'action' | 'table_name' | 'userName';
type SortDirection = 'asc' | 'desc';
const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100, 200];

// SortIcon component extracted outside to avoid static-components lint error
function SortIconComponent({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
}

export default function AuditLogPage() {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Filters visibility
  const [showFilters, setShowFilters] = useState(false);

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    let result = [...ALL_AUDIT_LOGS];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log =>
        log.userName?.toLowerCase().includes(query) ||
        log.userEmail?.toLowerCase().includes(query) ||
        log.record_id?.toLowerCase().includes(query)
      );
    }

    if (actionFilter !== 'all') {
      result = result.filter(log => log.action === actionFilter);
    }

    if (tableFilter !== 'all') {
      result = result.filter(log => log.table_name === tableFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      switch (dateFilter) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      result = result.filter(log => new Date(log.created_at) >= cutoff);
    }

    result.sort((a, b) => {
      let aVal: string | number, bVal: string | number;

      switch (sortField) {
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'action':
          aVal = a.action;
          bVal = b.action;
          break;
        case 'table_name':
          aVal = a.table_name;
          bVal = b.table_name;
          break;
        case 'userName':
          aVal = a.userName?.toLowerCase() || '';
          bVal = b.userName?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [searchQuery, actionFilter, tableFilter, dateFilter, sortField, sortDirection]);

  // Pagination
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActionFilter('all');
    setTableFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  }, []);

  const openDetailDialog = (log: AuditEntry) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const hasActiveFilters = searchQuery || actionFilter !== 'all' || tableFilter !== 'all' || dateFilter !== 'all';

  // Stats
  const todayLogs = ALL_AUDIT_LOGS.filter(log => {
    const logDate = new Date(log.created_at);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length;

  const criticalActions = ALL_AUDIT_LOGS.filter(log =>
    ['delete', 'launch', 'approve'].includes(log.action)
  ).length;

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
              Log de Auditoria
            </h1>
            <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
              Acompanhe todas as ações realizadas no sistema
            </p>
          </div>
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{ALL_AUDIT_LOGS.length}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Total de registros</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{todayLogs}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Ações hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-500/10">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{criticalActions}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Ações críticas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-500/10">
                  <User className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">12</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Usuários ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-4"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
              <input
                type="text"
                placeholder="Buscar por usuário ou ID do registro..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); handleFilterChange(); }}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] pl-10 pr-4 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              size="default"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-[var(--color-surface-0)]">
                  {(actionFilter !== 'all' ? 1 : 0) + (tableFilter !== 'all' ? 1 : 0) + (dateFilter !== 'all' ? 1 : 0)}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="default" onClick={clearFilters}>
                <RefreshCw className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">Ação:</label>
                    <select
                      value={actionFilter}
                      onChange={(e) => { setActionFilter(e.target.value as AuditAction | 'all'); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todas</option>
                      <option value="create">Criou</option>
                      <option value="update">Atualizou</option>
                      <option value="delete">Excluiu</option>
                      <option value="launch">Lançou</option>
                      <option value="pause">Pausou</option>
                      <option value="approve">Aprovou</option>
                      <option value="login">Entrou</option>
                      <option value="logout">Saiu</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">Tabela:</label>
                    <select
                      value={tableFilter}
                      onChange={(e) => { setTableFilter(e.target.value); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todas</option>
                      <option value="campaigns">Campanhas</option>
                      <option value="users">Usuários</option>
                      <option value="templates">Templates</option>
                      <option value="domains">Domínios</option>
                      <option value="learning_tracks">Trilhas</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">Período:</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => { setDateFilter(e.target.value); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="today">Hoje</option>
                      <option value="week">Última semana</option>
                      <option value="month">Último mês</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Audit Log Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-surface-2)]">
              <tr>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    Data/Hora
                    <SortIconComponent field="created_at" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center gap-1">
                    Usuário
                    <SortIconComponent field="userName" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('action')}
                >
                  <div className="flex items-center gap-1">
                    Ação
                    <SortIconComponent field="action" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('table_name')}
                >
                  <div className="flex items-center gap-1">
                    Tabela
                    <SortIconComponent field="table_name" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                  Registro
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-noir-700)]">
              {paginatedLogs.map((log) => {
                const Icon = ACTION_ICONS[log.action as AuditAction] || FileText;
                const colorClass = ACTION_COLORS[log.action as AuditAction] || 'text-gray-400';

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-[var(--color-surface-2)]/50 transition-colors cursor-pointer"
                    onClick={() => openDetailDialog(log)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-[var(--color-fg-primary)]">
                          {new Date(log.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-[var(--color-fg-muted)]">
                          {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-xs text-[var(--color-accent)]">
                          {log.userName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-fg-primary)]">{log.userName}</p>
                          <p className="text-xs text-[var(--color-fg-muted)]">{log.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 text-sm', colorClass)}>
                        <Icon className="h-4 w-4" />
                        {auditActionLabels[log.action as AuditAction] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-fg-secondary)]">
                      {tableNameLabels[log.table_name] || log.table_name}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-[var(--color-fg-muted)] bg-[var(--color-surface-2)] px-2 py-1 rounded">
                        {log.record_id?.slice(0, 12)}...
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-fg-muted)]">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} registros
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-fg-muted)]">Por página:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                {ITEMS_PER_PAGE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'primary' : 'secondary'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
            <DialogDescription>
              Informações detalhadas da ação realizada.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Data/Hora</p>
                  <p className="text-sm text-[var(--color-fg-primary)]">
                    {new Date(selectedLog.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Usuário</p>
                  <p className="text-sm text-[var(--color-fg-primary)]">{selectedLog.userName}</p>
                  <p className="text-xs text-[var(--color-fg-muted)]">{selectedLog.userEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Ação</p>
                  <p className="text-sm text-[var(--color-fg-primary)]">
                    {auditActionLabels[selectedLog.action as AuditAction]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Tabela</p>
                  <p className="text-sm text-[var(--color-fg-primary)]">
                    {tableNameLabels[selectedLog.table_name] || selectedLog.table_name}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">ID do Registro</p>
                  <p className="text-sm text-[var(--color-fg-primary)] font-mono">{selectedLog.record_id}</p>
                </div>
                {selectedLog.ip_address && (
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">IP</p>
                    <p className="text-sm text-[var(--color-fg-primary)] font-mono">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              {selectedLog.old_data && (
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)] mb-1">Dados Anteriores</p>
                  <pre className="text-xs text-[var(--color-fg-secondary)] bg-[var(--color-surface-2)] p-2 rounded overflow-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)] mb-1">Novos Dados</p>
                  <pre className="text-xs text-[var(--color-fg-secondary)] bg-[var(--color-surface-2)] p-2 rounded overflow-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
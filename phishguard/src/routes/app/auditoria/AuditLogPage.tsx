import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  FileText,
  Download,
  FileSpreadsheet,
  File,
  Shield,
  Clock,
  Filter,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Plus,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useAuditLogs, useUsers } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

type ActionType =
  | 'login'
  | 'logout'
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'campaign_created'
  | 'campaign_launched'
  | 'campaign_archived'
  | 'user_added'
  | 'user_removed'
  | 'settings_changed'
  | 'report_exported'
  | 'data_access';

type EntityType = 'campaign' | 'user' | 'report' | 'settings' | 'template' | 'group';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userName: string;
  userEmail: string;
  action: ActionType;
  entityType: EntityType;
  entityName: string;
  details: string;
  ip: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  view: 'Visualização',
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  export: 'Exportação',
  campaign_created: 'Campanha criada',
  campaign_launched: 'Campanha iniciada',
  campaign_archived: 'Campanha arquivada',
  user_added: 'Usuário adicionado',
  user_removed: 'Usuário removido',
  settings_changed: 'Configuração alterada',
  report_exported: 'Relatório exportado',
  data_access: 'Acesso a dados',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login: <LogIn className="h-3 w-3" />,
  logout: <LogOut className="h-3 w-3" />,
  view: <Eye className="h-3 w-3" />,
  create: <Plus className="h-3 w-3" />,
  update: <Edit className="h-3 w-3" />,
  delete: <Trash2 className="h-3 w-3" />,
  export: <Download className="h-3 w-3" />,
  campaign_created: <Plus className="h-3 w-3" />,
  campaign_launched: <FileText className="h-3 w-3" />,
  campaign_archived: <FileText className="h-3 w-3" />,
  user_added: <User className="h-3 w-3" />,
  user_removed: <User className="h-3 w-3" />,
  settings_changed: <Edit className="h-3 w-3" />,
  report_exported: <FileText className="h-3 w-3" />,
  data_access: <Eye className="h-3 w-3" />,
};

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  logout: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  view: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  create: 'bg-green-500/20 text-green-400 border border-green-500/30',
  update: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  delete: 'bg-red-500/20 text-red-400 border border-red-500/30',
  export: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  campaign_created: 'bg-green-500/20 text-green-400 border border-green-500/30',
  campaign_launched: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  campaign_archived: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  user_added: 'bg-teal-500/20 text-teal-400 border border-teal-500/30',
  user_removed: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  settings_changed: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
  report_exported: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  data_access: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
};

const ACTION_TYPES: { value: string; label: string }[] = [
  { value: 'all', label: 'Todas as ações' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'view', label: 'Visualização' },
  { value: 'create', label: 'Criação' },
  { value: 'update', label: 'Atualização' },
  { value: 'delete', label: 'Exclusão' },
  { value: 'export', label: 'Exportação' },
  { value: 'campaign_created', label: 'Campanha criada' },
  { value: 'campaign_launched', label: 'Campanha iniciada' },
  { value: 'campaign_archived', label: 'Campanha arquivada' },
  { value: 'user_added', label: 'Usuário adicionado' },
  { value: 'user_removed', label: 'Usuário removido' },
  { value: 'settings_changed', label: 'Configuração alterada' },
  { value: 'report_exported', label: 'Relatório exportado' },
  { value: 'data_access', label: 'Acesso a dados' },
];

const ENTITY_TYPES: { value: string; label: string }[] = [
  { value: 'all', label: 'Todas as entidades' },
  { value: 'campaigns', label: 'Campanha' },
  { value: 'users', label: 'Usuário' },
  { value: 'reports', label: 'Relatório' },
  { value: 'settings', label: 'Configuração' },
  { value: 'landing_pages', label: 'Template' },
  { value: 'groups', label: 'Grupo' },
];

type SortField = 'timestamp' | 'userName' | 'action' | 'entityType';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;
const RETENTION_DAYS = 365;
const RETENTION_DATE = new Date();
RETENTION_DATE.setDate(RETENTION_DATE.getDate() - RETENTION_DAYS);

export default function AuditLogPage() {
  const [companyId, setCompanyId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Fetch company ID on mount
  useEffect(() => {
    const fetchCompanyId = async () => {
      const { data } = await supabase.rpc('get_user_company_id');
      if (data) setCompanyId(data);
    };
    fetchCompanyId();
  }, []);

  // Fetch audit logs with filters
  const { logs, loading, error, refetch } = useAuditLogs(companyId || undefined);

  // Fetch users for filter dropdown
  const { users } = useUsers(companyId || undefined);

  // Map user_id to user name/email
  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    users.forEach(u => map.set(u.id, { name: u.name, email: u.email }));
    return map;
  }, [users]);

  // Map audit_logs to AuditLogEntry format
  const mappedLogs = useMemo((): AuditLogEntry[] => {
    return logs.map(log => {
      const user = userMap.get(log.user_id || '') || { name: 'Sistema', email: '' };
      const actionLabel = ACTION_LABELS[log.action] || log.action;
      
      return {
        id: log.id,
        timestamp: new Date(log.created_at),
        userName: user.name,
        userEmail: user.email,
        action: log.action as ActionType,
        entityType: log.table_name.replace(/_/g, '-') as EntityType,
        entityName: actionLabel,
        details: `${actionLabel} - ${log.table_name}`,
        ip: log.ip_address || '-',
        oldData: log.old_data || undefined,
        newData: log.new_data || undefined,
      };
    });
  }, [logs, userMap]);

  // Filter logs client-side (useAuditLogs already filters server-side for user/action/table)
  const filteredLogs = useMemo(() => {
    return mappedLogs.filter(log => {
      if (selectedUserId !== 'all' && log.userName !== selectedUserId) return false;
      if (selectedAction !== 'all' && log.action !== selectedAction) return false;
      if (selectedEntity !== 'all' && !log.entityType.includes(selectedEntity)) return false;
      if (startDate && new Date(log.timestamp) < new Date(startDate)) return false;
      if (endDate && new Date(log.timestamp) > new Date(endDate + 'T23:59:59')) return false;
      return true;
    }).sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'userName':
          comparison = a.userName.localeCompare(b.userName);
          break;
        case 'action':
          comparison = a.action.localeCompare(b.action);
          break;
        case 'entityType':
          comparison = a.entityType.localeCompare(b.entityType);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [mappedLogs, selectedUserId, selectedAction, selectedEntity, startDate, endDate, sortField, sortDirection]);

  // Refetch when filters change
  useEffect(() => {
    if (companyId) {
      refetch({
        user_id: selectedUserId !== 'all' ? selectedUserId : undefined,
        action: selectedAction !== 'all' ? selectedAction : undefined,
        table_name: selectedEntity !== 'all' ? selectedEntity : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
    }
  }, [companyId, selectedUserId, selectedAction, selectedEntity, startDate, endDate, refetch]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const startItem = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredLogs.length);
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Data/Hora', 'Usuário', 'Email', 'Ação', 'Entidade', 'Nome', 'Detalhes', 'IP'];
    const rows = filteredLogs.map(log => [
      log.timestamp.toISOString(),
      log.userName,
      log.userEmail,
      ACTION_LABELS[log.action] || log.action,
      log.entityType,
      log.entityName,
      log.details,
      log.ip,
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    alert('Exportação PDF será implementada com biblioteca de geração de PDF');
    setIsExportMenuOpen(false);
  };

  const clearFilters = () => {
    setSelectedUserId('all');
    setSelectedAction('all');
    setSelectedEntity('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedUserId !== 'all' || selectedAction !== 'all' || selectedEntity !== 'all' || startDate || endDate;

  // Get unique users for filter
  const userOptions = useMemo(() => {
    const names = new Set<string>();
    userMap.forEach(u => names.add(u.name));
    return ['all', ...Array.from(names)];
  }, [userMap]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
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
                Registro completo de todas as ações e acessos no sistema
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-sm font-medium text-[var(--color-accent)]">
                {loading ? 'Carregando...' : `${filteredLogs.length} registros`}
              </span>
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
                {isExportMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 z-50 w-48 rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-1 shadow-lg"
                  >
                    <button
                      onClick={handleExportCSV}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-fg-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-green-400" />
                      Exportar CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-fg-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <File className="h-4 w-4 text-red-400" />
                      Exportar PDF
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
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
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{loading ? '-' : filteredLogs.length}</p>
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
                    <Plus className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                      {loading ? '-' : filteredLogs.filter(l => l.action === 'create' || l.action === 'campaign_created').length}
                    </p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Ações de criação</p>
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10">
                    <Download className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                      {loading ? '-' : filteredLogs.filter(l => l.action === 'export' || l.action === 'report_exported').length}
                    </p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Exportações</p>
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-500/10">
                    <Eye className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                      {loading ? '-' : filteredLogs.filter(l => l.action === 'view' || l.action === 'data_access').length}
                    </p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Acessos a dados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Retention Policy Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <Card className="border-[var(--color-noir-700)] bg-gradient-to-r from-[var(--color-surface-1)] to-[var(--color-surface-2)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                    <Shield className="h-6 w-6 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
                      Política de Retenção
                    </h3>
                    <p className="text-sm text-[var(--color-fg-secondary)]">
                      Os logs são retidos por {RETENTION_DAYS} dias para conformidade regulatória
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Período de retenção</p>
                    <p className="font-display text-xl font-bold text-[var(--color-accent)]">{RETENTION_DAYS} dias</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Logs mais antigos de</p>
                    <p className="font-display text-sm font-medium text-[var(--color-fg-primary)]">
                      {RETENTION_DATE.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1">
                    <Clock className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Ativo</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
              <span className="text-sm font-medium text-[var(--color-fg-primary)]">Filtros</span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-2 text-xs text-[var(--color-accent)] hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--color-fg-tertiary)]">Data inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="h-9 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--color-fg-tertiary)]">Data final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="h-9 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--color-fg-tertiary)]">Usuário</label>
                <select
                  value={selectedUserId}
                  onChange={e => { setSelectedUserId(e.target.value); setCurrentPage(1); }}
                  className="h-9 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none min-w-[160px]"
                >
                  <option value="all">Todos</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--color-fg-tertiary)]">Tipo de ação</label>
                <select
                  value={selectedAction}
                  onChange={e => { setSelectedAction(e.target.value); setCurrentPage(1); }}
                  className="h-9 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none min-w-[160px]"
                >
                  {ACTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--color-fg-tertiary)]">Tabela</label>
                <select
                  value={selectedEntity}
                  onChange={e => { setSelectedEntity(e.target.value); setCurrentPage(1); }}
                  className="h-9 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none min-w-[140px]"
                >
                  {ENTITY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-surface-2)]">
                <tr>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider hover:text-[var(--color-accent)] transition-colors"
                    onClick={() => handleSort('timestamp')}
                  >
                    <div className="flex items-center gap-1">
                      Data/Hora
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider hover:text-[var(--color-accent)] transition-colors"
                    onClick={() => handleSort('userName')}
                  >
                    <div className="flex items-center gap-1">
                      Usuário
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider hover:text-[var(--color-accent)] transition-colors"
                    onClick={() => handleSort('action')}
                  >
                    <div className="flex items-center gap-1">
                      Ação
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider hover:text-[var(--color-accent)] transition-colors"
                    onClick={() => handleSort('entityType')}
                  >
                    <div className="flex items-center gap-1">
                      Entidade
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Detalhes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-noir-700)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-fg-secondary)]">
                      Carregando logs de auditoria...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <FileText className="h-12 w-12 text-[var(--color-fg-muted)] mx-auto mb-4" />
                      <p className="text-[var(--color-fg-secondary)]">Nenhum registro encontrado</p>
                      <p className="text-sm text-[var(--color-fg-muted)]">Tente ajustar os filtros de busca</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.slice(startItem - 1, endItem).map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[var(--color-surface-2)]/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                            {log.timestamp.toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-[var(--color-fg-muted)]">
                            {log.timestamp.toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-sm font-medium text-[var(--color-accent)]">
                            {log.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--color-fg-primary)]">{log.userName}</p>
                            <p className="text-xs text-[var(--color-fg-muted)]">{log.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                          ACTION_COLORS[log.action] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        )}>
                          {ACTION_ICONS[log.action] || <Eye className="h-3 w-3" />}
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-[var(--color-fg-primary)]">{log.entityName}</p>
                          <p className="text-xs text-[var(--color-fg-muted)] capitalize">{log.entityType}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--color-fg-secondary)] max-w-xs">
                        <span className="line-clamp-2">{log.details}</span>
                      </td>
                      <td className="px-4 py-4">
                        <code className="text-xs text-[var(--color-fg-muted)] bg-[var(--color-surface-2)] px-2 py-1 rounded font-mono">
                          {log.ip}
                        </code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
            <span className="text-sm text-[var(--color-fg-muted)]">
              {loading ? 'Carregando...' : `Mostrando ${filteredLogs.length > 0 ? startItem : 0}-${endItem} de ${filteredLogs.length} registros`}
            </span>

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
              <span className="text-sm text-[var(--color-fg-primary)] px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
import { useState, useMemo } from 'react';
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

const ACTION_LABELS: Record<ActionType, string> = {
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

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
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

const ACTION_COLORS: Record<ActionType, string> = {
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

const MOCK_LOGS: AuditLogEntry[] = [
  { id: '1', timestamp: new Date('2026-04-24T09:15:00'), userName: 'Ana Silva', userEmail: 'ana.silva@empresa.com', action: 'login', entityType: 'user', entityName: 'Sistema', details: 'Login no sistema', ip: '192.168.1.45' },
  { id: '2', timestamp: new Date('2026-04-24T09:22:00'), userName: 'Carlos Santos', userEmail: 'carlos.santos@empresa.com', action: 'campaign_created', entityType: 'campaign', entityName: 'Black Friday 2026', details: 'Campanha "Black Friday 2026" criada com template de phishing padrão', ip: '192.168.1.102', newData: { template: 'phishing_default', target_count: 150 } },
  { id: '3', timestamp: new Date('2026-04-24T09:30:00'), userName: 'Ana Silva', userEmail: 'ana.silva@empresa.com', action: 'data_access', entityType: 'report', entityName: 'Relatório Exec Q1', details: 'Visualizou relatório executivo do Q1 2026', ip: '192.168.1.45' },
  { id: '4', timestamp: new Date('2026-04-24T09:45:00'), userName: 'Maria Oliveira', userEmail: 'maria.oliveira@empresa.com', action: 'user_added', entityType: 'group', entityName: 'Marketing', details: 'Usuário joao.costa@empresa.com adicionado ao grupo Marketing', ip: '192.168.1.78', newData: { role: 'member', groups: ['Marketing'] } },
  { id: '5', timestamp: new Date('2026-04-24T10:00:00'), userName: 'Carlos Santos', userEmail: 'carlos.santos@empresa.com', action: 'view', entityType: 'campaign', entityName: 'Recall LGPD', details: 'Visualizou detalhes da campanha Recall LGPD', ip: '192.168.1.102' },
  { id: '6', timestamp: new Date('2026-04-24T10:12:00'), userName: 'Ana Silva', userEmail: 'ana.silva@empresa.com', action: 'campaign_launched', entityType: 'campaign', entityName: 'Reminder LGPD', details: 'Campanha "Reminder LGPD" iniciada para 45 usuários', ip: '192.168.1.45', newData: { recipients: 45, scheduled: false } },
  { id: '7', timestamp: new Date('2026-04-24T10:30:00'), userName: 'Roberto Lima', userEmail: 'roberto.lima@empresa.com', action: 'export', entityType: 'report', entityName: 'Relatório Executivo', details: 'Relatório executivo - Abril 2026 exportado em PDF', ip: '192.168.1.200', newData: { format: 'pdf', date_range: '2026-04-01_2026-04-30' } },
  { id: '8', timestamp: new Date('2026-04-24T10:45:00'), userName: 'Paula Souza', userEmail: 'paula.souza@empresa.com', action: 'update', entityType: 'settings', entityName: 'Notificações', details: 'Configuração de notificação por email alterada', ip: '192.168.1.33', oldData: { email_notifications: true, frequency: 'daily' }, newData: { email_notifications: true, frequency: 'weekly' } },
  { id: '9', timestamp: new Date('2026-04-24T11:00:00'), userName: 'João Costa', userEmail: 'joao.costa@empresa.com', action: 'logout', entityType: 'user', entityName: 'Sistema', details: 'Logout do sistema', ip: '192.168.1.88' },
  { id: '10', timestamp: new Date('2026-04-24T11:15:00'), userName: 'Carlos Santos', userEmail: 'carlos.santos@empresa.com', action: 'campaign_created', entityType: 'campaign', entityName: 'Phishing Teste Q1', details: 'Campanha "Phishing Teste Q1" criada', ip: '192.168.1.102', newData: { template: ' Spear phishing', target_count: 20 } },
  { id: '11', timestamp: new Date('2026-04-24T11:30:00'), userName: 'Ana Silva', userEmail: 'ana.silva@empresa.com', action: 'view', entityType: 'user', entityName: 'Lista de Usuários', details: 'Acessou lista completa de usuários do sistema', ip: '192.168.1.45' },
  { id: '12', timestamp: new Date('2026-04-24T12:00:00'), userName: 'Maria Oliveira', userEmail: 'maria.oliveira@empresa.com', action: 'export', entityType: 'report', entityName: 'Métricas Detalhadas', details: 'Exportou relatório de métricas detalhado em CSV', ip: '192.168.1.78', newData: { format: 'csv', type: 'metrics' } },
  { id: '13', timestamp: new Date('2026-04-24T12:30:00'), userName: 'Roberto Lima', userEmail: 'roberto.lima@empresa.com', action: 'user_added', entityType: 'group', entityName: 'Administradores', details: 'Usuário fernanda.rocha@empresa.com adicionado ao grupo Administradores', ip: '192.168.1.200', newData: { role: 'admin', groups: ['Administradores'] } },
  { id: '14', timestamp: new Date('2026-04-24T13:00:00'), userName: 'Paula Souza', userEmail: 'paula.souza@empresa.com', action: 'data_access', entityType: 'template', entityName: 'Template Banco', details: 'Acessou template de email "Banco Fake"', ip: '192.168.1.33' },
  { id: '15', timestamp: new Date('2026-04-24T13:30:00'), userName: 'Carlos Santos', userEmail: 'carlos.santos@empresa.com', action: 'campaign_archived', entityType: 'campaign', entityName: 'Natal 2025', details: 'Campanha "Natal 2025" arquivada', ip: '192.168.1.102' },
  { id: '16', timestamp: new Date('2026-04-23T08:00:00'), userName: 'Roberto Lima', userEmail: 'roberto.lima@empresa.com', action: 'login', entityType: 'user', entityName: 'Sistema', details: 'Login no sistema', ip: '192.168.1.200' },
  { id: '17', timestamp: new Date('2026-04-23T08:30:00'), userName: 'Ana Silva', userEmail: 'ana.silva@empresa.com', action: 'update', entityType: 'settings', entityName: 'Limite de Emails', details: 'Limite de emails diários alterado para 500', ip: '192.168.1.45', oldData: { daily_limit: 100 }, newData: { daily_limit: 500 } },
  { id: '18', timestamp: new Date('2026-04-23T09:15:00'), userName: 'Paula Souza', userEmail: 'paula.souza@empresa.com', action: 'campaign_launched', entityType: 'campaign', entityName: 'Update Financeiro', details: 'Campanha "Update Financeiro" iniciada', ip: '192.168.1.33' },
  { id: '19', timestamp: new Date('2026-04-23T09:45:00'), userName: 'João Costa', userEmail: 'joao.costa@empresa.com', action: 'data_access', entityType: 'report', entityName: 'Dashboard', details: 'Acessou dashboard principal', ip: '192.168.1.88' },
  { id: '20', timestamp: new Date('2026-04-23T10:00:00'), userName: 'Carlos Santos', userEmail: 'carlos.santos@empresa.com', action: 'create', entityType: 'template', entityName: 'Novo Template', details: 'Criou novo template de email "Verificação de Segurança"', ip: '192.168.1.102', newData: { category: 'security', fields: ['name', 'url'] } },
  { id: '21', timestamp: new Date('2026-04-23T10:30:00'), userName: 'Maria Oliveira', userEmail: 'maria.oliveira@empresa.com', action: 'export', entityType: 'user', entityName: 'Lista de Usuários', details: 'Exportação de lista de usuários em CSV', ip: '192.168.1.78', newData: { format: 'csv', count: 85 } },
  { id: '22', timestamp: new Date('2026-04-23T11:00:00'), userName: 'Roberto Lima', userEmail: 'roberto.lima@empresa.com', action: 'report_exported', entityType: 'report', entityName: 'Treinamento', details: 'Relatório de treinamento exportado', ip: '192.168.1.200' },
  { id: '23', timestamp: new Date('2026-04-22T14:20:00'), userName: 'Ana Silva', userEmail: 'ana.silva@empresa.com', action: 'user_removed', entityType: 'group', entityName: 'Marketing', details: 'Usuário pedro.alves@empresa.com removido do grupo Marketing', ip: '192.168.1.45', oldData: { groups: ['Marketing'] } },
  { id: '24', timestamp: new Date('2026-04-22T15:00:00'), userName: 'Roberto Lima', userEmail: 'roberto.lima@empresa.com', action: 'campaign_launched', entityType: 'campaign', entityName: 'Recall de Política', details: 'Campanha "Recall de Política" iniciada', ip: '192.168.1.200' },
  { id: '25', timestamp: new Date('2026-04-22T15:30:00'), userName: 'Carlos Santos', userEmail: 'carlos.santos@empresa.com', action: 'update', entityType: 'template', entityName: 'Template Padrão', details: 'Template de email padrão alterado', ip: '192.168.1.102', oldData: { logo: 'old_logo.png' }, newData: { logo: 'new_logo.png' } },
];

const USERS = ['Todos', 'Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Costa', 'Paula Souza', 'Roberto Lima'];
const ACTION_TYPES: { value: ActionType | 'all'; label: string }[] = [
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
const ENTITY_TYPES: { value: EntityType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as entidades' },
  { value: 'campaign', label: 'Campanha' },
  { value: 'user', label: 'Usuário' },
  { value: 'report', label: 'Relatório' },
  { value: 'settings', label: 'Configuração' },
  { value: 'template', label: 'Template' },
  { value: 'group', label: 'Grupo' },
];

type SortField = 'timestamp' | 'userName' | 'action' | 'entityType';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;
const RETENTION_DAYS = 365;
const RETENTION_DATE = new Date();
RETENTION_DATE.setDate(RETENTION_DATE.getDate() - RETENTION_DAYS);

export default function AuditLogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState('Todos');
  const [selectedAction, setSelectedAction] = useState<ActionType | 'all'>('all');
  const [selectedEntity, setSelectedEntity] = useState<EntityType | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const filteredLogs = useMemo(() => {
    return MOCK_LOGS.filter(log => {
      if (selectedUser !== 'Todos' && log.userName !== selectedUser) return false;
      if (selectedAction !== 'all' && log.action !== selectedAction) return false;
      if (selectedEntity !== 'all' && log.entityType !== selectedEntity) return false;
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
  }, [selectedUser, selectedAction, selectedEntity, startDate, endDate, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
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
      ACTION_LABELS[log.action],
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
    setSelectedUser('Todos');
    setSelectedAction('all');
    setSelectedEntity('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedUser !== 'Todos' || selectedAction !== 'all' || selectedEntity !== 'all' || startDate || endDate;

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
                {filteredLogs.length} registros
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
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{filteredLogs.length}</p>
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
                      {filteredLogs.filter(l => l.action === 'create' || l.action === 'campaign_created').length}
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
                      {filteredLogs.filter(l => l.action === 'export' || l.action === 'report_exported').length}
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
                      {filteredLogs.filter(l => l.action === 'view' || l.action === 'data_access').length}
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
                  value={selectedUser}
                  onChange={e => { setSelectedUser(e.target.value); setCurrentPage(1); }}
                  className="h-9 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none min-w-[160px]"
                >
                  {USERS.map(user => (
                    <option key={user} value={user === 'Todos' ? 'all' : user}>{user}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--color-fg-tertiary)]">Tipo de ação</label>
                <select
                  value={selectedAction}
                  onChange={e => { setSelectedAction(e.target.value as ActionType | 'all'); setCurrentPage(1); }}
                  className="h-9 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none min-w-[160px]"
                >
                  {ACTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--color-fg-tertiary)]">Entidade</label>
                <select
                  value={selectedEntity}
                  onChange={e => { setSelectedEntity(e.target.value as EntityType | 'all'); setCurrentPage(1); }}
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
                {filteredLogs.slice(startItem - 1, endItem).map((log) => (
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
                        ACTION_COLORS[log.action]
                      )}>
                        {ACTION_ICONS[log.action]}
                        {ACTION_LABELS[log.action]}
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
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-[var(--color-fg-muted)] mb-4" />
              <p className="text-[var(--color-fg-secondary)]">Nenhum registro encontrado</p>
              <p className="text-sm text-[var(--color-fg-muted)]">Tente ajustar os filtros de busca</p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
            <span className="text-sm text-[var(--color-fg-muted)]">
              Mostrando {startItem}-{endItem} de {filteredLogs.length} registros
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
                {currentPage} / {totalPages || 1}
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
import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Mail,
  Trash2,
  Edit,
  Download,
  RefreshCw,
  UserPlus,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'learner';
  status: 'active' | 'inactive' | 'pending';
  department: string;
  risk: 'high' | 'medium' | 'low';
  lastActivity: string;
  createdAt: string;
  trainingCompleted: number;
  trainingTotal: number;
}

// Generate realistic mock data
function generateMockUsers(count: number): User[] {
  const names = [
    'Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Costa', 'Paula Souza',
    'Roberto Lima', 'Fernanda Alves', 'Marcelo Ferreira', 'Juliana Pereira',
    'Ricardo Gomes', 'Camila Rodrigues', 'Diego Martins', 'Beatriz Rocha',
    'Fernando Castro', 'Isabella Ramos', 'Lucas Barbosa', 'Manuela Lopes',
    'Thiago Mendes', 'CarolinaNovaes', 'André Ribeiro', 'Larissa Cardoso',
    'Gustavo Hayes', 'MarianaCorreia', 'Pedro Henrique Machado', 'Adriana Vieira'
  ];
  const departments = ['TI', 'Financeiro', 'RH', 'Comercial', 'Marketing', 'Operações', 'Jurídico'];
  const roles: User['role'][] = ['admin', 'manager', 'learner'];
  const statuses: User['status'][] = ['active', 'active', 'active', 'inactive', 'pending'];
  const risks: User['risk'][] = ['low', 'low', 'medium', 'medium', 'high'];

  return Array.from({ length: count }, (_, i) => {
    const name = names[Math.floor(Math.random() * names.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const risk = risks[Math.floor(Math.random() * risks.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const trainingCompleted = Math.floor(Math.random() * 8);
    const trainingTotal = 8;
    const daysAgo = Math.floor(Math.random() * 60);

    return {
      id: `user-${i + 1}`,
      name: `${name} ${String(i + 1).padStart(3, '0')}`,
      email: `${name.toLowerCase().replace(' ', '.')}${i + 1}@empresa.com`,
      role,
      status,
      department,
      risk,
      lastActivity: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - (daysAgo + 30) * 24 * 60 * 60 * 1000).toISOString(),
      trainingCompleted,
      trainingTotal,
    };
  });
}

const ALL_USERS = generateMockUsers(1247);

type SortField = 'name' | 'email' | 'role' | 'status' | 'department' | 'risk' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

const STATUS_CONFIG = {
  active: { label: 'Ativo', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  inactive: { label: 'Inativo', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  pending: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
} as const;

const RISK_CONFIG = {
  high: { label: 'Alto', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle },
  medium: { label: 'Médio', color: 'bg-amber-500/20 text-amber-400', icon: AlertTriangle },
  low: { label: 'Baixo', color: 'bg-green-500/20 text-green-400', icon: Shield },
} as const;

const ROLE_CONFIG = {
  admin: { label: 'Admin', color: 'bg-purple-500/20 text-purple-400' },
  manager: { label: 'Gestor', color: 'bg-blue-500/20 text-blue-400' },
  learner: { label: 'Usuário', color: 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]' },
} as const;

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

interface SortIconProps {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}

function SortIcon({ field, sortField, sortDirection }: SortIconProps) {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
}

export default function UsersPage() {
  const navigate = useNavigate();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<User['status'] | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<User['risk'] | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'all'>('all');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Filters visibility
  const [showFilters, setShowFilters] = useState(false);

  // Selection state for bulk actions
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Bulk action dialog
  const [bulkActionDialog, setBulkActionDialog] = useState<'delete' | 'training' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(ALL_USERS.map(u => u.department));
    return Array.from(depts).sort();
  }, []);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let result = [...ALL_USERS];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(u => u.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      result = result.filter(u => u.department === departmentFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      result = result.filter(u => u.risk === riskFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: string | number, bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'role':
          aVal = a.role;
          bVal = b.role;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'department':
          aVal = a.department;
          bVal = b.department;
          break;
        case 'risk': {
          const riskOrder = { high: 3, medium: 2, low: 1 };
          aVal = riskOrder[a.risk];
          bVal = riskOrder[b.risk];
          break;
        }
        case 'lastActivity':
          aVal = new Date(a.lastActivity).getTime();
          bVal = new Date(b.lastActivity).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [searchQuery, statusFilter, departmentFilter, riskFilter, roleFilter, sortField, sortDirection]);

  // Pagination
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Sort handler
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setRiskFilter('all');
    setRoleFilter('all');
    setCurrentPage(1);
  }, []);

  // Selection helpers
  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  }, [paginatedUsers, selectedUsers.size]);

  // Bulk actions
  const handleBulkDelete = useCallback(async () => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setSelectedUsers(new Set());
    setBulkActionDialog(null);
  }, []);

  const handleBulkAssignTraining = useCallback(async () => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setSelectedUsers(new Set());
    setBulkActionDialog(null);
  }, []);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || departmentFilter !== 'all' || riskFilter !== 'all' || roleFilter !== 'all';

  // Stats for summary cards
  const totalUsers = ALL_USERS.length;
  const activeUsers = ALL_USERS.filter(u => u.status === 'active').length;
  const highRiskUsers = ALL_USERS.filter(u => u.risk === 'high').length;
  const pendingUsers = ALL_USERS.filter(u => u.status === 'pending').length;

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
              Pessoas
            </h1>
            <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
              Gerencie usuários, permissões e treinamento
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/usuarios/importar')}>
              <Download className="h-4 w-4" />
              Importar CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/usuarios/grupos')}>
              <Shield className="h-4 w-4" />
              Departamentos
            </Button>
            <Button variant="primary" size="sm" onClick={() => {}}>
              <UserPlus className="h-4 w-4" />
              Convidar usuário
            </Button>
          </div>
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
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{totalUsers.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Total de usuários</p>
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
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{activeUsers.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Usuários ativos</p>
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
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{highRiskUsers}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Alto risco</p>
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
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{pendingUsers}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-center justify-between rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-4 py-3"
          >
            <span className="text-sm font-medium text-[var(--color-fg-primary)]">
              {selectedUsers.size} usuário(s) selecionado(s)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setBulkActionDialog('training')}
              >
                <GraduationCap className="h-4 w-4" />
                Atribuir treinamento
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkActionDialog('delete')}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsers(new Set())}
              >
                <XCircle className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-4"
      >
        <div className="flex flex-col gap-4">
          {/* Search and filter toggle row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
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
                  {(statusFilter !== 'all' ? 1 : 0) + (departmentFilter !== 'all' ? 1 : 0) + (riskFilter !== 'all' ? 1 : 0) + (roleFilter !== 'all' ? 1 : 0)}
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

          {/* Expandable filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4">
                  {/* Status filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">Status:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'pending'); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="pending">Pendente</option>
                    </select>
                  </div>

                  {/* Department filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">Departamento:</label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => { setDepartmentFilter(e.target.value); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Risk filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">Risco:</label>
                    <select
                      value={riskFilter}
                      onChange={(e) => { setRiskFilter(e.target.value as 'all' | 'high' | 'medium' | 'low'); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="high">Alto</option>
                      <option value="medium">Médio</option>
                      <option value="low">Baixo</option>
                    </select>
                  </div>

                  {/* Role filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">Função:</label>
                    <select
                      value={roleFilter}
                      onChange={(e) => { setRoleFilter(e.target.value as 'all' | 'admin' | 'manager' | 'learner'); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Gestor</option>
                      <option value="learner">Usuário</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Users Table */}
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
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={toggleAllSelection}
                    className="h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
                  />
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Nome
                    <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('department')}
                >
                  <div className="flex items-center gap-1">
                    Departamento
                    <SortIcon field="department" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    Função
                    <SortIcon field="role" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('risk')}
                >
                  <div className="flex items-center gap-1">
                    Risco
                    <SortIcon field="risk" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('lastActivity')}
                >
                  <div className="flex items-center gap-1">
                    Última atividade
                    <SortIcon field="lastActivity" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-noir-700)]">
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className={cn(
                    'hover:bg-[var(--color-surface-2)]/50 transition-colors',
                    selectedUsers.has(user.id) && 'bg-[var(--color-accent-subtle)]'
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/app/usuarios/${user.id}`}
                      className="flex items-center gap-3 hover:text-[var(--color-accent)]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)]/10 font-display text-sm text-[var(--color-accent)]">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-fg-primary)]">{user.name}</p>
                        <p className="text-xs text-[var(--color-fg-muted)]">{user.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-fg-secondary)]">
                    {user.department}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-medium', ROLE_CONFIG[user.role].color)}>
                      {ROLE_CONFIG[user.role].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', RISK_CONFIG[user.risk].color)}>
                      {(() => {
                        const Icon = RISK_CONFIG[user.risk].icon;
                        return <Icon className="h-3 w-3" />;
                      })()}
                      {RISK_CONFIG[user.risk].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', STATUS_CONFIG[user.status].color)}>
                      {(() => {
                        const Icon = STATUS_CONFIG[user.status].icon;
                        return <Icon className="h-3 w-3" />;
                      })()}
                      {STATUS_CONFIG[user.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-fg-muted)]">
                    {new Date(user.lastActivity).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => navigate(`/app/usuarios/${user.id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {}}>
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Atribuir treinamento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {}}>
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-[var(--color-danger)]">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-fg-muted)]">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems.toLocaleString('pt-BR')} resultados
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

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkActionDialog === 'delete'} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir usuários</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {selectedUsers.size} usuário(s)? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBulkActionDialog(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} isLoading={isProcessing}>
              Excluir {selectedUsers.size} usuário(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Training Dialog */}
      <Dialog open={bulkActionDialog === 'training'} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir treinamento</DialogTitle>
            <DialogDescription>
              Selecione o treinamento para atribuir a {selectedUsers.size} usuário(s).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <select className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none">
              <option value="">Selecione um treinamento...</option>
              <option value="basic">Phishing Awareness - Básico</option>
              <option value="intermediate">Phishing Awareness - Intermediário</option>
              <option value="advanced">Phishing Awareness - Avançado</option>
              <option value="spear">Spear Phishing</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBulkActionDialog(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleBulkAssignTraining} isLoading={isProcessing}>
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

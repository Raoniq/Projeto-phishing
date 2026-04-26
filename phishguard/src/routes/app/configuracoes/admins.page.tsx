import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Mail,
  Shield,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserPlus,
  CheckCircle,
  Clock,
  XCircle,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import {
  type Role,
  CAMPAIGN_APPROVAL_REQUIRED_ADMINS,
} from '@/lib/rbac';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive' | 'pending';
  department: string;
  lastLogin: string;
  createdAt: string;
  permissions: string[];
  approvalsGiven: number;
}

const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: typeof Shield }> = {
  super_admin: { label: 'Super Admin', color: 'bg-red-500/20 text-red-400', icon: Crown },
  admin: { label: 'Admin', color: 'bg-purple-500/20 text-purple-400', icon: Shield },
  manager: { label: 'Gerente', color: 'bg-blue-500/20 text-blue-400', icon: Shield },
  viewer: { label: 'Visualizador', color: 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]', icon: Shield },
};

const STATUS_CONFIG = {
  active: { label: 'Ativo', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  inactive: { label: 'Inativo', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  pending: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
} as const;

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

type SortField = 'name' | 'email' | 'role' | 'status' | 'department' | 'lastLogin';
type SortDirection = 'asc' | 'desc';

// SortIcon component extracted outside to avoid static-components lint error
function SortIconComponent({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
}

export default function AdminsPage() {
  const { company } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch admins from Supabase
  useEffect(() => {
    if (!company?.id) {
      setAdmins([]);
      setLoading(false);
      return;
    }

    const fetchAdmins = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role, department, last_login_at, created_at')
          .eq('company_id', company.id)
          .in('role', ['super_admin', 'admin', 'manager', 'viewer']);

        if (error) throw error;

        const mapped: Admin[] = (data || []).map(u => ({
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          role: u.role as Role,
          status: u.last_login_at ? 'active' : 'pending',
          department: u.department || 'Não definido',
          lastLogin: u.last_login_at || '',
          createdAt: u.created_at,
          permissions: [],
          approvalsGiven: 0,
        }));

        setAdmins(mapped);
      } catch (err) {
        console.error('[AdminsPage] Failed to fetch admins:', err);
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, [company]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Admin['status'] | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters visibility
  const [showFilters, setShowFilters] = useState(false);

  // Selection state
  const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(new Set());

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('viewer');

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(admins.map(a => a.department));
    return Array.from(depts).sort();
  }, [admins]);

  // Filter and sort admins
  const filteredAdmins = useMemo(() => {
    let result = [...admins];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter);
    }

    if (departmentFilter !== 'all') {
      result = result.filter(a => a.department === departmentFilter);
    }

    if (roleFilter !== 'all') {
      result = result.filter(a => a.role === roleFilter);
    }

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
        case 'role': {
          const roleOrder = { super_admin: 4, admin: 3, manager: 2, viewer: 1 };
          aVal = roleOrder[a.role];
          bVal = roleOrder[b.role];
          break;
        }
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'department':
          aVal = a.department;
          bVal = b.department;
          break;
        case 'lastLogin':
          aVal = new Date(a.lastLogin).getTime();
          bVal = new Date(b.lastLogin).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [searchQuery, statusFilter, departmentFilter, roleFilter, sortField, sortDirection]);

  // Pagination
  const totalItems = filteredAdmins.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAdmins.slice(start, start + itemsPerPage);
  }, [filteredAdmins, currentPage, itemsPerPage]);

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setRoleFilter('all');
    setCurrentPage(1);
  }, []);

  const toggleAdminSelection = useCallback((adminId: string) => {
    setSelectedAdmins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(adminId)) {
        newSet.delete(adminId);
      } else {
        newSet.add(adminId);
      }
      return newSet;
    });
  }, []);

  const handleInvite = useCallback(async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setInviteDialogOpen(false);
    setInviteEmail('');
    setInviteRole('viewer');
  }, []);

  const handleRoleChange = useCallback(async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setRoleDialogOpen(false);
    setSelectedAdmin(null);
  }, []);

  const handleRemove = useCallback(async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setRemoveDialogOpen(false);
    setSelectedAdmin(null);
    setSelectedAdmins(new Set());
  }, []);

  const openRoleDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setRoleDialogOpen(true);
  };

  const openRemoveDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setRemoveDialogOpen(true);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || departmentFilter !== 'all' || roleFilter !== 'all';

  // Stats
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter(a => a.status === 'active').length;
  const superAdmins = admins.filter(a => a.role === 'super_admin').length;
  const pendingAdmins = admins.filter(a => a.status === 'pending').length;

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
              Administradores
            </h1>
            <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
              Gerencie administradores e permissões do sistema
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Convidar administrador
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
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{totalAdmins}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Total de admins</p>
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
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{activeAdmins}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Ativos</p>
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
                  <Crown className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{superAdmins}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Super admins</p>
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
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{pendingAdmins}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Pendentes</p>
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
                  {(statusFilter !== 'all' ? 1 : 0) + (departmentFilter !== 'all' ? 1 : 0) + (roleFilter !== 'all' ? 1 : 0)}
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

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">Função:</label>
                    <select
                      value={roleFilter}
                      onChange={(e) => { setRoleFilter(e.target.value as 'all' | 'super_admin' | 'admin' | 'manager' | 'viewer'); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Gerente</option>
                      <option value="viewer">Visualizador</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Admins Table */}
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
                    className="h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
                  />
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Nome
                    <SortIconComponent field="name" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('department')}
                >
                  <div className="flex items-center gap-1">
                    Departamento
                    <SortIconComponent field="department" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    Função
                    <SortIconComponent field="role" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <SortIconComponent field="status" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                  Aprovações
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                  onClick={() => handleSort('lastLogin')}
                >
                  <div className="flex items-center gap-1">
                    Último acesso
                    <SortIconComponent field="lastLogin" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-noir-700)]">
              {paginatedAdmins.map((admin) => (
                <tr
                  key={admin.id}
                  className="hover:bg-[var(--color-surface-2)]/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedAdmins.has(admin.id)}
                      onChange={() => toggleAdminSelection(admin.id)}
                      className="h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)]/10 font-display text-sm text-[var(--color-accent)]">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-fg-primary)]">{admin.name}</p>
                        <p className="text-xs text-[var(--color-fg-muted)]">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-fg-secondary)]">
                    {admin.department}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', ROLE_CONFIG[admin.role].color)}>
                      {(() => {
                        const Icon = ROLE_CONFIG[admin.role].icon;
                        return <Icon className="h-3 w-3" />;
                      })()}
                      {ROLE_CONFIG[admin.role].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', STATUS_CONFIG[admin.status].color)}>
                      {(() => {
                        const Icon = STATUS_CONFIG[admin.status].icon;
                        return <Icon className="h-3 w-3" />;
                      })()}
                      {STATUS_CONFIG[admin.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-[var(--color-noir-700)] overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${(admin.approvalsGiven / CAMPAIGN_APPROVAL_REQUIRED_ADMINS) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--color-fg-muted)]">
                        {admin.approvalsGiven}/{CAMPAIGN_APPROVAL_REQUIRED_ADMINS}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-fg-muted)]">
                    {new Date(admin.lastLogin).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openRoleDialog(admin)}>
                          <Shield className="mr-2 h-4 w-4" />
                          Alterar função
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {}}>
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-[var(--color-danger)]"
                          onClick={() => openRemoveDialog(admin)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
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
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} resultados
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

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar administrador</DialogTitle>
            <DialogDescription>
              Envie um convite para um novo administrador acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="admin@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                Função
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="viewer">Visualizador</option>
                <option value="manager">Gerente</option>
                <option value="admin">Administrador</option>
                <option value="super_admin">Super Administrador</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleInvite} isLoading={isProcessing}>
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar função</DialogTitle>
            <DialogDescription>
              Alterar a função de {selectedAdmin?.name}. Esta ação afetará as permissões do administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
              Nova função
            </label>
            <select
              value={selectedAdmin?.role}
              onChange={(e) => setSelectedAdmin(prev => prev ? { ...prev, role: e.target.value as Role } : null)}
              className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="viewer">Visualizador</option>
              <option value="manager">Gerente</option>
              <option value="admin">Administrador</option>
              <option value="super_admin">Super Administrador</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleRoleChange} isLoading={isProcessing}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover administrador</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover {selectedAdmin?.name}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRemoveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemove} isLoading={isProcessing}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
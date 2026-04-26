/* eslint-disable react-hooks/set-state-in-effect */
// routes/app/admin/usuarios/page.tsx — User Management System
import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  Clock,
  AlertCircle,
  X,
  CheckCircle2,
  XCircle,
  Mail,
  Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import { useUsers } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type UserRole = 'admin' | 'member' | 'viewer';
type UserStatus = 'active' | 'suspended';

type User = Database['public']['Tables']['users']['Row'] & {
  status?: UserStatus;
  last_login_at?: string;
  department?: string;
};

// Role configuration
const ROLE_CONFIG = {
  admin: {
    label: 'Administrador',
    color: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
    icon: Shield },
  member: {
    label: 'Membro',
    color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    icon: Users },
  viewer: {
    label: 'Visualizador',
    color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    icon: Clock } } as const;

// Status configuration
const STATUS_CONFIG = {
  active: {
    label: 'Ativo',
    color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  suspended: {
    label: 'Suspenso',
    color: 'bg-red-500/20 text-red-400 border border-red-500/30' } } as const;

const ITEMS_PER_PAGE = 20;

// Toast notification component
function Toast({
  message,
  type,
  onClose }: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl border',
        type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
      )}
    >
      {type === 'success' ? (
        <CheckCircle2 className="h-5 w-5" />
      ) : (
        <XCircle className="h-5 w-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// Confirmation dialog component
function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading,
  confirmLabel = 'Confirmar',
  variant = 'destructive' }: {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  confirmLabel?: string;
  variant?: 'destructive' | 'primary';
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit User Modal
function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
  isSaving }: {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { role: UserRole; department?: string }) => void;
  isSaving: boolean;
}) {
  const [role, setRole] = useState<UserRole>('member');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    if (user) {
      setRole(user.role as UserRole);
      setDepartment(user.department || '');
    }
  }, [user]);

  const handleSave = useCallback(() => {
    onSave({ role, department: department || undefined });
  }, [role, department, onSave]);

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-[var(--color-accent)]" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription>
            Altere as informações do usuário abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name (readonly) */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
              Nome
            </label>
            <input
              type="text"
              value={user.name || ''}
              disabled
              className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-4 text-sm text-[var(--color-fg-muted)] cursor-not-allowed"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-4 text-sm text-[var(--color-fg-muted)] cursor-not-allowed"
            />
          </div>

          {/* Role select */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
              Função
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="h-10 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 pr-10 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
              >
                <option value="admin">Administrador</option>
                <option value="member">Membro</option>
                <option value="viewer">Visualizador</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-[var(--color-fg-muted)]" />
              </div>
            </div>
            {/* Role description */}
            <div className={cn('mt-2 rounded-lg p-3 border', ROLE_CONFIG[role].color)}>
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = ROLE_CONFIG[role].icon;
                  return <Icon className="h-4 w-4" />;
                })()}
                <span className="text-sm font-medium">{ROLE_CONFIG[role].label}</span>
              </div>
              <p className="mt-1 text-xs opacity-80">
                {role === 'admin' && 'Acesso completo ao sistema, incluindo configurações e gerenciamento de usuários.'}
                {role === 'member' && 'Pode participar de campanhas e treinamentos, visualizar relatórios.'}
                {role === 'viewer' && 'Acesso somente leitura a relatórios e dashboard.'}
              </p>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
              Departamento
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)]" />
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: Tecnologia, Marketing, Vendas"
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] pl-10 pr-4 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ChevronDown for select (missing from imports)
function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function UsersManagementPage() {
  // Get company ID
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loadingCompanyId, setLoadingCompanyId] = useState(true);

  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_company_id');
        if (error) throw error;
        setCompanyId(data);
      } catch (err) {
        console.error('Failed to get company ID:', err);
      } finally {
        setLoadingCompanyId(false);
      }
    };
    fetchCompanyId();
  }, []);

  // Hooks
  const { users, loading, updateUser } = useUsers(companyId || undefined);

  // Local state for user data with additional fields
  const [userList, setUserList] = useState<User[]>([]);

  // Sync with hook data
  useEffect(() => {
    if (users.length > 0) {
      setUserList(users as User[]);
    }
  }, [users]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [suspendingUser, setSuspendingUser] = useState<User | null>(null);
  const [isSuspending, setIsSuspending] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set<string>();
    userList.forEach((u) => {
      if (u.department) depts.add(u.department);
    });
    return ['all', ...Array.from(depts).sort()];
  }, [userList]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return userList.filter((user) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (user.name?.toLowerCase().includes(searchLower)) ||
        (user.email?.toLowerCase().includes(searchLower));

      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || (user.status || 'active') === statusFilter;

      // Department filter
      const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
    });
  }, [userList, searchQuery, roleFilter, statusFilter, departmentFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const startItem = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredUsers.length);
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length);
  const paginatedUsers = filteredUsers.slice(startItem - 1, endItem);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, departmentFilter]);

  // Handlers
  const handleEditUser = useCallback((user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  }, []);

  const handleSaveUser = useCallback(
    async (updates: { role: UserRole; department?: string }) => {
      if (!editingUser) return;

      setIsSaving(true);
      try {
        await updateUser(editingUser.id, {
          role: updates.role,
          department: updates.department });
        setUserList((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, role: updates.role, department: updates.department }
              : u
          )
        );
        setToast({ message: 'Usuário atualizado com sucesso', type: 'success' });
        setIsEditModalOpen(false);
      } catch (err) {
        setToast({
          message: err instanceof Error ? err.message : 'Falha ao atualizar usuário',
          type: 'error' });
      } finally {
        setIsSaving(false);
      }
    },
    [editingUser, updateUser]
  );

  const handleDeleteUser = useCallback(
    async (user: User) => {
      setIsDeleting(true);
      try {
        // Hard delete from Supabase
        const { error: deleteError } = await supabase.from('users').delete().eq('id', user.id);
        if (deleteError) throw deleteError;
        setUserList((prev) => prev.filter((u) => u.id !== user.id));
        setToast({ message: 'Usuário removido com sucesso', type: 'success' });
        setDeletingUser(null);
      } catch (err) {
        setToast({
          message: err instanceof Error ? err.message : 'Falha ao remover usuário',
          type: 'error' });
      } finally {
        setIsDeleting(false);
      }
    },
    []
  );

  const handleSuspendUser = useCallback(
    async (user: User) => {
      setIsSuspending(true);
      try {
        const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
        const { error: updateError } = await supabase
          .from('users')
          .update({ suspended_at: newStatus === 'suspended' ? new Date().toISOString() : null })
          .eq('id', user.id);
        if (updateError) throw updateError;
        setUserList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
        setToast({
          message: newStatus === 'suspended' ? 'Usuário suspenso' : 'Usuário reativado',
          type: 'success' });
        setSuspendingUser(null);
      } catch (err) {
        setToast({
          message: err instanceof Error ? err.message : 'Falha ao alterar status',
          type: 'error' });
      } finally {
        setIsSuspending(false);
      }
    },
    []
  );

  // Stats
  const stats = useMemo(() => {
    const total = userList.length;
    const admins = userList.filter((u) => u.role === 'admin').length;
    const active = userList.filter((u) => u.status !== 'suspended').length;
    const suspended = userList.filter((u) => u.status === 'suspended').length;
    return { total, admins, active, suspended };
  }, [userList]);

  // Loading state
  if (loadingCompanyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--color-fg-secondary)]">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-[var(--color-danger)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--color-fg-primary)] mb-2">
            Erro ao carregar
          </h2>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Não foi possível identificar a empresa. Faça login novamente.
          </p>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-violet-600 shadow-lg shadow-[var(--color-accent)]/25">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                  Gerenciamento de Usuários
                </h1>
                <p className="text-sm text-[var(--color-fg-secondary)]">
                  Gerencie membros, funções e permissões da sua organização
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                window.location.href = '/app/admin/usuarios/invite';
              }}
            >
              <UserPlus className="h-4 w-4" />
              Convidar Usuário
            </Button>
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                    <Users className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                      {loading ? '-' : stats.total}
                    </p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Total de Usuários</p>
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-500/10">
                    <Shield className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                      {loading ? '-' : stats.admins}
                    </p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Administradores</p>
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10">
                    <UserCheck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                      {loading ? '-' : stats.active}
                    </p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Usuários Ativos</p>
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-500/10">
                    <UserX className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                      {loading ? '-' : stats.suspended}
                    </p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Suspensos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4">
            <div className="flex flex-wrap items-end gap-4">
              {/* Search */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <label className="text-xs text-[var(--color-fg-tertiary)]">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)]" />
                  <input
                    type="text"
                    placeholder="Nome ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] pl-10 pr-4 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Role filter */}
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-xs text-[var(--color-fg-tertiary)]">Função</label>
                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-9 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 pr-8 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                  >
                    <option value="all">Todas</option>
                    <option value="admin">Admin</option>
                    <option value="member">Membro</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)] pointer-events-none" />
                </div>
              </div>

              {/* Status filter */}
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-xs text-[var(--color-fg-tertiary)]">Status</label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 pr-8 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativo</option>
                    <option value="suspended">Suspenso</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)] pointer-events-none" />
                </div>
              </div>

              {/* Department filter */}
              {departments.length > 1 && (
                <div className="flex flex-col gap-1.5 min-w-[160px]">
                  <label className="text-xs text-[var(--color-fg-tertiary)]">Departamento</label>
                  <div className="relative">
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="h-9 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 pr-8 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      {departments
                        .filter((d) => d !== 'all')
                        .map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)] pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Table */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-noir-700)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-fg-secondary)]">
                      <div className="flex items-center justify-center gap-3">
                        <div className="h-5 w-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                        Carregando usuários...
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Users className="h-12 w-12 text-[var(--color-fg-muted)] mx-auto mb-4" />
                      <p className="text-[var(--color-fg-secondary)]">Nenhum usuário encontrado</p>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all'
                          ? 'Tente ajustar os filtros de busca'
                          : 'Convide novos membros para começar'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-[var(--color-surface-2)]/50 transition-colors"
                    >
                      {/* User */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-violet-600 text-sm font-semibold text-white shadow-md">
                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                              {user.name || 'Sem nome'}
                            </p>
                            <p className="text-xs text-[var(--color-fg-muted)] flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', ROLE_CONFIG[user.role as UserRole]?.color || ROLE_CONFIG.member.color)}>
                          {(() => {
                            const Icon = ROLE_CONFIG[user.role as UserRole]?.icon || Users;
                            return <Icon className="h-3 w-3" />;
                          })()}
                          {ROLE_CONFIG[user.role as UserRole]?.label || 'Membro'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-[var(--color-fg-secondary)]">
                          {user.department || '-'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', STATUS_CONFIG[user.status || 'active']?.color || STATUS_CONFIG.active.color)}>
                          {(user.status || 'active') === 'active' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {STATUS_CONFIG[user.status || 'active']?.label || 'Ativo'}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-[var(--color-fg-muted)]">
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleDateString('pt-BR')
                            : '-'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditUser(user)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSuspendingUser(user)}
                            title={user.status === 'suspended' ? 'Reativar' : 'Suspender'}
                          >
                            {user.status === 'suspended' ? (
                              <UserCheck className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <UserX className="h-4 w-4 text-amber-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-red-400"
                            onClick={() => setDeletingUser(user)}
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
            <span className="text-sm text-[var(--color-fg-muted)]">
              {loading ? 'Carregando...' : `Mostrando ${filteredUsers.length > 0 ? startItem : 0}-${endItem} de ${filteredUsers.length} usuários`}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveUser}
        isSaving={isSaving}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        title="Remover Usuário"
        description={`Tem certeza que deseja remover o usuário "${deletingUser?.name || deletingUser?.email}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deletingUser && handleDeleteUser(deletingUser)}
        onCancel={() => setDeletingUser(null)}
        isLoading={isDeleting}
        confirmLabel="Remover"
        variant="destructive"
      />

      {/* Suspend Confirmation */}
      <ConfirmDialog
        isOpen={!!suspendingUser}
        title={suspendingUser?.status === 'suspended' ? 'Reativar Usuário' : 'Suspender Usuário'}
        description={
          suspendingUser?.status === 'suspended'
            ? `Tem certeza que deseja reativar o usuário "${suspendingUser?.name || suspendingUser?.email}"?`
            : `Tem certeza que deseja suspender o usuário "${suspendingUser?.name || suspendingUser?.email}"? Ele não terá mais acesso ao sistema.`
        }
        onConfirm={() => suspendingUser && handleSuspendUser(suspendingUser)}
        onCancel={() => setSuspendingUser(null)}
        isLoading={isSuspending}
        confirmLabel={suspendingUser?.status === 'suspended' ? 'Reativar' : 'Suspender'}
        variant={suspendingUser?.status === 'suspended' ? 'primary' : 'destructive'}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
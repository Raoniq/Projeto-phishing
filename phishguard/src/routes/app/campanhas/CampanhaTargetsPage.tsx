import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  X,
  Users,
  UserX,
  Mail,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Clock,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

interface Target {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'reported' | 'compromised';
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  reportedAt: string | null;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-[var(--color-noir-600)] text-[var(--color-noir-300)]', icon: Clock },
  sent: { label: 'Enviado', color: 'bg-blue-500/20 text-blue-400', icon: Mail },
  opened: { label: 'Abriu', color: 'bg-purple-500/20 text-purple-400', icon: Mail },
  clicked: { label: 'Clicou', color: 'bg-amber-500/20 text-amber-400', icon: AlertTriangle },
  reported: { label: 'Reportou', color: 'bg-green-500/20 text-green-400', icon: Check },
  compromised: { label: 'Comprometido', color: 'bg-red-500/20 text-red-400', icon: UserX },
} as const;

const DEPARTMENTS = ['Todos', 'Financeiro', 'TI', 'RH', 'Marketing', 'Vendas', 'Operações', 'Executivo'];

export default function CampanhaTargetsPage() {
  const { id } = useParams();
  const { company } = useAuth();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !company?.id) {
      setTargets([]);
      setLoading(false);
      return;
    }

    const fetchTargets = async () => {
      setLoading(true);
      try {
        // Fetch campaign targets with employee data
        const { data, error } = await supabase
          .from('campaign_targets')
          .select(`
            id,
            email,
            status,
            sent_at,
            opened_at,
            clicked_at,
            reported_at,
            employees (
              name,
              department
            )
          `)
          .eq('campaign_id', id);

        if (error) throw error;

        const mapped: Target[] = (data || []).map(t => ({
          id: t.id,
          name: (t.employees as { name?: string } | null)?.name || t.email,
          email: t.email,
          department: (t.employees as { department?: string } | null)?.department || 'Não definido',
          role: '',
          status: (t.status || 'pending') as Target['status'],
          sentAt: t.sent_at,
          openedAt: t.opened_at,
          clickedAt: t.clicked_at,
          reportedAt: t.reported_at,
        }));

        setTargets(mapped);
      } catch (err) {
        console.error('[CampanhaTargets] Failed to fetch targets:', err);
        setTargets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTargets();
  }, [id, company]);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Target['status'] | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  // Filter targets
  const filteredTargets = targets.filter(t => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!t.name.toLowerCase().includes(query) && !t.email.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false;
    }
    if (departmentFilter !== 'Todos' && t.department !== departmentFilter) {
      return false;
    }
    return true;
  });

  const totalItems = filteredTargets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedTargets = filteredTargets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    total: targets.length,
    pending: targets.filter(t => t.status === 'pending').length,
    sent: targets.filter(t => t.status === 'sent').length,
    opened: targets.filter(t => t.status === 'opened').length,
    clicked: targets.filter(t => t.status === 'clicked').length,
    reported: targets.filter(t => t.status === 'reported').length,
    compromised: targets.filter(t => t.status === 'compromised').length,
  };

  // Toggle selection
  const toggleTargetSelection = useCallback((targetId: string) => {
    setSelectedTargets(prev => {
      const next = new Set(prev);
      if (next.has(targetId)) {
        next.delete(targetId);
      } else {
        next.add(targetId);
      }
      return next;
    });
  }, []);

  // Toggle all selection
  const toggleAllSelection = useCallback(() => {
    if (selectedTargets.size === paginatedTargets.length) {
      setSelectedTargets(new Set());
    } else {
      setSelectedTargets(new Set(paginatedTargets.map(t => t.id)));
    }
  }, [paginatedTargets, selectedTargets.size]);

  // Remove selected
  const handleRemoveSelected = useCallback(() => {
    // In real app, this would call API
    console.log('Removing targets:', Array.from(selectedTargets));
    setShowRemoveModal(false);
    setSelectedTargets(new Set());
  }, [selectedTargets]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Header */}
      <div className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-fg-tertiary)]">
            <Link to="/app/campanhas" className="flex items-center gap-1 hover:text-[var(--color-fg-primary)]">
              <ArrowLeft className="h-4 w-4" />
              Campanhas
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/app/campanhas/${id}`} className="hover:text-[var(--color-fg-primary)]">
              Black Friday 2026
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[var(--color-fg-primary)]">Alvos</span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                Gerenciar Alvos
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
                {stats.total} alvos · {stats.pending} pendentes · {stats.opened + stats.clicked + stats.reported + stats.compromised} engajados
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button variant="secondary" size="sm">
                <Upload className="h-4 w-4" />
                Importar
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4" />
                Adicionar alvos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const StatusIcon = config.icon;
            const count = stats[status as keyof typeof stats];
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status as Target['status'])}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  statusFilter === status
                    ? `${config.color} ring-2 ring-offset-2 ring-offset-[var(--color-surface-0)] ring-[var(--color-accent)]`
                    : 'bg-[var(--color-surface-1)] text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)]'
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}: {count}
              </button>
            );
          })}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
            <Input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Buscar por nome ou email..."
              className="pl-10"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
            className="h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {selectedTargets.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setShowRemoveModal(true)}>
              <Minus className="h-4 w-4" />
              Remover ({selectedTargets.size})
            </Button>
          )}
        </motion.div>

        {/* Targets table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden"
        >
          <table className="w-full">
            <thead className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-2)]">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedTargets.size === paginatedTargets.length && paginatedTargets.length > 0}
                    onChange={toggleAllSelection}
                    className="h-4 w-4 rounded border-[var(--color-noir-600)] bg-transparent text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                  Departamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                  Última atividade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-noir-700)]">
              {paginatedTargets.map((target) => {
                const StatusIcon = STATUS_CONFIG[target.status].icon;
                const lastActivity = target.reportedAt || target.clickedAt || target.openedAt || target.sentAt;

                return (
                  <tr
                    key={target.id}
                    className="group hover:bg-[var(--color-surface-2)]/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTargets.has(target.id)}
                        onChange={() => toggleTargetSelection(target.id)}
                        className="h-4 w-4 rounded border-[var(--color-noir-600)] bg-transparent text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-surface-2)] font-display text-xs text-[var(--color-fg-secondary)]">
                          {target.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--color-fg-primary)]">{target.name}</p>
                          <p className="text-xs text-[var(--color-fg-tertiary)]">{target.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-fg-secondary)]">
                      {target.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {target.department}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_CONFIG[target.status].color
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {STATUS_CONFIG[target.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-fg-tertiary)]">
                      {lastActivity
                        ? new Date(lastActivity).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty state */}
          {paginatedTargets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-surface-2)]">
                <Users className="h-8 w-8 text-[var(--color-fg-tertiary)]" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-[var(--color-fg-primary)]">
                Nenhum alvo encontrado
              </h3>
              <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
                Tente ajustar seus filtros ou adicione novos alvos.
              </p>
            </div>
          )}

          {/* Pagination */}
          {paginatedTargets.length > 0 && (
            <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
              <span className="text-sm text-[var(--color-fg-tertiary)]">
                Mostrando {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm text-[var(--color-fg-secondary)]">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Remove confirmation modal */}
      <AnimatePresence>
        {showRemoveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRemoveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
                    Remover alvos
                  </h3>
                  <p className="text-sm text-[var(--color-fg-tertiary)]">
                    {selectedTargets.size} alvo{selectedTargets.size !== 1 ? 's' : ''} selecionado{selectedTargets.size !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <p className="mb-6 text-sm text-[var(--color-fg-secondary)]">
                Tem certeza que deseja remover {selectedTargets.size} alvo{selectedTargets.size !== 1 ? 's' : ''} desta campanha? Esta ação não pode ser desfeita.
              </p>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowRemoveModal(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleRemoveSelected}>
                  Remover
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add targets modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
                  Adicionar Alvos
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-noir-600)] p-8 text-center hover:border-[var(--color-accent)] transition-colors cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-[var(--color-fg-tertiary)] mb-2" />
                  <p className="font-medium text-[var(--color-fg-primary)]">Arraste um arquivo CSV aqui</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)] mt-1">
                    ou clique para selecionar · Formato: nome, email, departamento
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[var(--color-noir-700)]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[var(--color-surface-1)] px-2 text-[var(--color-fg-tertiary)]">
                      ou
                    </span>
                  </div>
                </div>

                <Button variant="secondary" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Selecionar grupos existentes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
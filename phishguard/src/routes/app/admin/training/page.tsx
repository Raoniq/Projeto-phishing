/* eslint-disable @typescript-eslint/no-explicit-any, no-case-declarations */
// routes/app/admin/training/page.tsx — Admin Training Dashboard
import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { useTrainingTracks } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

// Types
interface TrainingTrack {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
  estimated_duration_minutes: number | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

interface TrackStats {
  enrolledCount: number;
  completedCount: number;
  avgProgress: number;
}

// Difficulty badge config
const DIFFICULTY_CONFIG = {
  beginner: { label: 'Básico', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  intermediate: { label: 'Intermediário', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  advanced: { label: 'Avançado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
} as const;

// Stats card component
function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  accentColor,
  delay,
}: {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  accentColor: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden border-[var(--color-noir-700)] bg-[var(--color-surface-1)] hover:border-[var(--color-noir-600)] transition-all duration-300">
        <CardContent className="p-6">
          {/* Background gradient */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, transparent 60%)`,
            }}
          />
          {/* Content */}
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-fg-tertiary)] mb-1">{label}</p>
              <p className="text-3xl font-display font-bold text-[var(--color-fg-primary)] tracking-tight">
                {value}
              </p>
              {change !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className={cn(
                      'flex items-center text-xs font-medium',
                      change >= 0 ? 'text-emerald-400' : 'text-red-400'
                    )}
                  >
                    {change >= 0 ? <TrendingUp className="h-3 w-3" /> : null}
                    {change >= 0 ? '+' : ''}{change}%
                  </span>
                  <span className="text-xs text-[var(--color-fg-muted)]">{changeLabel}</span>
                </div>
              )}
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Icon className="h-6 w-6" style={{ color: accentColor }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Empty state component
function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--color-noir-800)]">
          <GraduationCap className="h-12 w-12 text-[var(--color-fg-tertiary)]" />
        </div>
        {/* Decorative rings */}
        <div className="absolute -inset-4 rounded-full border border-dashed border-[var(--color-noir-700)] -z-10" />
        <div className="absolute -inset-8 rounded-full border border-dashed border-[var(--color-noir-800)] -z-20" />
      </div>
      <h3 className="font-display text-xl font-semibold text-[var(--color-fg-primary)] mb-2">
        Nenhuma trilha encontrada
      </h3>
      <p className="text-center text-[var(--color-fg-secondary)] mb-6 max-w-sm">
        Você ainda não criou nenhuma trilha de treinamento. Comece criando sua primeira trilha para capacitar sua equipe.
      </p>
      <Button variant="primary" onClick={onCreateNew}>
        <Plus className="h-4 w-4" />
        Criar primeira trilha
      </Button>
    </motion.div>
  );
}

// Loading skeleton
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-surface-1)] border border-[var(--color-noir-700)]">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-noir-800)] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-[var(--color-noir-800)] rounded animate-pulse" />
            <div className="h-3 w-32 bg-[var(--color-noir-800)] rounded animate-pulse" />
          </div>
          <div className="h-6 w-20 bg-[var(--color-noir-800)] rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// SortIcon component
function SortIconComponent({
  field,
  sortField,
  sortDirection,
}: {
  field: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}) {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? (
    <ChevronUp className="h-4 w-4 text-[var(--color-accent)]" />
  ) : (
    <ChevronDown className="h-4 w-4 text-[var(--color-accent)]" />
  );
}

// Main page component
export default function AdminTrainingPage() {
  // Hooks
  const { tracks, loading, error, refetch, createTrack, updateTrack, deleteTrack } = useTrainingTracks();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'difficulty'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [trackStats, setTrackStats] = useState<Record<string, TrackStats>>({});

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrainingTrack | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimated_duration_minutes: 30,
    is_required: false,
  });

  // Fetch enrollment stats for tracks
  useEffect(() => {
    const fetchStats = async () => {
      const stats: Record<string, TrackStats> = {};
      for (const track of tracks) {
        const { data: enrollments } = await supabase
          .from('user_training_enrollments')
          .select('status, progress')
          .eq('track_id', track.id);

        if (enrollments) {
          const completed = enrollments.filter(e => e.status === 'completed').length;
          const total = enrollments.length;
          const avgProgress = total > 0
            ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / total)
            : 0;
          stats[track.id] = { enrolledCount: total, completedCount: completed, avgProgress };
        }
      }
      setTrackStats(stats);
    };
    if (tracks.length > 0) {
      fetchStats();
    }
  }, [tracks, supabase]);

  // Filter and sort tracks
  const filteredTracks = useMemo(() => {
    let result = [...tracks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      result = result.filter(t => t.difficulty_level === difficultyFilter);
    }

    // Status filter (based on enrollment data)
    if (statusFilter === 'has-enrollments') {
      result = result.filter(t => (trackStats[t.id]?.enrolledCount || 0) > 0);
    } else if (statusFilter === 'no-enrollments') {
      result = result.filter(t => !trackStats[t.id]?.enrolledCount);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'difficulty':
          const diffOrder = { beginner: 1, intermediate: 2, advanced: 3 };
          aVal = diffOrder[a.difficulty_level || 'beginner'];
          bVal = diffOrder[b.difficulty_level || 'beginner'];
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tracks, searchQuery, difficultyFilter, statusFilter, sortField, sortDirection, trackStats]);

  // Pagination
  const itemsPerPage = 10;
  const totalItems = filteredTracks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedTracks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTracks.slice(start, start + itemsPerPage);
  }, [filteredTracks, currentPage, itemsPerPage]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalTracks = tracks.length;
    const totalEnrollments = Object.values(trackStats).reduce((acc, s) => acc + s.enrolledCount, 0);
    const totalCompleted = Object.values(trackStats).reduce((acc, s) => acc + s.completedCount, 0);
    const completionRate = totalEnrollments > 0
      ? Math.round((totalCompleted / totalEnrollments) * 100)
      : 0;
    const avgProgress = totalEnrollments > 0
      ? Math.round(Object.values(trackStats).reduce((acc, s) => acc + s.avgProgress, 0) / totalEnrollments)
      : 0;

    return { totalTracks, totalEnrollments, totalCompleted, completionRate, avgProgress };
  }, [tracks, trackStats]);

  // Handlers
  const handleSort = useCallback((field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setDifficultyFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  }, []);

  const openEditDialog = (track: TrainingTrack) => {
    setSelectedTrack(track);
    setFormData({
      name: track.name,
      description: track.description || '',
      difficulty_level: track.difficulty_level || 'beginner',
      estimated_duration_minutes: track.estimated_duration_minutes || 30,
      is_required: track.is_required,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (track: TrainingTrack) => {
    setSelectedTrack(track);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    setIsProcessing(true);
    try {
      await createTrack(formData);
      setCreateDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        difficulty_level: 'beginner',
        estimated_duration_minutes: 30,
        is_required: false,
      });
    } catch (err) {
      console.error('Failed to create track:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTrack) return;
    setIsProcessing(true);
    try {
      await updateTrack(selectedTrack.id, formData);
      setEditDialogOpen(false);
      setSelectedTrack(null);
    } catch (err) {
      console.error('Failed to update track:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTrack) return;
    setIsProcessing(true);
    try {
      await deleteTrack(selectedTrack.id);
      setDeleteDialogOpen(false);
      setSelectedTrack(null);
    } catch (err) {
      console.error('Failed to delete track:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const hasActiveFilters = searchQuery || difficultyFilter !== 'all' || statusFilter !== 'all';

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-[var(--color-danger)] mb-4">Erro ao carregar trilhas: {error}</p>
          <Button variant="secondary" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                Treinamento
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                Gerencie trilhas de treinamento para sua equipe
              </p>
            </div>
            <Button variant="primary" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova trilha
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total de Trilhas"
            value={stats.totalTracks}
            icon={GraduationCap}
            accentColor="var(--color-accent)"
            delay={0}
          />
          <StatCard
            label="Matrículas Ativas"
            value={stats.totalEnrollments}
            icon={Users}
            accentColor="var(--color-blue-500)"
            delay={1}
          />
          <StatCard
            label="Taxa de Conclusão"
            value={`${stats.completionRate}%`}
            change={stats.completionRate > 0 ? 12 : undefined}
            changeLabel="este mês"
            icon={CheckCircle2}
            accentColor="var(--color-success)"
            delay={2}
          />
          <StatCard
            label="Progresso Médio"
            value={`${stats.avgProgress}%`}
            icon={Clock}
            accentColor="var(--color-amber-500)"
            delay={3}
          />
        </div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
                <input
                  type="text"
                  placeholder="Buscar trilhas..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] pl-10 pr-4 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                />
              </div>
              <Button
                variant={showFilters ? 'primary' : 'secondary'}
                size="default"
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtros
                {hasActiveFilters && (
                  <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-[var(--color-surface-0)]">
                    {(difficultyFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
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
                  <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--color-fg-tertiary)]">Dificuldade:</label>
                      <select
                        value={difficultyFilter}
                        onChange={(e) => { setDifficultyFilter(e.target.value); setCurrentPage(1); }}
                        className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                      >
                        <option value="all">Todas</option>
                        <option value="beginner">Básico</option>
                        <option value="intermediate">Intermediário</option>
                        <option value="advanced">Avançado</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--color-fg-tertiary)]">Status:</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                      >
                        <option value="all">Todos</option>
                        <option value="has-enrollments">Com matrículas</option>
                        <option value="no-enrollments">Sem matrículas</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Track List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden">
            {loading ? (
              <div className="p-6">
                <TableSkeleton />
              </div>
            ) : paginatedTracks.length === 0 ? (
              <EmptyState onCreateNew={() => setCreateDialogOpen(true)} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-surface-2)]">
                      <tr>
                        <th
                          className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            Trilha
                            <SortIconComponent field="name" sortField={sortField} sortDirection={sortDirection} />
                          </div>
                        </th>
                        <th
                          className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider"
                          onClick={() => handleSort('difficulty')}
                        >
                          <div className="flex items-center gap-1">
                            Dificuldade
                            <SortIconComponent field="difficulty" sortField={sortField} sortDirection={sortDirection} />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                          Duração
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                          Matrículas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                          Concluídos
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-noir-700)]">
                      {paginatedTracks.map((track, index) => {
                        const stats = trackStats[track.id] || { enrolledCount: 0, completedCount: 0, avgProgress: 0 };
                        const difficulty = track.difficulty_level || 'beginner';

                        return (
                          <motion.tr
                            key={track.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-[var(--color-surface-2)]/50 transition-colors"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                                  <GraduationCap className="h-5 w-5 text-[var(--color-accent)]" />
                                </div>
                                <div>
                                  <p className="font-medium text-[var(--color-fg-primary)]">{track.name}</p>
                                  <p className="text-xs text-[var(--color-fg-muted)] line-clamp-1">
                                    {track.description || 'Sem descrição'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                                DIFFICULTY_CONFIG[difficulty]?.color || DIFFICULTY_CONFIG.beginner.color
                              )}>
                                {DIFFICULTY_CONFIG[difficulty]?.label || 'Básico'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-[var(--color-fg-secondary)]">
                                {track.estimated_duration_minutes
                                  ? `${track.estimated_duration_minutes}min`
                                  : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-16 rounded-full bg-[var(--color-noir-700)] overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[var(--color-accent)]"
                                    style={{ width: `${stats.avgProgress}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-[var(--color-fg-primary)]">
                                  {stats.enrolledCount}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-[var(--color-fg-secondary)]">
                                {stats.completedCount}
                                {stats.enrolledCount > 0 && (
                                  <span className="text-xs text-[var(--color-fg-muted)]">
                                    {' '}({Math.round((stats.completedCount / stats.enrolledCount) * 100)}%)
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(track)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {}}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                                  onClick={() => openDeleteDialog(track)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
                  <span className="text-sm text-[var(--color-fg-muted)]">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
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
              </>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar nova trilha</DialogTitle>
            <DialogDescription>
              Preencha os detalhes para criar uma nova trilha de treinamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                Nome da trilha
              </label>
              <input
                type="text"
                placeholder="Ex: Segurança básica"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                Descrição
              </label>
              <textarea
                placeholder="Descreva o conteúdo desta trilha..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[80px] w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 py-2 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                  Dificuldade
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as any })}
                  className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                >
                  <option value="beginner">Básico</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                  Duração (min)
                </label>
                <input
                  type="number"
                  value={formData.estimated_duration_minutes}
                  onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) || 0 })}
                  className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_required"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
              />
              <label htmlFor="is_required" className="text-sm text-[var(--color-fg-secondary)]">
                Marcar como trilha obrigatória para novos funcionários
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreate} isLoading={isProcessing}>
              Criar trilha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar trilha</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da trilha de treinamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                Nome da trilha
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[80px] w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 py-2 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                  Dificuldade
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as any })}
                  className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                >
                  <option value="beginner">Básico</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                  Duração (min)
                </label>
                <input
                  type="number"
                  value={formData.estimated_duration_minutes}
                  onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) || 0 })}
                  className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_required_edit"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
              />
              <label htmlFor="is_required_edit" className="text-sm text-[var(--color-fg-secondary)]">
                Marcar como trilha obrigatória
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleUpdate} isLoading={isProcessing}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir trilha</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a trilha "{selectedTrack?.name}"? Esta ação não pode ser desfeita e afetará todas as matrículas associadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={isProcessing}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
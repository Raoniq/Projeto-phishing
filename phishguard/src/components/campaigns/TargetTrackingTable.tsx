/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useCallback, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { TimeToClickChart, TimeBucket } from '@/components/data-viz/TimeToClickChart';

// Sort icon component
const SortIcon = ({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: 'asc' | 'desc' }) => {
  if (sortField !== field) {
    return <ChevronsUpDown className="h-4 w-4 text-[var(--color-fg-muted)]" />;
  }
  return sortDirection === 'asc' ? (
    <ChevronUp className="h-4 w-4 text-[var(--color-accent)]" />
  ) : (
    <ChevronDown className="h-4 w-4 text-[var(--color-accent)]" />
  );
};

// Time bucket thresholds in milliseconds
const TIME_BUCKETS = [
  { label: '<1min', maxMs: 60 * 1000 },
  { label: '1-5min', minMs: 60 * 1000, maxMs: 5 * 60 * 1000 },
  { label: '5-15min', minMs: 5 * 60 * 1000, maxMs: 15 * 60 * 1000 },
  { label: '15-60min', minMs: 15 * 60 * 1000, maxMs: 60 * 60 * 1000 },
  { label: '1-4hr', minMs: 60 * 60 * 1000, maxMs: 4 * 60 * 60 * 1000 },
  { label: '>4hr', minMs: 4 * 60 * 60 * 1000 },
];

// Types
type TargetStatus = 'pending' | 'sent' | 'opened' | 'clicked' | 'submitted' | 'reported';

interface TargetTrackingRow {
  id: string;
  email: string;
  nome: string;
  departamento: string;
  status: TargetStatus;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  submitted_at: string | null;
  reported_at: string | null;
  tempo_ate_acao: string | null;
}

interface FilterState {
  statuses: TargetStatus[];
  department: string;
  search: string;
}

type SortField = 'email' | 'nome' | 'departamento' | 'tempo_ate_acao';
type SortDirection = 'asc' | 'desc';

const STATUS_CONFIG: Record<TargetStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendente', color: 'text-[var(--color-fg-muted)]', bgColor: 'bg-[var(--color-noir-600)]' },
  sent: { label: 'Enviado', color: 'text-blue-400', bgColor: 'bg-blue-500' },
  opened: { label: 'Aberto', color: 'text-cyan-400', bgColor: 'bg-cyan-500' },
  clicked: { label: 'Clicado', color: 'text-amber-400', bgColor: 'bg-amber-500' },
  submitted: { label: 'Submetido', color: 'text-orange-400', bgColor: 'bg-orange-500' },
  reported: { label: 'Reportado', color: 'text-red-400', bgColor: 'bg-red-500' },
};

const ALL_STATUSES: TargetStatus[] = ['pending', 'sent', 'opened', 'clicked', 'submitted', 'reported'];

const ITEMS_PER_PAGE = 20;

// Format time duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}.${Math.floor(remainingMinutes / 6)}h` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

// Calculate time to first action
function calculateTimeToAction(
  sentAt: string | null,
  openedAt: string | null,
  clickedAt: string | null,
  submittedAt: string | null,
  reportedAt: string | null
): string | null {
  if (!sentAt) return null;

  const sentTime = new Date(sentAt).getTime();
  const actionTimes = [
    openedAt ? new Date(openedAt).getTime() : null,
    clickedAt ? new Date(clickedAt).getTime() : null,
    submittedAt ? new Date(submittedAt).getTime() : null,
    reportedAt ? new Date(reportedAt).getTime() : null,
  ].filter((t): t is number => t !== null);

  if (actionTimes.length === 0) return null;

  const firstActionTime = Math.min(...actionTimes);
  return formatDuration(firstActionTime - sentTime);
}

// Calculate time distribution for click events
function calculateTimeDistribution(
  data: TargetTrackingRow[]
): { distribution: TimeBucket[]; avgTimeToClick: number } {
  // Get all clicked records with click times
  const clickedRecords = data.filter((r) => r.clicked_at && r.sent_at);

  if (clickedRecords.length === 0) {
    return {
      distribution: TIME_BUCKETS.map((b) => ({ label: b.label, count: 0, percentage: 0 })),
      avgTimeToClick: 0,
    };
  }

  // Calculate time to click for each record (in milliseconds)
  const timeToClicks = clickedRecords.map((r) => {
    const sentMs = new Date(r.sent_at!).getTime();
    const clickedMs = new Date(r.clicked_at!).getTime();
    return clickedMs - sentMs;
  });

  // Calculate average in hours
  const avgMs = timeToClicks.reduce((sum, ms) => sum + ms, 0) / timeToClicks.length;
  const avgTimeToClick = avgMs / (1000 * 60 * 60);

  // Count records in each bucket
  const counts = TIME_BUCKETS.map((bucket) => {
    const count = timeToClicks.filter((ms) => {
      if (bucket.minMs !== undefined && ms < bucket.minMs) return false;
      if (bucket.maxMs !== undefined && ms >= bucket.maxMs) return false;
      return true;
    }).length;
    return count;
  });

  // Convert to distribution with percentages
  const distribution: TimeBucket[] = TIME_BUCKETS.map((bucket, i) => ({
    label: bucket.label,
    count: counts[i],
    percentage: clickedRecords.length > 0 ? (counts[i] / clickedRecords.length) * 100 : 0,
  }));

  return { distribution, avgTimeToClick };
}

// Get latest status from timestamps
function deriveStatus(row: TargetTrackingRow): TargetStatus {
  if (row.reported_at) return 'reported';
  if (row.submitted_at) return 'submitted';
  if (row.clicked_at) return 'clicked';
  if (row.opened_at) return 'opened';
  if (row.sent_at) return 'sent';
  return 'pending';
}

interface TargetTrackingTableProps {
  campaignId: string;
  initialFilters?: Partial<FilterState>;
  className?: string;
}

export function TargetTrackingTable({
  campaignId,
  initialFilters,
  className,
}: TargetTrackingTableProps) {
  // State
  const [data, setData] = useState<TargetTrackingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    statuses: initialFilters?.statuses || [],
    department: initialFilters?.department || '',
    search: initialFilters?.search || '',
  });
  const [sortField, setSortField] = useState<SortField>('tempo_ate_acao');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [departments, setDepartments] = useState<string[]>([]);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: targets, error } = await supabase
        .from('campaign_targets')
        .select(`
          id,
          email,
          sent_at,
          opened_at,
          clicked_at,
          submitted_at,
          reported_at,
          users:user_id (
            name,
            department
          )
        `)
        .eq('campaign_id', campaignId)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      // Transform data with user info and calculated fields
      const transformedData: TargetTrackingRow[] = (targets || []).map((t: Record<string, unknown>) => {
        const user = t.users as Record<string, unknown> | null;
        const sentAt = t.sent_at as string | null;
        const openedAt = t.opened_at as string | null;
        const clickedAt = t.clicked_at as string | null;
        const submittedAt = t.submitted_at as string | null;
        const reportedAt = t.reported_at as string | null;

        const row: TargetTrackingRow = {
          id: t.id as string,
          email: t.email as string,
          nome: (user?.name as string) || '',
          departamento: (user?.department as string) || '',
          status: 'pending',
          sent_at: sentAt,
          opened_at: openedAt,
          clicked_at: clickedAt,
          submitted_at: submittedAt,
          reported_at: reportedAt,
          tempo_ate_acao: calculateTimeToAction(sentAt, openedAt, clickedAt, submittedAt, reportedAt),
        };
        row.status = deriveStatus(row);
        return row;
      });

      setData(transformedData);

      // Extract unique departments
      const uniqueDepts = [...new Set(transformedData.map((r) => r.departamento).filter(Boolean))];
      setDepartments(uniqueDepts.sort());
    } catch (error) {
      console.error('Error loading tracking data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  // Initial load
  useEffect(() => {
    if (campaignId) {
      loadData();
    }
  }, [campaignId, loadData]);

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      let aVal: string | null;
      let bVal: string | null;

      switch (sortField) {
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'nome':
          aVal = a.nome.toLowerCase();
          bVal = b.nome.toLowerCase();
          break;
        case 'departamento':
          aVal = a.departamento.toLowerCase();
          bVal = b.departamento.toLowerCase();
          break;
        case 'tempo_ate_acao':
          aVal = a.tempo_ate_acao || '';
          bVal = b.tempo_ate_acao || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortField, sortDirection]);

  // Apply filters
  const filteredData = useMemo(() => {
    return sortedData.filter((row) => {
      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(row.status)) {
        return false;
      }
      // Department filter
      if (filters.department && row.departamento !== filters.department) {
        return false;
      }
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !row.email.toLowerCase().includes(searchLower) &&
          !row.nome.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [sortedData, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  // Toggle status in filter
  const toggleStatus = useCallback((status: TargetStatus) => {
    setFilters((prev) => {
      const newStatuses = prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status];
      return { ...prev, statuses: newStatuses };
    });
    setCurrentPage(1);
  }, []);

  // Handle sort
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }, [sortField]);

  // Export CSV
  const exportCSV = useCallback(() => {
    const headers = ['email', 'nome', 'departamento', 'status', 'tempo_ate_acao', 'sent_at', 'opened_at', 'clicked_at', 'submitted_at', 'reported_at'];

    const rows = filteredData.map((row) => [
      row.email,
      row.nome,
      row.departamento,
      row.status,
      row.tempo_ate_acao || '',
      row.sent_at || '',
      row.opened_at || '',
      row.clicked_at || '',
      row.submitted_at || '',
      row.reported_at || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tracking-report-${campaignId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredData, campaignId]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({ statuses: [], department: '', search: '' });
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = filters.statuses.length > 0 || filters.department || filters.search;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Filter Bar */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-muted)]" />
              <Input
                type="text"
                placeholder="Buscar por email ou nome..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-9 pr-8"
              />
              {filters.search && (
                <button
                  onClick={() => updateFilters({ search: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <Select value={filters.department} onValueChange={(v) => updateFilters({ department: v })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.statuses.length === 1 ? filters.statuses[0] : ''}
              onValueChange={(v) => {
                if (v === '') {
                  updateFilters({ statuses: [] });
                } else {
                  updateFilters({ statuses: [v as TargetStatus] });
                }
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos Status</SelectItem>
                {ALL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', STATUS_CONFIG[status].bgColor)} />
                      {STATUS_CONFIG[status].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button variant="secondary" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 text-[var(--color-fg-muted)]">
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>

          {/* Active Status Badges */}
          {filters.statuses.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--color-fg-muted)]">Status:</span>
              {filters.statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    STATUS_CONFIG[status].bgColor,
                    STATUS_CONFIG[status].color
                  )}
                >
                  {STATUS_CONFIG[status].label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardHeader className="border-b border-[var(--color-noir-700)] pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Rastreamento de Alvos</CardTitle>
            <Badge variant="secondary">
              {filteredData.length} registro{filteredData.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-12 w-12 text-[var(--color-fg-muted)] opacity-50" />
              <p className="mt-4 font-medium text-[var(--color-fg-primary)]">
                Nenhum registro encontrado
              </p>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                Ajuste os filtros ou aguarde os dados carregarem
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--color-surface-2)]">
                    <tr>
                      <th
                        className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)] transition-colors hover:text-[var(--color-fg-secondary)]"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center gap-2">
                          Email
                          <SortIcon field="email" sortField={sortField} sortDirection={sortDirection} />
                        </div>
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)] transition-colors hover:text-[var(--color-fg-secondary)]"
                        onClick={() => handleSort('nome')}
                      >
                        <div className="flex items-center gap-2">
                          Nome
                          <SortIcon field="nome" sortField={sortField} sortDirection={sortDirection} />
                        </div>
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)] transition-colors hover:text-[var(--color-fg-secondary)]"
                        onClick={() => handleSort('departamento')}
                      >
                        <div className="flex items-center gap-2">
                          Departamento
                          <SortIcon field="departamento" sortField={sortField} sortDirection={sortDirection} />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                        Status
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)] transition-colors hover:text-[var(--color-fg-secondary)]"
                        onClick={() => handleSort('tempo_ate_acao')}
                      >
                        <div className="flex items-center gap-2">
                          Tempo até ação
                          <SortIcon field="tempo_ate_acao" sortField={sortField} sortDirection={sortDirection} />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-noir-700)]">
                    {paginatedData.map((row, index) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-[var(--color-surface-2)]/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm text-[var(--color-fg-primary)]">{row.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[var(--color-fg-secondary)]">{row.nome || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {row.departamento ? (
                            <Badge variant="secondary" className="text-xs">
                              {row.departamento}
                            </Badge>
                          ) : (
                            <span className="text-sm text-[var(--color-fg-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                              STATUS_CONFIG[row.status].bgColor,
                              STATUS_CONFIG[row.status].color
                            )}
                          >
                            {STATUS_CONFIG[row.status].label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-[var(--color-fg-secondary)]">
                            {row.tempo_ate_acao || '—'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-[var(--color-fg-primary)]">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Time-to-Click Chart */}
      {!isLoading && data.length > 0 && (() => {
        const { distribution, avgTimeToClick } = calculateTimeDistribution(data);
        const sentCount = data.filter((r) => r.sent_at).length;
        const clickedCount = data.filter((r) => r.clicked_at).length;

        return (
          <TimeToClickChart
            sent={sentCount}
            clicked={clickedCount}
            avgTimeToClick={avgTimeToClick}
            distribution={distribution}
          />
        );
      })()}
    </div>
  );
}

export default TargetTrackingTable;
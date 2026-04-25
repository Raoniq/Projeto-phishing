import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Mail,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  Eye,
  Download,
  RefreshCw
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
import { cn } from '@/lib/utils';
import { useCampaigns } from '@/lib/hooks';
import { useCompany } from '@/hooks/useCompany';

interface Campaign {
  id: string;
  name: string;
  template: string;
  tier: 1 | 2 | 3;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  scheduledAt: string | null;
  completedAt: string | null;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    reported: number;
    compromised: number;
  };
  createdAt: string;
}

type SortField = 'name' | 'status' | 'tier' | 'createdAt' | 'stats.sent' | 'stats.opened' | 'stats.clicked';
type SortDirection = 'asc' | 'desc';

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'bg-[var(--color-noir-600)] text-[var(--color-noir-300)]', icon: Edit },
  scheduled: { label: 'Agendada', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  active: { label: 'Ativa', color: 'bg-green-500/20 text-green-400', icon: TrendingUp },
  completed: { label: 'Concluída', color: 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
} as const;

const TIER_CONFIG = {
  1: { label: 'Tier 1', color: 'bg-green-500/20 text-green-400' },
  2: { label: 'Tier 2', color: 'bg-amber-500/20 text-amber-400' },
  3: { label: 'Tier 3', color: 'bg-red-500/20 text-red-400' },
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

// Map database status to UI status
function mapStatus(dbStatus: string): Campaign['status'] {
  switch (dbStatus) {
    case 'running': return 'active'
    default: return dbStatus as Campaign['status']
  }
}

export default function CampanhasPage() {
  const navigate = useNavigate();
  const { company } = useCompany();
  const companyId = company?.id

  const { campaigns: dbCampaigns, loading } = useCampaigns(companyId)

  // Transform database campaigns to UI format
  const realCampaigns: Campaign[] = useMemo(() => {
    return dbCampaigns.map(c => ({
      id: c.id,
      name: c.name,
      template: c.description || 'Sem template',
      tier: 1, // Default tier, could be derived from settings if needed
      status: mapStatus(c.status),
      scheduledAt: c.scheduled_at,
      completedAt: c.completed_at,
      stats: c.stats,
      createdAt: c.created_at,
    }))
  }, [dbCampaigns])

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Campaign['status'] | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<Campaign['tier'] | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Filters visibility
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort campaigns
  const filteredCampaigns = useMemo(() => {
    let result = [...realCampaigns];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.template.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Tier filter
    if (tierFilter !== 'all') {
      result = result.filter(c => c.tier === tierFilter);
    }

    // Date range filter
    if (dateRange.from) {
      result = result.filter(c => new Date(c.createdAt) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      result = result.filter(c => new Date(c.createdAt) <= new Date(dateRange.to));
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: string | number, bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'tier':
          aVal = a.tier;
          bVal = b.tier;
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'stats.sent':
          aVal = a.stats.sent;
          bVal = b.stats.sent;
          break;
        case 'stats.opened':
          aVal = a.stats.opened;
          bVal = b.stats.opened;
          break;
        case 'stats.clicked':
          aVal = a.stats.clicked;
          bVal = b.stats.clicked;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [searchQuery, statusFilter, tierFilter, dateRange, sortField, sortDirection, realCampaigns]);

  // Pagination
  const totalItems = filteredCampaigns.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCampaigns.slice(start, start + itemsPerPage);
  }, [filteredCampaigns, currentPage, itemsPerPage]);

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
    setTierFilter('all');
    setDateRange({ from: '', to: '' });
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || tierFilter !== 'all' || dateRange.from || dateRange.to;

  // Stats for summary cards
  const totalActive = realCampaigns.filter(c => c.status === 'active').length;
  const totalScheduled = realCampaigns.filter(c => c.status === 'scheduled').length;
  const avgClickRate = realCampaigns.length > 0
    ? ((realCampaigns.reduce((acc, c) => acc + (c.stats.opened > 0 ? c.stats.clicked / c.stats.opened : 0), 0) / realCampaigns.length) * 100).toFixed(1)
    : '0';

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
              Campanhas
            </h1>
            <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
              Gerencie suas campanhas de phishing simulado
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/campanhas/relatorio')}>
              <Download className="h-4 w-4" />
              Relatório geral
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/app/campanhas/nova')}>
              <Plus className="h-4 w-4" />
              Nova campanha
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
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{totalActive}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Campanhas ativas</p>
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
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{totalScheduled}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Agendadas</p>
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
                  <Mail className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{realCampaigns.length}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Total de campanhas</p>
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
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                  <TrendingUp className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{avgClickRate}%</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Média de clique</p>
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
          {/* Search and filter toggle row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
              <input
                type="text"
                placeholder="Buscar campanhas..."
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
                  {(statusFilter !== 'all' ? 1 : 0) + (tierFilter !== 'all' ? 1 : 0) + (dateRange.from ? 1 : 0)}
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
                      onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled'); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="draft">Rascunho</option>
                      <option value="scheduled">Agendada</option>
                      <option value="active">Ativa</option>
                      <option value="completed">Concluída</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>

                  {/* Tier filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">Tier:</label>
                    <select
                      value={tierFilter}
                      onChange={(e) => { setTierFilter(e.target.value as 'all' | '1' | '2' | '3'); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="1">Tier 1</option>
                      <option value="2">Tier 2</option>
                      <option value="3">Tier 3</option>
                    </select>
                  </div>

                  {/* Date range */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">De:</label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => { setDateRange(prev => ({ ...prev, from: e.target.value })); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">Até:</label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => { setDateRange(prev => ({ ...prev, to: e.target.value })); handleFilterChange(); }}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            <thead className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-2)]">
              <tr>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)] transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Nome
                    <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)] transition-colors"
                  onClick={() => handleSort('tier')}
                >
                  <div className="flex items-center gap-1">
                    Tier
                    <SortIcon field="tier" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)] transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)] transition-colors"
                  onClick={() => handleSort('stats.sent')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Enviados
                    <SortIcon field="stats.sent" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)] transition-colors"
                  onClick={() => handleSort('stats.opened')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Abertos
                    <SortIcon field="stats.opened" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)] transition-colors"
                  onClick={() => handleSort('stats.clicked')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Cliques
                    <SortIcon field="stats.clicked" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                  Reportados
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)] transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Criada em
                    <SortIcon field="createdAt" />
                  </div>
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-noir-700)]">
              {paginatedCampaigns.map((campaign, idx) => {
                const StatusIcon = STATUS_CONFIG[campaign.status].icon;
                return (
                  <motion.tr
                    key={campaign.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group cursor-pointer hover:bg-[var(--color-surface-2)]/50 transition-colors"
                    onClick={() => navigate(`/app/campanhas/${campaign.id}`)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--color-fg-primary)]">{campaign.name}</span>
                        <span className="text-xs text-[var(--color-fg-tertiary)]">{campaign.template}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', TIER_CONFIG[campaign.tier].color)}>
                        {TIER_CONFIG[campaign.tier].label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CONFIG[campaign.status].color)}>
                        <StatusIcon className="h-3 w-3" />
                        {STATUS_CONFIG[campaign.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-sm text-[var(--color-fg-secondary)]">
                      {campaign.stats.sent.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-sm text-[var(--color-fg-secondary)]">{campaign.stats.opened.toLocaleString('pt-BR')}</span>
                        {campaign.stats.sent > 0 && (
                          <span className="text-[10px] text-[var(--color-fg-tertiary)]">
                            {((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-sm text-[var(--color-fg-secondary)]">{campaign.stats.clicked.toLocaleString('pt-BR')}</span>
                        {campaign.stats.opened > 0 && (
                          <span className="text-[10px] text-[var(--color-fg-tertiary)]">
                            {((campaign.stats.clicked / campaign.stats.opened) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-sm text-green-400">{campaign.stats.reported}</span>
                        {campaign.stats.clicked > 0 && (
                          <span className="text-[10px] text-[var(--color-fg-tertiary)]">
                            {((campaign.stats.reported / campaign.stats.clicked) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--color-fg-tertiary)]">
                      {new Date(campaign.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => navigate(`/app/campanhas/${campaign.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/app/campanhas/${campaign.id}/alvos`)}>
                            <Users className="mr-2 h-4 w-4" />
                            Gerenciar alvos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/app/campanhas/${campaign.id}/relatorio`)}>
                            <Download className="mr-2 h-4 w-4" />
                            Ver relatório
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {paginatedCampaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-surface-2)]">
              <Search className="h-8 w-8 text-[var(--color-fg-tertiary)]" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-[var(--color-fg-primary)]">
              Nenhuma campanha encontrada
            </h3>
            <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
              {hasActiveFilters ? 'Tente ajustar seus filtros ou buscar outro termo.' : 'Comece criando sua primeira campanha de phishing simulado.'}
            </p>
            {!hasActiveFilters && (
              <Button variant="primary" className="mt-4" onClick={() => navigate('/app/campanhas/nova')}>
                <Plus className="h-4 w-4" />
                Criar campanha
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {paginatedCampaigns.length > 0 && (
          <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--color-fg-tertiary)]">
                Mostrando {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems.toLocaleString('pt-BR')}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-fg-tertiary)]">Por página:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
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
                    size="sm"
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
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
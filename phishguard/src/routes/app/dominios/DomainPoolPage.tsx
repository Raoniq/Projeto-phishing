/* eslint-disable react-hooks/set-state-in-effect, no-case-declarations, react-hooks/static-components, react-hooks/rules-of-hooks */
// DomainPoolPage - Complete domain management UI with Forensic Noir design
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Globe,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  Search,
  Filter,
  Database,
  Mail,
  Calendar,
  Copy,
  Check,
  BarChart3,
  Flame,
  Thermometer,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

type DomainHealth = 'healthy' | 'warming' | 'burned' | 'unknown';
type DomainStatus = 'active' | 'inactive' | 'retired';
type WarmingPhase = 'cold' | 'warmup' | 'active' | 'rotating';

interface DomainWarmingSchedule {
  domainId: string;
  startedAt: string;
  phase: WarmingPhase;
  dailyVolume: number;
  targetVolume: number;
  nextWarmingStep: string;
  expectedActiveDate: string;
}

interface Domain {
  id: string;
  domain: string;
  companyId: string;
  health: DomainHealth;
  status: DomainStatus;
  reputationScore: number;
  healthCheckUrl: string;
  usedInCampaigns: number;
  lastUsedAt: string | null;
  maxCampaignsBeforeRetirement: number;
  warmingSchedule: DomainWarmingSchedule | null;
  spfRecord: string | null;
  dkimRecord: string | null;
  dmarcRecord: string | null;
  registeredAt: string;
  expiresAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DomainStats {
  total: number;
  healthy: number;
  warming: number;
  burned: number;
  averageReputation: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const HEALTH_CONFIG = {
  healthy: {
    label: 'Saudável',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: CheckCircle,
    dotColor: 'bg-green-400'
  },
  warming: {
    label: 'Aquecendo',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Flame,
    dotColor: 'bg-amber-400 animate-pulse'
  },
  burned: {
    label: 'Queimado',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle,
    dotColor: 'bg-red-400'
  },
  unknown: {
    label: 'Desconhecido',
    color: 'bg-[var(--color-noir-700)] text-[var(--color-fg-tertiary)] border-[var(--color-noir-600)]',
    icon: HelpCircle,
    dotColor: 'bg-[var(--color-fg-tertiary)]'
  }
} as const;

const WARMING_PHASE_CONFIG = {
  cold: { label: 'Frio', color: 'bg-blue-500/20 text-blue-400', icon: Thermometer },
  warmup: { label: 'Aquecendo', color: 'bg-amber-500/20 text-amber-400', icon: Flame },
  active: { label: 'Ativo', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  rotating: { label: 'Rotação', color: 'bg-purple-500/20 text-purple-400', icon: RefreshCw }
} as const;

// =============================================================================
// MOCK DATA - Replace with Supabase queries in production
// =============================================================================

const MOCK_DOMAINS: Domain[] = [
  {
    id: 'd1',
    domain: 'mail-rh-net.com',
    companyId: 'company-1',
    health: 'healthy',
    status: 'active',
    reputationScore: 92,
    healthCheckUrl: 'https://mail-rh-net.com/health',
    usedInCampaigns: 1,
    lastUsedAt: '2026-04-20T10:00:00Z',
    maxCampaignsBeforeRetirement: 2,
    warmingSchedule: {
      domainId: 'd1',
      startedAt: '2026-03-01T00:00:00Z',
      phase: 'rotating',
      dailyVolume: 500,
      targetVolume: 500,
      nextWarmingStep: 'Domínio em rotação ativa',
      expectedActiveDate: '2026-04-01T00:00:00Z'
    },
    spfRecord: 'v=spf1 include:_spf.phishguard.com.br ~all',
    dkimRecord: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAg==',
    dmarcRecord: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@phishguard.com.br',
    registeredAt: '2026-01-15T00:00:00Z',
    expiresAt: '2027-01-15T00:00:00Z',
    notes: 'Domínio principal para campanhas de RH',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z'
  },
  {
    id: 'd2',
    domain: 'portal-beneficios.net',
    companyId: 'company-1',
    health: 'healthy',
    status: 'active',
    reputationScore: 85,
    healthCheckUrl: 'https://portal-beneficios.net/health',
    usedInCampaigns: 0,
    lastUsedAt: null,
    maxCampaignsBeforeRetirement: 2,
    warmingSchedule: {
      domainId: 'd2',
      startedAt: '2026-04-01T00:00:00Z',
      phase: 'warmup',
      dailyVolume: 40,
      targetVolume: 500,
      nextWarmingStep: 'Aumentar para 100 emails/dia em 4 dias',
      expectedActiveDate: '2026-05-01T00:00:00Z'
    },
    spfRecord: 'v=spf1 include:_spf.phishguard.com.br ~all',
    dkimRecord: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAg==',
    dmarcRecord: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@phishguard.com.br',
    registeredAt: '2026-03-20T00:00:00Z',
    expiresAt: '2027-03-20T00:00:00Z',
    notes: null,
    createdAt: '2026-03-20T00:00:00Z',
    updatedAt: '2026-04-15T00:00:00Z'
  },
  {
    id: 'd3',
    domain: 'intranet-conecta.com',
    companyId: 'company-1',
    health: 'warming',
    status: 'active',
    reputationScore: 58,
    healthCheckUrl: 'https://intranet-conecta.com/health',
    usedInCampaigns: 1,
    lastUsedAt: '2026-04-10T10:00:00Z',
    maxCampaignsBeforeRetirement: 2,
    warmingSchedule: {
      domainId: 'd3',
      startedAt: '2026-03-15T00:00:00Z',
      phase: 'warmup',
      dailyVolume: 100,
      targetVolume: 500,
      nextWarmingStep: 'Aumentar para 200 emails/dia em 7 dias',
      expectedActiveDate: '2026-04-15T00:00:00Z'
    },
    spfRecord: 'v=spf1 include:_spf.phishguard.com.br ~all',
    dkimRecord: null,
    dmarcRecord: null,
    registeredAt: '2026-03-01T00:00:00Z',
    expiresAt: '2027-03-01T00:00:00Z',
    notes: 'DKIM e DMARC pendentes de configuração',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z'
  },
  {
    id: 'd4',
    domain: 'cloud-acesso.com',
    companyId: 'company-1',
    health: 'burned',
    status: 'active',
    reputationScore: 22,
    healthCheckUrl: 'https://cloud-acesso.com/health',
    usedInCampaigns: 3,
    lastUsedAt: '2026-02-15T10:00:00Z',
    maxCampaignsBeforeRetirement: 2,
    warmingSchedule: null,
    spfRecord: 'v=spf1 include:_spf.phishguard.com.br ~all',
    dkimRecord: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAg==',
    dmarcRecord: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@phishguard.com.br',
    registeredAt: '2025-12-01T00:00:00Z',
    expiresAt: '2026-12-01T00:00:00Z',
    notes: 'Reputação baixa - recomendado retirar de circulação',
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'd5',
    domain: 'sistema-work.com',
    companyId: 'company-1',
    health: 'unknown',
    status: 'inactive',
    reputationScore: 0,
    healthCheckUrl: '',
    usedInCampaigns: 0,
    lastUsedAt: null,
    maxCampaignsBeforeRetirement: 2,
    warmingSchedule: null,
    spfRecord: null,
    dkimRecord: null,
    dmarcRecord: null,
    registeredAt: '2026-04-20T00:00:00Z',
    expiresAt: '2027-04-20T00:00:00Z',
    notes: 'Domínio novo - aguardando configuração DNS',
    createdAt: '2026-04-20T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z'
  }
];

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function HelpCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <path d="M12 17h.01"/>
    </svg>
  );
}

// Animated counter for stats
function AnimatedCounter({ value, duration = 1 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString('pt-BR')}</span>;
}

// =============================================================================
// SUB-COMPONENT: DomainPoolOverview - Stats Cards Grid
// =============================================================================

interface DomainPoolOverviewProps {
  stats: DomainStats;
}

function DomainPoolOverview({ stats }: DomainPoolOverviewProps) {
  const statCards = [
    {
      label: 'Total de Domínios',
      value: stats.total,
      icon: Globe,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      delay: 0
    },
    {
      label: 'Saudáveis',
      value: stats.healthy,
      icon: CheckCircle,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-400',
      delay: 0.05
    },
    {
      label: 'Aquecendo',
      value: stats.warming,
      icon: Flame,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      delay: 0.1
    },
    {
      label: 'Queimados',
      value: stats.burned,
      icon: XCircle,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
      delay: 0.15
    },
    {
      label: 'Reputação Média',
      value: stats.averageReputation,
      icon: Award,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      delay: 0.2,
      suffix: '%',
      isPercentage: true
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('grid h-12 w-12 place-items-center rounded-xl', stat.iconBg)}>
                      <Icon className={cn('h-6 w-6', stat.iconColor)} />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-fg-tertiary)]">{stat.label}</p>
                      <p className="font-display text-3xl font-bold text-[var(--color-fg-primary)]">
                        {stat.isPercentage ? (
                          <AnimatedCounter value={stat.value} duration={0.8} />
                        ) : (
                          <AnimatedCounter value={stat.value} duration={0.8} />
                        )}
                        {stat.suffix}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: DomainListTable - Sortable Table
// =============================================================================

interface DomainListTableProps {
  domains: Domain[];
  sortBy: 'domain' | 'health' | 'reputation' | 'usedInCampaigns' | 'lastUsedAt';
  sortOrder: 'asc' | 'desc';
  onSort: (column: DomainListTableProps['sortBy']) => void;
  onViewDetail: (domain: Domain) => void;
  onDelete: (domain: Domain) => void;
}

function DomainListTable({ domains, sortBy, sortOrder, onSort, onViewDetail, onDelete }: DomainListTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<DomainHealth | 'all'>('all');

  const filteredDomains = useMemo(() => {
    return domains.filter(domain => {
      const matchesSearch = domain.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHealth = healthFilter === 'all' || domain.health === healthFilter;
      return matchesSearch && matchesHealth;
    });
  }, [domains, searchQuery, healthFilter]);

  const sortedDomains = useMemo(() => {
    return [...filteredDomains].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'domain':
          comparison = a.domain.localeCompare(b.domain);
          break;
        case 'health':
          const healthOrder = { healthy: 3, warming: 2, burned: 1, unknown: 0 };
          comparison = healthOrder[a.health] - healthOrder[b.health];
          break;
        case 'reputation':
          comparison = a.reputationScore - b.reputationScore;
          break;
        case 'usedInCampaigns':
          comparison = a.usedInCampaigns - b.usedInCampaigns;
          break;
        case 'lastUsedAt':
          const aDate = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
          const bDate = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
          comparison = aDate - bDate;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredDomains, sortBy, sortOrder]);

  const SortIcon = ({ column }: { column: DomainListTableProps['sortBy'] }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-[var(--color-accent)]" />
    ) : (
      <ChevronDown className="h-4 w-4 text-[var(--color-accent)]" />
    );
  };

  const HealthBadge = ({ health }: { health: DomainHealth }) => {
    const config = HEALTH_CONFIG[health];
    const Icon = config.icon;
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border', config.color)}>
        <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden"
    >
      {/* Filters */}
      <div className="flex flex-col gap-4 border-b border-[var(--color-noir-700)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
          <input
            type="text"
            placeholder="Buscar por domínio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] py-2 pl-10 pr-4 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value as DomainHealth | 'all')}
            className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="healthy">Saudável</option>
            <option value="warming">Aquecendo</option>
            <option value="burned">Queimado</option>
            <option value="unknown">Desconhecido</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--color-surface-2)]">
            <tr>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider hover:text-[var(--color-fg-primary)]"
                onClick={() => onSort('domain')}
              >
                <div className="flex items-center gap-1">
                  Domínio
                  <SortIcon column="domain" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider hover:text-[var(--color-fg-primary)]"
                onClick={() => onSort('health')}
              >
                <div className="flex items-center gap-1">
                  Saúde
                  <SortIcon column="health" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider hover:text-[var(--color-fg-primary)]"
                onClick={() => onSort('reputation')}
              >
                <div className="flex items-center gap-1">
                  Reputação
                  <SortIcon column="reputation" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider hover:text-[var(--color-fg-primary)]"
                onClick={() => onSort('usedInCampaigns')}
              >
                <div className="flex items-center gap-1">
                  Campanhas
                  <SortIcon column="usedInCampaigns" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider hover:text-[var(--color-fg-primary)]"
                onClick={() => onSort('lastUsedAt')}
              >
                <div className="flex items-center gap-1">
                  Último Uso
                  <SortIcon column="lastUsedAt" />
                </div>
              </th>
              <th className="w-10 px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-noir-700)]">
            {sortedDomains.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-[var(--color-fg-muted)]">
                    <Globe className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm font-medium">Nenhum domínio encontrado</p>
                    <p className="text-xs mt-1 text-[var(--color-fg-tertiary)]">
                      {searchQuery || healthFilter !== 'all'
                        ? 'Tente ajustar os filtros'
                        : 'Adicione seu primeiro domínio ao pool'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedDomains.map((domain) => (
                <motion.tr
                  key={domain.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="hover:bg-[var(--color-surface-2)]/50 cursor-pointer transition-colors"
                  onClick={() => onViewDetail(domain)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-surface-2)]">
                        <Globe className="h-5 w-5 text-[var(--color-fg-tertiary)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-fg-primary)]">{domain.domain}</p>
                        {domain.warmingSchedule && (
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium mt-1',
                            WARMING_PHASE_CONFIG[domain.warmingSchedule.phase].color
                          )}>
                            <Clock className="h-2.5 w-2.5" />
                            {WARMING_PHASE_CONFIG[domain.warmingSchedule.phase].label}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <HealthBadge health={domain.health} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-[var(--color-noir-700)]">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            domain.reputationScore >= 70 ? 'bg-green-400' :
                            domain.reputationScore >= 40 ? 'bg-amber-400' : 'bg-red-400'
                          )}
                          style={{ width: `${domain.reputationScore}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm text-[var(--color-fg-secondary)]">
                        {domain.reputationScore}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-fg-secondary)]">
                    {domain.usedInCampaigns} / {domain.maxCampaignsBeforeRetirement}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-fg-secondary)]">
                    {formatDate(domain.lastUsedAt)}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onViewDetail(domain)}>
                          <Eye className="h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400"
                          onClick={() => onDelete(domain)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// =============================================================================
// SUB-COMPONENT: AddDomainModal - Domain Input with Validation & DNS Preview
// =============================================================================

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (domain: string) => void;
}

function AddDomainModal({ isOpen, onClose, onAdd }: AddDomainModalProps) {
  const [domainInput, setDomainInput] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDomainInput('');
      setIsValid(false);
      setValidationError(null);
    }
  }, [isOpen]);

  const validateDomain = useCallback((value: string) => {
    if (!value) {
      setIsValid(false);
      setValidationError(null);
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2 }$/;
    if (!domainRegex.test(value)) {
      setIsValid(false);
      setValidationError('Domínio inválido. Use o formato: exemplo.com');
      return;
    }

    // Check for forbidden patterns (typosquatting indicators)
    const forbiddenPatterns = ['-', '--', 'xn--'];
    if (forbiddenPatterns.some(p => value.includes(p))) {
      setIsValid(false);
      setValidationError('Domínio contém padrões inválidos');
      return;
    }

    setIsValid(true);
    setValidationError(null);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim();
    setDomainInput(value);
    validateDomain(value);
  };

  const handleSubmit = () => {
    if (isValid) {
      onAdd(domainInput);
      onClose();
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Auto-generated DNS records preview
  const dnsPreview = {
    spf: `v=spf1 include:_spf.phishguard.com.br ~all`,
    dkim: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA==`,
    dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc@phishguard.com.br`
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-[var(--color-surface-1)] border-[var(--color-noir-700)]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[var(--color-fg-primary)]">
            Adicionar Domínio
          </DialogTitle>
          <DialogDescription className="text-[var(--color-fg-secondary)]">
            Configure um novo domínio para o pool de envio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Domain Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-fg-primary)]">
              Domínio <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
              <input
                type="text"
                value={domainInput}
                onChange={handleInputChange}
                placeholder="exemplo.com"
                className={cn(
                  'w-full rounded-lg border bg-[var(--color-surface-2)] py-3 pl-11 pr-4 text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:outline-none',
                  validationError
                    ? 'border-red-500 focus:border-red-500'
                    : isValid
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-[var(--color-noir-700)] focus:border-[var(--color-accent)]'
                )}
              />
              {isValid && (
                <CheckCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-400" />
              )}
            </div>
            {validationError && (
              <p className="flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="h-3 w-3" />
                {validationError}
              </p>
            )}
          </div>

          {/* DNS Configuration Preview */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-fg-primary)]">
              Configuração DNS (Preview)
            </label>
            <p className="text-xs text-[var(--color-fg-tertiary)]">
              Estes registros serão criados automaticamente ao adicionar o domínio
            </p>

            <div className="space-y-2">
              {/* SPF */}
              <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-accent)]">SPF Record</span>
                  <button
                    onClick={() => copyToClipboard(dnsPreview.spf, 'spf')}
                    className="flex items-center gap-1 text-xs text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)]"
                  >
                    {copiedField === 'spf' ? (
                      <><Check className="h-3 w-3" /> Copiado</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copiar</>
                    )}
                  </button>
                </div>
                <code className="mt-1 block text-xs text-[var(--color-fg-secondary)]">
                  {dnsPreview.spf}
                </code>
              </div>

              {/* DKIM */}
              <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-accent)]">DKIM Record</span>
                  <button
                    onClick={() => copyToClipboard(dnsPreview.dkim, 'dkim')}
                    className="flex items-center gap-1 text-xs text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)]"
                  >
                    {copiedField === 'dkim' ? (
                      <><Check className="h-3 w-3" /> Copiado</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copiar</>
                    )}
                  </button>
                </div>
                <code className="mt-1 block text-xs text-[var(--color-fg-secondary)]">
                  {dnsPreview.dkim}
                </code>
              </div>

              {/* DMARC */}
              <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-accent)]">DMARC Record</span>
                  <button
                    onClick={() => copyToClipboard(dnsPreview.dmarc, 'dmarc')}
                    className="flex items-center gap-1 text-xs text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)]"
                  >
                    {copiedField === 'dmarc' ? (
                      <><Check className="h-3 w-3" /> Copiado</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copiar</>
                    )}
                  </button>
                </div>
                <code className="mt-1 block text-xs text-[var(--color-fg-secondary)]">
                  {dnsPreview.dmarc}
                </code>
              </div>
            </div>
          </div>

          {/* Warming Info */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <Flame className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-400">Período de Aquecimento</p>
                <p className="mt-1 text-xs text-amber-300">
                  Novos domínios passam por um período de aquecimento de 30 dias,
                  com volume começando em 5 emails/dia e aumentando gradualmente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!isValid}>
            <Plus className="h-4 w-4" />
            Adicionar Domínio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// SUB-COMPONENT: DomainDetailDrawer - Health, Warming Timeline, Campaign History
// =============================================================================

interface DomainDetailDrawerProps {
  domain: Domain | null;
  isOpen: boolean;
  onClose: () => void;
}

function DomainDetailDrawer({ domain, isOpen, onClose }: DomainDetailDrawerProps) {
  if (!domain) return null;

  const HealthIcon = HEALTH_CONFIG[domain.health].icon;

  // Mock health check results
  const healthCheckResults = {
    mxValid: domain.spfRecord !== null,
    spfValid: domain.spfRecord !== null,
    dmarcValid: domain.dmarcRecord !== null,
    issues: domain.health === 'burned'
      ? ['Reputação muito baixa', 'Domínio usado em muitas campanhas']
      : domain.health === 'warming'
      ? ['DKIM não configurado', 'DMARC não configurado']
      : [],
    recommendations: domain.health === 'healthy'
      ? ['Domínio em excelente estado']
      : domain.health === 'warming'
      ? ['Complete a configuração DNS', 'Continue o monitoramento']
      : ['Considere aposentar este domínio']
  };

  // Mock campaign history
  const campaignHistory = domain.usedInCampaigns > 0 ? [
    {
      id: 'c1',
      name: 'Black Friday 2026',
      date: domain.lastUsedAt || '2026-04-20',
      results: { sent: 150, opened: 89, clicked: 12, reported: 3 }
    }
  ] : [];

  // 30-day warming timeline data
  const warmingTimelineData = useMemo(() => {
    if (!domain.warmingSchedule) return [];

    const days = 30;
    const schedule = [
      { day: 0, volume: 5 },
      { day: 3, volume: 15 },
      { day: 7, volume: 40 },
      { day: 14, volume: 100 },
      { day: 21, volume: 200 },
      { day: 30, volume: 500 }
    ];

    return Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const entry = schedule.reduce((prev, curr) => day >= curr.day ? curr : prev, schedule[0]);
      return { day, volume: entry.volume };
    });
  }, [domain.warmingSchedule]);

  const maxVolume = Math.max(...warmingTimelineData.map(d => d.volume), 500);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-[var(--color-surface-1)] border-l border-[var(--color-noir-700)] shadow-xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-surface-2)]">
                  <Globe className="h-6 w-6 text-[var(--color-fg-tertiary)]" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[var(--color-fg-primary)]">
                    {domain.domain}
                  </h2>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border mt-1',
                    HEALTH_CONFIG[domain.health].color
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', HEALTH_CONFIG[domain.health].dotColor)} />
                    <HealthIcon className="h-3 w-3" />
                    {HEALTH_CONFIG[domain.health].label}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 text-center">
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                    {domain.reputationScore}
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Reputação</p>
                </div>
                <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 text-center">
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                    {domain.usedInCampaigns}/{domain.maxCampaignsBeforeRetirement}
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Campanhas</p>
                </div>
                <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 text-center">
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                    {domain.warmingSchedule?.dailyVolume || 0}
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Volume/dia</p>
                </div>
              </div>

              {/* Health Check Results */}
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[var(--color-accent)]" />
                    Resultados do Health Check
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* DNS Validation */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                      Validação DNS
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'SPF', valid: healthCheckResults.spfValid },
                        { label: 'DKIM', valid: domain.dkimRecord !== null },
                        { label: 'DMARC', valid: healthCheckResults.dmarcValid }
                      ].map(({ label, valid }) => (
                        <div
                          key={label}
                          className={cn(
                            'flex items-center justify-center rounded-lg py-2 text-xs font-medium',
                            valid
                              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          )}
                        >
                          {valid ? <CheckCircle className="h-3.5 w-3.5 mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Issues */}
                  {healthCheckResults.issues.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                        Problemas Identificados
                      </p>
                      <div className="space-y-1">
                        {healthCheckResults.issues.map((issue, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-red-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {issue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {healthCheckResults.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                        Recomendações
                      </p>
                      <div className="space-y-1">
                        {healthCheckResults.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-green-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Warming Progress Chart */}
              {domain.warmingSchedule && (
                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" />
                        Progresso de Aquecimento
                      </CardTitle>
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
                        WARMING_PHASE_CONFIG[domain.warmingSchedule.phase].color
                      )}>
                        <Clock className="h-3 w-3" />
                        {WARMING_PHASE_CONFIG[domain.warmingSchedule.phase].label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Chart */}
                      <div className="relative h-32 w-full overflow-hidden rounded-lg bg-[var(--color-surface-2)] p-3">
                        <svg className="h-full w-full" viewBox={`0 0 30 ${maxVolume + 50}`} preserveAspectRatio="none">
                          {/* Grid lines */}
                          {[0, 250, 500].map(y => (
                            <line
                              key={y}
                              x1="0"
                              y1={maxVolume - y + 50}
                              x2="30"
                              y2={maxVolume - y + 50}
                              stroke="var(--color-noir-700)"
                              strokeWidth="0.5"
                              strokeDasharray="2,2"
                            />
                          ))}

                          {/* Area fill */}
                          <path
                            d={`M0,${maxVolume - warmingTimelineData[0].volume + 50} ${warmingTimelineData.map((d) => {
                              const x = d.day;
                              const y = maxVolume - d.volume + 50;
                              return `L${x},${y}`;
                            }).join(' ')} L30,${maxVolume + 50} L0,${maxVolume + 50} Z`}
                            fill="url(#warmingGradient)"
                            opacity="0.3"
                          />

                          {/* Line */}
                          <path
                            d={`M0,${maxVolume - warmingTimelineData[0].volume + 50} ${warmingTimelineData.map((d) => {
                              const x = d.day;
                              const y = maxVolume - d.volume + 50;
                              return `L${x},${y}`;
                            }).join(' ')}`}
                            fill="none"
                            stroke="var(--color-accent)"
                            strokeWidth="2"
                          />

                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="warmingGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-accent)" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 flex h-full flex-col justify-between p-1 text-[8px] text-[var(--color-fg-tertiary)]">
                          <span>500</span>
                          <span>250</span>
                          <span>0</span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-between text-xs text-[var(--color-fg-tertiary)]">
                        <span>Dia 0</span>
                        <span>Volume atual: {domain.warmingSchedule.dailyVolume} emails/dia</span>
                        <span>Dia 30</span>
                      </div>

                      {/* Next step */}
                      <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
                        <p className="text-xs text-[var(--color-fg-tertiary)]">Próximo passo</p>
                        <p className="mt-1 text-sm text-[var(--color-fg-primary)]">
                          {domain.warmingSchedule.nextWarmingStep}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Campaign History */}
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[var(--color-accent)]" />
                    Histórico de Campanhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {campaignHistory.length === 0 ? (
                    <div className="py-8 text-center">
                      <Mail className="mx-auto h-8 w-8 text-[var(--color-fg-tertiary)]" />
                      <p className="mt-2 text-sm text-[var(--color-fg-tertiary)]">
                        Nenhuma campanha utilizada
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {campaignHistory.map(campaign => (
                        <div
                          key={campaign.id}
                          className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-[var(--color-fg-primary)]">{campaign.name}</p>
                            <span className="text-xs text-[var(--color-fg-tertiary)]">
                              {new Date(campaign.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                            <div className="text-center">
                              <p className="font-mono font-bold text-blue-400">{campaign.results.sent}</p>
                              <p className="text-[var(--color-fg-tertiary)]">Enviados</p>
                            </div>
                            <div className="text-center">
                              <p className="font-mono font-bold text-purple-400">{campaign.results.opened}</p>
                              <p className="text-[var(--color-fg-tertiary)]">Abertos</p>
                            </div>
                            <div className="text-center">
                              <p className="font-mono font-bold text-amber-400">{campaign.results.clicked}</p>
                              <p className="text-[var(--color-fg-tertiary)]">Cliques</p>
                            </div>
                            <div className="text-center">
                              <p className="font-mono font-bold text-green-400">{campaign.results.reported}</p>
                              <p className="text-[var(--color-fg-tertiary)]">Reportados</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* DNS Records */}
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-[var(--color-accent)]" />
                    Registros DNS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { type: 'SPF', value: domain.spfRecord, color: 'text-blue-400' },
                    { type: 'DKIM', value: domain.dkimRecord, color: 'text-purple-400' },
                    { type: 'DMARC', value: domain.dmarcRecord, color: 'text-green-400' }
                  ].map(({ type, value, color }) => (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cn('text-xs font-medium', color)}>{type}</span>
                        {value && (
                          <button
                            onClick={() => navigator.clipboard.writeText(value)}
                            className="text-xs text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)]"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <code className="block rounded bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-fg-secondary)]">
                        {value || <span className="text-[var(--color-fg-tertiary)]">Não configurado</span>}
                      </code>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
                    Informações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-fg-tertiary)]">Registrado em</span>
                    <span className="text-[var(--color-fg-primary)]">
                      {new Date(domain.registeredAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-fg-tertiary)]">Expira em</span>
                    <span className="text-[var(--color-fg-primary)]">
                      {new Date(domain.expiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {domain.notes && (
                    <div className="pt-3 border-t border-[var(--color-noir-700)]">
                      <p className="text-xs text-[var(--color-fg-tertiary)] mb-1">Notas</p>
                      <p className="text-sm text-[var(--color-fg-secondary)]">{domain.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// SUB-COMPONENT: WarmingProgressChart - 30-day Timeline
// =============================================================================

interface WarmingProgressChartProps {
  domains: Domain[];
}

function WarmingProgressChart({ domains }: WarmingProgressChartProps) {
  // Aggregate data for warming domains
  const warmingData = useMemo(() => {
    const warmingDomains = domains.filter(d => d.warmingSchedule && d.warmingSchedule.phase !== 'rotating');
    if (warmingDomains.length === 0) return [];

    // Generate 30-day timeline with aggregated volume
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const totalVolume = warmingDomains.reduce((sum, d) => {
        if (!d.warmingSchedule) return sum;
        const schedule = [
          { day: 0, volume: 5 },
          { day: 3, volume: 15 },
          { day: 7, volume: 40 },
          { day: 14, volume: 100 },
          { day: 21, volume: 200 },
          { day: 30, volume: 500 }
        ];
        const entry = schedule.reduce((prev, curr) => day >= curr.day ? curr : prev, schedule[0]);
        return sum + entry.volume;
      }, 0);
      return { day, volume: totalVolume };
    });
  }, [domains]);

  const maxVolume = Math.max(...warmingData.map(d => d.volume), 1);

  if (warmingData.length === 0) {
    return (
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[var(--color-accent)]" />
            Volume de Aquecimento (30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-[var(--color-fg-tertiary)]">
              Nenhum domínio em aquecimento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[var(--color-accent)]" />
            Volume de Aquecimento (30 dias)
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {warmingData.length} domínios
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="relative h-48 w-full overflow-hidden rounded-lg bg-[var(--color-surface-2)] p-4">
            <svg className="h-full w-full" viewBox={`0 0 30 ${maxVolume + 100}`} preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, Math.round(maxVolume / 2), maxVolume].map(y => (
                <g key={y}>
                  <line
                    x1="0"
                    y1={maxVolume - y + 50}
                    x2="30"
                    y2={maxVolume - y + 50}
                    stroke="var(--color-noir-700)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                  <text
                    x="-2"
                    y={maxVolume - y + 54}
                    fontSize="8"
                    fill="var(--color-fg-tertiary)"
                    textAnchor="end"
                  >
                    {y}
                  </text>
                </g>
              ))}

              {/* Area fill */}
              <path
                d={`M0,${maxVolume - warmingData[0].volume + 50} ${warmingData.map(d => {
                  const x = d.day;
                  const y = maxVolume - d.volume + 50;
                  return `L${x},${y}`;
                }).join(' ')} L30,${maxVolume + 50} L0,${maxVolume + 50} Z`}
                fill="url(#chartGradient)"
                opacity="0.4"
              />

              {/* Line */}
              <path
                d={`M0,${maxVolume - warmingData[0].volume + 50} ${warmingData.map(d => {
                  const x = d.day;
                  const y = maxVolume - d.volume + 50;
                  return `L${x},${y}`;
                }).join(' ')}`}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Gradient */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>

            {/* X-axis label */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-2 text-[10px] text-[var(--color-fg-tertiary)]">
              <span>Dia 1</span>
              <span>Dia 15</span>
              <span>Dia 30</span>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-[var(--color-accent)]">
                {warmingData[0]?.volume || 0}
              </p>
              <p className="text-xs text-[var(--color-fg-tertiary)]">Volume inicial</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-green-400">
                {warmingData[warmingData.length - 1]?.volume || 0}
              </p>
              <p className="text-xs text-[var(--color-fg-tertiary)]">Volume final</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-purple-400">
                {Math.round((warmingData[warmingData.length - 1]?.volume - warmingData[0]?.volume) / warmingData.length)}%
              </p>
              <p className="text-xs text-[var(--color-fg-tertiary)]">Crescimento médio</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT: DomainPoolPage
// =============================================================================

export default function DomainPoolPage() {
  const [domains, setDomains] = useState<Domain[]>(MOCK_DOMAINS);
  const [stats, setStats] = useState<DomainStats>({
    total: 0,
    healthy: 0,
    warming: 0,
    burned: 0,
    averageReputation: 0
  });
  const [sortBy, setSortBy] = useState<'domain' | 'health' | 'reputation' | 'usedInCampaigns' | 'lastUsedAt'>('domain');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [deleteConfirmDomain, setDeleteConfirmDomain] = useState<Domain | null>(null);

  // Calculate stats from domains
  useEffect(() => {
    const total = domains.length;
    const healthy = domains.filter(d => d.health === 'healthy').length;
    const warming = domains.filter(d => d.health === 'warming').length;
    const burned = domains.filter(d => d.health === 'burned').length;
    const averageReputation = total > 0
      ? Math.round(domains.reduce((sum, d) => sum + d.reputationScore, 0) / total)
      : 0;

    setStats({ total, healthy, warming, burned, averageReputation });
  }, [domains]);

  // Fetch domains from Supabase (production)
  useEffect(() => {
    async function fetchDomains() {
      try {
        const { data, error } = await supabase
          .from('isca_domains')
          .select('*')
          .order('domain', { ascending: true });

        if (!error && data) {
          // Transform Supabase data to Domain interface if needed
          // setDomains(data);
        }
      } catch {
        console.warn('Using mock data - Supabase not configured');
      }
    }
    fetchDomains();
  }, []);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleViewDetail = (domain: Domain) => {
    setSelectedDomain(domain);
    setIsDetailDrawerOpen(true);
  };

  const handleDelete = (domain: Domain) => {
    setDeleteConfirmDomain(domain);
  };

  const confirmDelete = () => {
    if (deleteConfirmDomain) {
      setDomains(prev => prev.filter(d => d.id !== deleteConfirmDomain.id));
      setDeleteConfirmDomain(null);
    }
  };

  const handleAddDomain = (domain: string) => {
    const newDomain: Domain = {
      id: `d-${Date.now()}`,
      domain,
      companyId: 'company-1',
      health: 'unknown',
      status: 'inactive',
      reputationScore: 0,
      healthCheckUrl: '',
      usedInCampaigns: 0,
      lastUsedAt: null,
      maxCampaignsBeforeRetirement: 2,
      warmingSchedule: null,
      spfRecord: null,
      dkimRecord: null,
      dmarcRecord: null,
      registeredAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Aguardando configuração DNS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDomains(prev => [...prev, newDomain]);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-1)]"
      >
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                Pool de Domínios
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                Gerencie domínios para envio de campanhas de phishing simulado
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Adicionar Domínio
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <DomainPoolOverview stats={stats} />

        {/* Warming Progress Chart */}
        <WarmingProgressChart domains={domains} />

        {/* Domain List Table */}
        <DomainListTable
          domains={domains}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onViewDetail={handleViewDetail}
          onDelete={handleDelete}
        />
      </div>

      {/* Add Domain Modal */}
      <AddDomainModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDomain}
      />

      {/* Domain Detail Drawer */}
      <DomainDetailDrawer
        domain={selectedDomain}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmDomain} onOpenChange={() => setDeleteConfirmDomain(null)}>
        <DialogContent className="sm:max-w-md bg-[var(--color-surface-1)] border-[var(--color-noir-700)]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-[var(--color-fg-primary)]">
              Excluir Domínio
            </DialogTitle>
            <DialogDescription className="text-[var(--color-fg-secondary)]">
              Esta ação não pode ser desfeita
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-[var(--color-fg-secondary)]">
              Tem certeza que deseja excluir o domínio{' '}
              <strong className="text-[var(--color-fg-primary)]">{deleteConfirmDomain?.domain}</strong>?
              Todos os dados associados serão permanentemente removidos.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirmDomain(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
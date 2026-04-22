// src/routes/app/configuracoes/dominios.page.tsx
// Domain pool management page - Isca Pool
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  Copy,
  Trash2,
  RotateCw,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import {
  SAMPLE_DOMAIN_POOL,
  DEFAULT_DNS_CONFIG,
  HEALTH_THRESHOLDS,
  WARMING_VOLUME_SCHEDULE
} from '@/workers/domains/types';

// Generate 25 mock domains with realistic data
function generateMockDomains() {
  const healthOptions: ('healthy' | 'warming' | 'burned')[] = ['healthy', 'healthy', 'healthy', 'warming', 'warming', 'burned'];
  const statusOptions: ('active' | 'inactive' | 'retired')[] = ['active', 'active', 'active', 'active', 'retired'];

  return SAMPLE_DOMAIN_POOL.slice(0, 25).map((domain, index) => {
    const health = healthOptions[Math.floor(Math.random() * healthOptions.length)];
    const status = health === 'burned' ? 'retired' : statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const isConfigured = Math.random() > 0.15;

    return {
      id: `domain-${index + 1}`,
      domain,
      health,
      status,
      reputationScore: health === 'burned'
        ? Math.floor(Math.random() * 25)
        : health === 'warming'
          ? Math.floor(50 + Math.random() * 30)
          : Math.floor(70 + Math.random() * 30),
      usedInCampaigns: health === 'burned' ? 2 : Math.floor(Math.random() * 2),
      lastUsedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      warmingPhase: health === 'warming' ? 'warmup' : health === 'healthy' ? 'active' : null,
      spfConfigured: isConfigured,
      dkimConfigured: isConfigured && Math.random() > 0.1,
      dmarcConfigured: isConfigured && Math.random() > 0.2,
      registeredAt: new Date(Date.now() - (90 + Math.random() * 180) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + (180 + Math.random() * 180) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dayInWarming: health === 'warming' ? Math.floor(Math.random() * 14) : null,
    };
  });
}

type TabType = 'pool' | 'warming' | 'dns' | 'retired';
type HealthType = 'healthy' | 'warming' | 'burned' | 'unknown';

const MOCK_DOMAINS = generateMockDomains();

// Extracted component to avoid static-components lint error
function WarmingScheduleVisualComponent({ domains }: { domains: typeof MOCK_DOMAINS }) {
  const weeks = [
    { week: 1, dayStart: 0, dayEnd: 7, volume: '5-15', label: 'Cold Start', progress: 0.2 },
    { week: 2, dayStart: 7, dayEnd: 14, volume: '15-40', label: 'Ramp Up', progress: 0.4 },
    { week: 3, dayStart: 14, dayEnd: 21, volume: '40-100', label: 'Establishing', progress: 0.6 },
    { week: 4, dayStart: 21, dayEnd: 28, volume: '100-200', label: 'Building', progress: 0.8 },
    { week: 5, dayStart: 28, dayEnd: 35, volume: '200-500', label: 'Active', progress: 1.0 },
  ];

  const warmingDomains = domains.filter(d => d.health === 'warming' && d.dayInWarming !== null);

  return (
    <div className="space-y-6">
      {/* Week Progress Cards */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            Cronograma de Aquecimento (Semanas 1-5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {weeks.map((week, i) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  'relative rounded-lg border p-4 transition-all',
                  'bg-[var(--color-surface-2)] border-[var(--color-noir-700)]',
                  'hover:border-[var(--color-amber-500)]/50 hover:shadow-lg hover:shadow-amber-500/5'
                )}
              >
                {/* Week Number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Semana {week.week}
                  </span>
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center',
                    i < 2 ? 'bg-[var(--color-surface-3)]' :
                    i < 4 ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                  )}>
                    <span className={cn(
                      'font-display font-bold text-sm',
                      i < 2 ? 'text-[var(--color-fg-tertiary)]' :
                      i < 4 ? 'text-amber-400' : 'text-emerald-400'
                    )}>
                      {week.volume.split('-')[1]}
                    </span>
                  </div>
                </div>

                {/* Volume */}
                <p className="text-lg font-bold text-[var(--color-fg-primary)]">
                  {week.volume}
                </p>
                <p className="text-xs text-[var(--color-fg-muted)] mb-2">emails/dia</p>

                {/* Label */}
                <Badge variant="secondary" className="mt-2">
                  {week.label}
                </Badge>

                {/* Progress indicator */}
                <div className="mt-3 h-1 w-full rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${week.progress * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    className={cn(
                      'h-full rounded-full',
                      i < 2 ? 'bg-[var(--color-surface-3)]' :
                      i < 4 ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Warming Domains */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Domínios em Aquecimento
            <Badge variant="secondary" className="ml-2">{warmingDomains.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {warmingDomains.length > 0 ? (
            <div className="space-y-3">
              {warmingDomains.map((domain, i) => {
                const day = domain.dayInWarming || 0;
                const weekIndex = Math.min(Math.floor(day / 7), 4);
                return (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-noir-700)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-medium text-[var(--color-fg-primary)]">
                          {domain.domain}
                        </p>
                        <p className="text-xs text-[var(--color-fg-muted)]">
                          Dia {day} · Semana {weekIndex + 1}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-amber-400">
                          ~{WARMING_VOLUME_SCHEDULE[weekIndex]?.volume || 5} emails/dia
                        </p>
                        <p className="text-xs text-[var(--color-fg-muted)]">volume atual</p>
                      </div>
                      <div className="w-24 h-2 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${(day / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
                <Clock className="h-6 w-6 text-[var(--color-fg-muted)]" />
              </div>
              <p className="text-[var(--color-fg-muted)]">Nenhum domínio em aquecimento</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// DNS Guide Section component
function DNSGuideSectionComponent() {
  const [selectedDomainForDNS, setSelectedDomainForDNS] = useState<string | null>(null);

  const dnsRecords = [
    {
      type: 'SPF',
      name: '@',
      priority: 'TXT',
      value: DEFAULT_DNS_CONFIG.spf,
      description: 'Autoriza servidores PhishGuard a enviar emails em seu nome',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      type: 'DKIM',
      name: 'phishguard._domainkey',
      priority: 'CNAME',
      value: DEFAULT_DNS_CONFIG.dkim,
      description: 'Chave pública para verificação de assinatura DKIM',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      type: 'DMARC',
      name: '_dmarc',
      priority: 'TXT',
      value: DEFAULT_DNS_CONFIG.dmarc,
      description: 'Política de tratamento para emails não autenticados',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* DNS Records Guide */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-[var(--color-accent)]" />
            Registros DNS Necessários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dnsRecords.map((record) => (
              <div
                key={record.type}
                className={cn(
                  'p-4 rounded-lg border',
                  record.borderColor,
                  record.bgColor
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={record.color}>
                        {record.type}
                      </Badge>
                      <span className="font-mono text-sm font-medium text-[var(--color-fg-primary)]">
                        {record.name}
                      </span>
                      <Badge variant="outline">{record.priority}</Badge>
                    </div>
                    <p className="text-xs text-[var(--color-fg-secondary)] mb-2">
                      {record.description}
                    </p>
                    <code className={cn(
                      'block text-xs p-2 rounded bg-[var(--color-surface-3)] font-mono text-[var(--color-fg-primary)]',
                      record.color.replace('text-', 'text-')
                    )}>
                      {record.value}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(record.value)}
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Domain Selection */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[var(--color-accent)]" />
            Selecionar Domínio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {MOCK_DOMAINS.filter(d => d.health === 'healthy').slice(0, 4).map((domain) => (
              <button
                key={domain.id}
                onClick={() => setSelectedDomainForDNS(domain.domain)}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all',
                  selectedDomainForDNS === domain.domain
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-accent)]/50'
                )}
              >
                <p className="font-mono text-sm font-medium text-[var(--color-fg-primary)]">
                  {domain.domain}
                </p>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Reputação: {domain.reputationScore}%
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DominiosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pool');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [domains, setDomains] = useState(MOCK_DOMAINS);
  const [isLoading, setIsLoading] = useState(false);
  const [retireDialog, setRetireDialog] = useState<string | null>(null);
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [showDNSGuide, setShowDNSGuide] = useState(false);

  // Stats
  const stats = {
    total: domains.length,
    healthy: domains.filter(d => d.health === 'healthy').length,
    warming: domains.filter(d => d.health === 'warming').length,
    burned: domains.filter(d => d.health === 'burned').length,
    avgReputation: Math.round(
      domains.filter(d => d.health !== 'burned').reduce((acc, d) => acc + d.reputationScore, 0) /
      domains.filter(d => d.health !== 'burned').length
    ),
  };

  const getHealthColor = (health: HealthType) => {
    switch (health) {
      case 'healthy': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'warming': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'burned': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-[var(--color-surface-3)] text-[var(--color-fg-tertiary)] border border-[var(--color-noir-700)]';
    }
  };

  const getHealthIcon = (health: HealthType) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warming': return <Clock className="h-4 w-4" />;
      case 'burned': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getReputationBarColor = (score: number) => {
    if (score >= HEALTH_THRESHOLDS.GOOD) return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    if (score >= HEALTH_THRESHOLDS.FAIR) return 'bg-gradient-to-r from-amber-500 to-amber-400';
    return 'bg-gradient-to-r from-red-500 to-red-400';
  };

  const handleHealthCheck = useCallback((domainId: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setDomains(prev =>
        prev.map(d =>
          d.id === domainId
            ? { ...d, reputationScore: Math.min(100, d.reputationScore + Math.floor(Math.random() * 10 - 3)) }
            : d
        )
      );
      setIsLoading(false);
    }, 1500);
  }, []);

  const handleRetireDomain = useCallback((domainId: string) => {
    setDomains(prev =>
      prev.map(d =>
        d.id === domainId
          ? { ...d, status: 'retired' as const, health: 'burned' as const }
          : d
      )
    );
    setRetireDialog(null);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                Pool de Domínios
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                Gerencie domínios de isca para campanhas de simulação de phishing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDNSGuide(!showDNSGuide)}
              >
                <Shield className="h-4 w-4" />
                Ver DNS
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddDomain(true)}
              >
                <Plus className="h-4 w-4" />
                Adicionar Domínio
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-surface-2)]">
                    <Globe className="h-5 w-5 text-[var(--color-fg-secondary)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{stats.total}</p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Total de domínios</p>
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-emerald-400">{stats.healthy}</p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Saudáveis</p>
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
                    <Clock className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-amber-400">{stats.warming}</p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Em Aquecimento</p>
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
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-red-400">{stats.burned}</p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Queimados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                    <Shield className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{stats.avgReputation}%</p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Reputação Média</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* DNS Guide Modal */}
        <AnimatePresence>
          {showDNSGuide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setShowDNSGuide(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-6"
              >
<DNSGuideSectionComponent />
                <div className="mt-4 flex justify-end">
                  <Button variant="secondary" onClick={() => setShowDNSGuide(false)}>
                    Fechar
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex gap-1 border-b border-[var(--color-noir-700)]">
            {([
              { key: 'pool', label: 'Pool de Domínios' },
              { key: 'warming', label: 'Aquecimento' },
              { key: 'dns', label: 'Configuração DNS' },
              { key: 'retired', label: 'Aposentados' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]'
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]"
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'pool' && (
            <motion.div
              key="pool"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Rotation Automation Control */}
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                        <RotateCw className="h-5 w-5 text-[var(--color-accent)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-fg-primary)]">Rotação Automática</p>
                        <p className="text-xs text-[var(--color-fg-muted)]">
                          Domínios são automaticamente rotacionados entre campanhas
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRotationEnabled(!rotationEnabled)}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors',
                        rotationEnabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface-3)]'
                      )}
                    >
                      <motion.div
                        animate={{ x: rotationEnabled ? 22 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Domain Table */}
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-surface-2)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                          Domínio
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                          Saúde
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                          Reputação
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                          Campanhas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                          Status DNS
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-noir-700)]">
                      {domains.map((domain, i) => (
                        <motion.tr
                          key={domain.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-[var(--color-surface-2)]/50 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-surface-2)]">
                                <Globe className="h-5 w-5 text-[var(--color-fg-secondary)]" />
                              </div>
                              <div>
                                <p className="font-mono font-medium text-[var(--color-fg-primary)]">{domain.domain}</p>
                                <p className="text-xs text-[var(--color-fg-muted)]">
                                  Expira: {domain.expiresAt}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', getHealthColor(domain.health))}>
                              {getHealthIcon(domain.health)}
                              {domain.health === 'healthy' && 'Saudável'}
                              {domain.health === 'warming' && 'Aquecendo'}
                              {domain.health === 'burned' && 'Queimado'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full transition-all', getReputationBarColor(domain.reputationScore))}
                                  style={{ width: `${domain.reputationScore}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-[var(--color-fg-primary)] tabular-nums">
                                {domain.reputationScore}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={cn(
                              'text-sm tabular-nums',
                              domain.usedInCampaigns >= 2 ? 'text-red-400' : 'text-[var(--color-fg-secondary)]'
                            )}>
                              {domain.usedInCampaigns}/2
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <Badge
                                variant={domain.spfConfigured ? 'success' : 'destructive'}
                                className="text-xs"
                              >
                                SPF
                              </Badge>
                              <Badge
                                variant={domain.dkimConfigured ? 'success' : 'destructive'}
                                className="text-xs"
                              >
                                DKIM
                              </Badge>
                              <Badge
                                variant={domain.dmarcConfigured ? 'success' : 'destructive'}
                                className="text-xs"
                              >
                                DMARC
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleHealthCheck(domain.id)}
                                disabled={isLoading || domain.health === 'burned'}
                                className="text-[var(--color-accent)] hover:text-[var(--color-accent)]/80"
                              >
                                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                              </Button>
                              {domain.status !== 'retired' && domain.health !== 'burned' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRetireDialog(domain.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'warming' && (
            <motion.div
              key="warming"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <WarmingScheduleVisualComponent domains={domains} />
            </motion.div>
          )}

          {activeTab === 'dns' && (
            <motion.div
              key="dns"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DNSGuideSection />
            </motion.div>
          )}

          {activeTab === 'retired' && (
            <motion.div
              key="retired"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-red-400" />
                    Domínios Aposentados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-[var(--color-noir-700)] overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[var(--color-surface-2)]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                            Domínio
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                            Reputação Final
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                            Campanhas
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                            Motivo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-noir-700)]">
                        {domains
                          .filter(d => d.status === 'retired')
                          .map((domain) => (
                            <tr key={domain.id} className="hover:bg-[var(--color-surface-2)]/50 transition-colors">
                              <td className="px-4 py-4 font-mono text-[var(--color-fg-muted)]">
                                {domain.domain}
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-red-400 tabular-nums">
                                  {domain.reputationScore}%
                                </span>
                              </td>
                              <td className="px-4 py-4 text-[var(--color-fg-muted)] tabular-nums">
                                {domain.usedInCampaigns}
                              </td>
                              <td className="px-4 py-4 text-sm text-[var(--color-fg-muted)]">
                                {domain.usedInCampaigns >= 2 ? 'Excedeu limite de campanhas' : 'Reputação muito baixa'}
                              </td>
                            </tr>
                          ))}
                        {domains.filter(d => d.status === 'retired').length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-fg-muted)]">
                              Nenhum domínio aposentado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Retirement Confirmation Dialog */}
        <Dialog open={!!retireDialog} onOpenChange={() => setRetireDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Aposentar Domínio
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja aposentar este domínio? Esta ação:
                <ul className="mt-2 space-y-1 text-sm text-[var(--color-fg-secondary)]">
                  <li>• Irá marcar o domínio como &quot;queimado&quot;</li>
                  <li>• Irá remover o domínio do pool de rotação</li>
                  <li>• Irá parar o uso em novas campanhas</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm text-red-400 font-medium">
                {domains.find(d => d.id === retireDialog)?.domain}
              </p>
              <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                Reputação atual: {domains.find(d => d.id === retireDialog)?.reputationScore}%
              </p>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setRetireDialog(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => retireDialog && handleRetireDomain(retireDialog)}
              >
                Confirmar Aposentadoria
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Domain Modal */}
        <Dialog open={showAddDomain} onOpenChange={setShowAddDomain}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Domínio</DialogTitle>
              <DialogDescription>
                Adicione um novo domínio de isca ao pool. Após adicionar, você precisará configurar os registros DNS.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowAddDomain(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1">
                  Domínio
                </label>
                <input
                  type="text"
                  placeholder="ex: mail-rh-empresa.com"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-muted)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1">
                  Data de Expiração
                </label>
                <input
                  type="date"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddDomain(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Adicionar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
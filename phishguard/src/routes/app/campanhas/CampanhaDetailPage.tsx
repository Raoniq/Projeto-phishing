import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Mail,
  Eye,
  MousePointer,
  Flag,
  CheckCircle,
  XCircle,
  Activity,
  Target,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Pause,
  Play,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/DropdownMenu';
import { CampaignFunnel } from '@/components/data-viz/CampaignFunnel';
import { cn } from '@/lib/utils';

// Mock campaign data
const MOCK_CAMPAIGN = {
  id: 'campaign-1',
  name: 'Black Friday 2026',
  template: 'Black Friday Promo',
  tier: 2 as const,
  status: 'active' as const,
  createdAt: '2026-04-15T10:00:00Z',
  scheduledAt: '2026-04-20T09:00:00Z',
  completedAt: null,
  description: 'Simulação de phishing baseada em promoções falsas de Black Friday.',
  stats: {
    sent: 150,
    opened: 89,
    clicked: 12,
    reported: 3,
    compromised: 2,
  },
};

// Real-time simulation
function _generateRealtimeStats(baseStats: typeof MOCK_CAMPAIGN.stats) {
  const elapsed = Math.random() * 0.3; // 0-30% additional
  return {
    sent: baseStats.sent,
    opened: Math.min(baseStats.opened + Math.floor(elapsed * 5), baseStats.sent),
    clicked: Math.min(baseStats.clicked + Math.floor(elapsed * 2), baseStats.opened),
    reported: baseStats.reported,
    compromised: baseStats.compromised,
  };
}

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'bg-[var(--color-noir-600)] text-[var(--color-noir-300)]', icon: Edit },
  scheduled: { label: 'Agendada', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  active: { label: 'Ativa', color: 'bg-green-500/20 text-green-400', icon: Activity },
  completed: { label: 'Concluída', color: 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-500/20 text-red-400', icon: XCircle },
} as const;

const TIER_CONFIG = {
  1: { label: 'Tier 1', color: 'bg-green-500/20 text-green-400', description: 'Exposição Controlada' },
  2: { label: 'Tier 2', color: 'bg-amber-500/20 text-amber-400', description: 'Intervenção Dirigida' },
  3: { label: 'Tier 3', color: 'bg-red-500/20 text-red-400', description: 'Intervenção Completa' },
} as const;

export default function CampanhaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign] = useState(MOCK_CAMPAIGN);
  const [stats, setStats] = useState(MOCK_CAMPAIGN.stats);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);

  // Real-time stats simulation
  useEffect(() => {
    if (campaign.status !== 'active' || isPaused) return;

    const interval = setInterval(() => {
      setStats(prev => {
        const delta = {
          sent: 0,
          opened: Math.random() > 0.7 ? 1 : 0,
          clicked: Math.random() > 0.85 ? 1 : 0,
          reported: 0,
          compromised: 0,
        };
        return {
          sent: prev.sent,
          opened: Math.min(prev.opened + delta.opened, prev.sent),
          clicked: Math.min(prev.clicked + delta.clicked, prev.opened),
          reported: prev.reported,
          compromised: prev.compromised,
        };
      });
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, [campaign.status, isPaused]);

  // Calculate rates
  const openRate = stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0;
  const clickRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;
  const reportRate = stats.clicked > 0 ? (stats.reported / stats.clicked) * 100 : 0;

  const StatusIcon = STATUS_CONFIG[campaign.status].icon;

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
            <span className="text-[var(--color-fg-primary)]">{campaign.name}</span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                  {campaign.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    STATUS_CONFIG[campaign.status].color
                  )}>
                    <StatusIcon className="h-3 w-3" />
                    {STATUS_CONFIG[campaign.status].label}
                  </span>
                  <span className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    TIER_CONFIG[campaign.tier].color
                  )}>
                    {TIER_CONFIG[campaign.tier].label}
                  </span>
                  {campaign.status === 'active' && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <Activity className="h-3 w-3" />
                      Tempo real
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/app/campanhas/${id}/analytics`)}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/app/campanhas/${id}/relatorio`)}
              >
                <Download className="h-4 w-4" />
                Relatório
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/app/campanhas/${id}/alvos`)}
              >
                <Users className="h-4 w-4" />
                Alvos
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar campanha
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pause className="mr-2 h-4 w-4" />
                    Pausar envio
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-400">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Real-time indicator */}
        {campaign.status === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between rounded-[var(--radius-md)] border border-green-500/30 bg-green-500/5 px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm text-green-400">Atualizações em tempo real</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-fg-tertiary)]">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? 'Retomar' : 'Pausar'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Sent */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/10">
                    <Mail className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Enviados</p>
                    <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                      {stats.sent}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opened */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-500/10">
                    <Eye className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Abertos</p>
                    <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                      {stats.opened}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'font-mono text-lg font-bold',
                    openRate > 50 ? 'text-green-400' : openRate > 30 ? 'text-amber-400' : 'text-[var(--color-fg-tertiary)]'
                  )}>
                    {openRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">taxa de abertura</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clicked */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10">
                    <MousePointer className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Cliques</p>
                    <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                      {stats.clicked}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'font-mono text-lg font-bold',
                    clickRate > 15 ? 'text-red-400' : clickRate > 8 ? 'text-amber-400' : 'text-green-400'
                  )}>
                    {clickRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">taxa de clique</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reported */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-green-500/10">
                    <Flag className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Reportados</p>
                    <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                      {stats.reported}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-green-400">
                    {reportRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">taxa de reporte</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Second row: Funnel + Details */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Funnel visualization */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>
                  Acompanhe o caminho dos alvos através da campanha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignFunnel
                  sent={stats.sent}
                  opened={stats.opened}
                  clicked={stats.clicked}
                  reported={stats.reported}
                  compromised={stats.compromised}
                />

                {/* Rate indicators */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 text-center">
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Abertura</p>
                    <p className="font-display text-xl font-bold text-[var(--color-fg-primary)]">
                      {openRate.toFixed(1)}%
                    </p>
                    <div className="mt-1 h-1 rounded-full bg-[var(--color-surface-3)]">
                      <div
                        className="h-1 rounded-full bg-purple-400 transition-all"
                        style={{ width: `${openRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 text-center">
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Clique</p>
                    <p className="font-display text-xl font-bold text-[var(--color-fg-primary)]">
                      {clickRate.toFixed(1)}%
                    </p>
                    <div className="mt-1 h-1 rounded-full bg-[var(--color-surface-3)]">
                      <div
                        className="h-1 rounded-full bg-amber-400 transition-all"
                        style={{ width: `${clickRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 text-center">
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Reportes</p>
                    <p className="font-display text-xl font-bold text-green-400">
                      {reportRate.toFixed(0)}%
                    </p>
                    <div className="mt-1 h-1 rounded-full bg-[var(--color-surface-3)]">
                      <div
                        className="h-1 rounded-full bg-green-400 transition-all"
                        style={{ width: `${reportRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Campaign details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader>
                <CardTitle>Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-surface-2)]">
                    <Target className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Template</p>
                    <p className="font-medium text-[var(--color-fg-primary)]">{campaign.template}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-surface-2)]">
                    <Calendar className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Agendada em</p>
                    <p className="font-medium text-[var(--color-fg-primary)]">
                      {new Date(campaign.scheduledAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-surface-2)]">
                    <Clock className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Criada em</p>
                    <p className="font-medium text-[var(--color-fg-primary)]">
                      {new Date(campaign.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {campaign.description && (
                  <div className="pt-4 border-t border-[var(--color-noir-700)]">
                    <p className="text-xs text-[var(--color-fg-tertiary)] mb-1">Descrição</p>
                    <p className="text-sm text-[var(--color-fg-secondary)]">{campaign.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="mt-4 border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Ver todos os alvos
                </Button>
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar dados (CSV)
                </Button>
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar lembrete
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
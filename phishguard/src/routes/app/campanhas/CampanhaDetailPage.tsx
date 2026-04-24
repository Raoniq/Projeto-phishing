import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
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
  BarChart3,
  Copy,
  StopCircle,
  Zap,
  AlertTriangle
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
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Types
interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  reported: number;
  submitted: number;
  compromised: number;
}

interface CampaignEvent {
  id: string;
  campaign_target_id: string;
  event_type: 'sent' | 'opened' | 'clicked' | 'reported' | 'failed';
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  // Joined data
  target_email?: string;
}

interface Campaign {
  id: string;
  name: string;
  template: string;
  tier: 1 | 2 | 3;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  createdAt: string;
  scheduledAt: string | null;
  completedAt: string | null;
  description: string | null;
  stats: CampaignStats;
}

// Status configuration
const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'bg-[var(--color-noir-600)] text-[var(--color-noir-300)]', icon: Edit, pulse: false },
  scheduled: { label: 'Agendada', color: 'bg-blue-500/20 text-blue-400', icon: Clock, pulse: false },
  running: { label: 'Enviando', color: 'bg-amber-500/20 text-amber-400', icon: Zap, pulse: true },
  paused: { label: 'Pausada', color: 'bg-orange-500/20 text-orange-400', icon: Pause, pulse: false },
  completed: { label: 'Concluída', color: 'bg-green-500/20 text-green-400', icon: CheckCircle, pulse: false },
  cancelled: { label: 'Cancelada', color: 'bg-red-500/20 text-red-400', icon: XCircle, pulse: false },
} as const;

const TIER_CONFIG = {
  1: { label: 'Tier 1', color: 'bg-green-500/20 text-green-400', description: 'Exposição Controlada' },
  2: { label: 'Tier 2', color: 'bg-amber-500/20 text-amber-400', description: 'Intervenção Dirigida' },
  3: { label: 'Tier 3', color: 'bg-red-500/20 text-red-400', description: 'Intervenção Completa' },
} as const;

const EVENT_LABELS = {
  sent: 'enviou',
  opened: 'abriu',
  clicked: 'clicou',
  reported: 'reportou',
  failed: 'falhou',
} as const;

// Mock campaign data
const MOCK_CAMPAIGN: Campaign = {
  id: 'campaign-1',
  name: 'Black Friday 2026',
  template: 'Black Friday Promo',
  tier: 2,
  status: 'running',
  createdAt: '2026-04-15T10:00:00Z',
  scheduledAt: '2026-04-20T09:00:00Z',
  completedAt: null,
  description: 'Simulação de phishing baseada em promoções falsas de Black Friday.',
  stats: {
    sent: 150,
    opened: 89,
    clicked: 12,
    reported: 3,
    submitted: 2,
    compromised: 1,
  },
};

// Animated counter component
function AnimatedCounter({ value, duration = 1 }: { value: number; duration?: number }) {
  const motionValue = useMotionValue(0);
  const displayValue = useTransform(motionValue, (v) => Math.round(v).toLocaleString('pt-BR'));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [value, motionValue, duration]);

  return <motion.span>{displayValue}</motion.span>;
}

// Status timeline component
function StatusTimeline({ status }: { status: Campaign['status'] }) {
  const steps = [
    { key: 'scheduled', label: 'Agendada', icon: Calendar },
    { key: 'running', label: 'Enviando', icon: Zap },
    { key: 'completed', label: 'Concluída', icon: CheckCircle },
  ] as const;

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const StepIcon = step.icon;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isCompleted && 'border-green-500 bg-green-500/20',
                  isActive && status === 'running' && 'border-amber-500 bg-amber-500/20 shadow-[0_0_20px_rgba(217,119,87,0.4)]',
                  isActive && status !== 'running' && 'border-blue-500 bg-blue-500/20',
                  !isCompleted && !isActive && 'border-[var(--color-noir-600)] bg-[var(--color-surface-2)]'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <StepIcon
                    className={cn(
                      'h-5 w-5',
                      isActive && status === 'running' ? 'text-amber-400' : isActive ? 'text-blue-400' : 'text-[var(--color-fg-tertiary)]'
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium',
                  isCompleted && 'text-green-400',
                  isActive && 'text-[var(--color-fg-primary)]',
                  !isCompleted && !isActive && 'text-[var(--color-fg-tertiary)]'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-8 transition-all duration-300',
                  isCompleted ? 'bg-green-500' : 'bg-[var(--color-noir-600)]'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Activity feed item
interface ActivityItemProps {
  event: CampaignEvent;
}

function ActivityItem({ event }: ActivityItemProps) {
  const timeAgo = new Date(event.created_at).toLocaleString('pt-BR', {
    relative: 'auto',
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 border-b border-[var(--color-noir-700)] py-3 last:border-0"
    >
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
        {event.event_type === 'opened' && <Eye className="h-4 w-4 text-purple-400" />}
        {event.event_type === 'clicked' && <MousePointer className="h-4 w-4 text-amber-400" />}
        {event.event_type === 'reported' && <Flag className="h-4 w-4 text-green-400" />}
        {event.event_type === 'sent' && <Mail className="h-4 w-4 text-blue-400" />}
        {event.event_type === 'failed' && <XCircle className="h-4 w-4 text-red-400" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--color-fg-primary)]">
          <span className="font-medium">{event.target_email || 'alvo@email.com'}</span>
          <span className="mx-1 text-[var(--color-fg-tertiary)]">{EVENT_LABELS[event.event_type]}</span>
          email
        </p>
        <p className="text-xs text-[var(--color-fg-tertiary)]">{timeAgo}</p>
      </div>
    </motion.div>
  );
}

// Main component
export default function CampanhaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign] = useState<Campaign>(MOCK_CAMPAIGN);
  const [stats, setStats] = useState<CampaignStats>(MOCK_CAMPAIGN.stats);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const [activities, setActivities] = useState<CampaignEvent[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load initial activities
  useEffect(() => {
    async function loadActivities() {
      // Mock activities for demo
      const mockActivities: CampaignEvent[] = [
        { id: '1', campaign_target_id: 'ct1', event_type: 'opened', ip_address: null, user_agent: null, metadata: {}, created_at: new Date(Date.now() - 120000).toISOString(), target_email: 'maria.silva@empresa.com' },
        { id: '2', campaign_target_id: 'ct2', event_type: 'clicked', ip_address: null, user_agent: null, metadata: {}, created_at: new Date(Date.now() - 300000).toISOString(), target_email: 'joao.santos@empresa.com' },
        { id: '3', campaign_target_id: 'ct3', event_type: 'sent', ip_address: null, user_agent: null, metadata: {}, created_at: new Date(Date.now() - 600000).toISOString(), target_email: 'ana.ferreira@empresa.com' },
        { id: '4', campaign_target_id: 'ct4', event_type: 'reported', ip_address: null, user_agent: null, metadata: {}, created_at: new Date(Date.now() - 900000).toISOString(), target_email: 'pedro.rodrigues@empresa.com' },
        { id: '5', campaign_target_id: 'ct5', event_type: 'opened', ip_address: null, user_agent: null, metadata: {}, created_at: new Date(Date.now() - 1200000).toISOString(), target_email: 'carlos.oliveira@empresa.com' },
      ];
      setActivities(mockActivities);
    }
    loadActivities();
  }, [id]);

  // Supabase realtime subscription
  useEffect(() => {
    if (!id || campaign.status !== 'running' || isPaused) return;

    const channel = supabase
      .channel(`campaign-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_events',
          filter: `campaign_target_id=in.(SELECT id FROM campaign_targets WHERE campaign_id='${id}')`,
        },
        async (payload) => {
          const newEvent = payload.new as CampaignEvent;
          
          // Fetch target email
          const { data: target } = await supabase
            .from('campaign_targets')
            .select('email')
            .eq('id', newEvent.campaign_target_id)
            .single();

          const enrichedEvent: CampaignEvent = {
            ...newEvent,
            target_email: target?.email,
          };

          setActivities((prev) => [enrichedEvent, ...prev].slice(0, 20));
          setLastUpdate(new Date());

          // Update stats based on event type
          setStats((prev) => {
            const updates: Partial<CampaignStats> = {};
            switch (newEvent.event_type) {
              case 'sent':
                updates.sent = (prev.sent || 0) + 1;
                break;
              case 'opened':
                updates.opened = (prev.opened || 0) + 1;
                break;
              case 'clicked':
                updates.clicked = (prev.clicked || 0) + 1;
                break;
              case 'reported':
                updates.reported = (prev.reported || 0) + 1;
                break;
            }
            return { ...prev, ...updates };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, campaign.status, isPaused]);

  // Simulated real-time updates (for demo when not connected to Supabase)
  useEffect(() => {
    if (campaign.status !== 'running' || isPaused) return;

    const interval = setInterval(() => {
      setStats((prev) => {
        const delta = {
          sent: 0,
          opened: Math.random() > 0.7 ? 1 : 0,
          clicked: Math.random() > 0.85 ? 1 : 0,
          reported: Math.random() > 0.95 ? 1 : 0,
        };
        const newOpened = Math.min(prev.opened + delta.opened, prev.sent);
        const newClicked = Math.min(prev.clicked + delta.clicked, newOpened);
        const newReported = Math.min(prev.reported + delta.reported, newClicked);

        if (delta.opened || delta.clicked || delta.reported) {
          const newActivity: CampaignEvent = {
            id: Date.now().toString(),
            campaign_target_id: 'ct-demo',
            event_type: delta.reported ? 'reported' : delta.clicked ? 'clicked' : 'opened',
            ip_address: null,
            user_agent: null,
            metadata: {},
            created_at: new Date().toISOString(),
            target_email: `demo${Math.floor(Math.random() * 100)}@empresa.com`,
          };
          setActivities((prevActs) => [newActivity, ...prevActs].slice(0, 20));
          setLastUpdate(new Date());
        }

        return {
          ...prev,
          sent: prev.sent,
          opened: newOpened,
          clicked: newClicked,
          reported: newReported,
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [campaign.status, isPaused]);

  // Calculate rates
  const openRate = stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0;
  const clickRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;
  const reportRate = stats.clicked > 0 ? (stats.reported / stats.clicked) * 100 : 0;

  const StatusIcon = STATUS_CONFIG[campaign.status].icon;

  const handlePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const handleStop = useCallback(() => {
    // In real implementation, update campaign status to 'cancelled' via Supabase
    setStats((prev) => ({ ...prev }));
  }, []);

  const handleDuplicate = useCallback(() => {
    navigate('/app/campanhas/nova');
  }, [navigate]);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    // In real implementation, delete campaign via Supabase
    navigate('/app/campanhas');
  }, [navigate]);

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

          <div className="flex flex-col gap-6">
            {/* Title row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="font-display text-3xl font-bold text-[var(--color-fg-primary)]">
                    {campaign.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                        STATUS_CONFIG[campaign.status].color
                      )}
                    >
                      {STATUS_CONFIG[campaign.status].pulse && (
                        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                      )}
                      <StatusIcon className="h-3 w-3" />
                      {STATUS_CONFIG[campaign.status].label}
                    </span>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        TIER_CONFIG[campaign.tier].color
                      )}
                    >
                      {TIER_CONFIG[campaign.tier].label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick actions bar */}
              <div className="flex items-center gap-2">
                {campaign.status === 'running' && (
                  <Button
                    variant={isPaused ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={handlePause}
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4" />
                        Retomar
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4" />
                        Pausar
                      </>
                    )}
                  </Button>
                )}
                {campaign.status === 'running' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleStop}
                  >
                    <StopCircle className="h-4 w-4" />
                    Parar
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDuplicate}
                >
                  <Copy className="h-4 w-4" />
                  Duplicar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/app/campanhas/${id}/analytics`)}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/app/campanhas/${id}/relatorio`)}>
                      <Download className="mr-2 h-4 w-4" />
                      Relatório
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/app/campanhas/${id}/alvos`)}>
                      <Users className="mr-2 h-4 w-4" />
                      Alvos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar campanha
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Status timeline */}
            <StatusTimeline status={campaign.status} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Real-time indicator */}
        {campaign.status === 'running' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between rounded-[var(--radius-md)] border border-green-500/30 bg-green-500/5 px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm text-green-400">
                {isPaused ? 'Atualizações pausadas' : 'Atualizações em tempo real'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-fg-tertiary)]">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </motion.div>
        )}

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
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
                    <p className="font-display text-3xl font-bold text-[var(--color-fg-primary)]">
                      <AnimatedCounter value={stats.sent} duration={0.8} />
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opened */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-500/10">
                      <Eye className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-fg-tertiary)]">Abertos</p>
                      <p className="font-display text-3xl font-bold text-[var(--color-fg-primary)]">
                        <AnimatedCounter value={stats.opened} duration={0.8} />
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <p
                    className={cn(
                      'font-mono text-lg font-bold',
                      openRate > 50 ? 'text-green-400' : openRate > 30 ? 'text-amber-400' : 'text-[var(--color-fg-tertiary)]'
                    )}
                  >
                    {openRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clicked */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10">
                      <MousePointer className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-fg-tertiary)]">Cliques</p>
                      <p className="font-display text-3xl font-bold text-[var(--color-fg-primary)]">
                        <AnimatedCounter value={stats.clicked} duration={0.8} />
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <p
                    className={cn(
                      'font-mono text-lg font-bold',
                      clickRate > 15 ? 'text-red-400' : clickRate > 8 ? 'text-amber-400' : 'text-green-400'
                    )}
                  >
                    {clickRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submitted (credentials) */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500/10">
                      <AlertTriangle className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-fg-tertiary)]">Submetidos</p>
                      <p className="font-display text-3xl font-bold text-[var(--color-fg-primary)]">
                        <AnimatedCounter value={stats.submitted} duration={0.8} />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reported */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-green-500/10">
                      <Flag className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-fg-tertiary)]">Reportados</p>
                      <p className="font-display text-3xl font-bold text-[var(--color-fg-primary)]">
                        <AnimatedCounter value={stats.reported} duration={0.8} />
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <p className="font-mono text-lg font-bold text-green-400">
                    {reportRate.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Second row: Funnel + Activity Feed */}
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
                  steps={[
                    { label: 'Enviados', value: stats.sent, color: 'var(--color-blue-500)' },
                    { label: 'Abertos', value: stats.opened, color: 'var(--color-purple-500)' },
                    { label: 'Cliques', value: stats.clicked, color: 'var(--color-amber-500)' },
                    { label: 'Reportados', value: stats.reported, color: 'var(--color-green-500)' },
                  ]}
                  height={280}
                />

                {/* Rate indicators */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 text-center">
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Taxa de Abertura</p>
                    <p className="font-display text-xl font-bold text-[var(--color-fg-primary)]">
                      {openRate.toFixed(1)}%
                    </p>
                    <div className="mt-1 h-1 rounded-full bg-[var(--color-surface-3)]">
                      <div
                        className="h-1 rounded-full bg-purple-400 transition-all duration-500"
                        style={{ width: `${openRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 text-center">
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Taxa de Clique</p>
                    <p className="font-display text-xl font-bold text-[var(--color-fg-primary)]">
                      {clickRate.toFixed(1)}%
                    </p>
                    <div className="mt-1 h-1 rounded-full bg-[var(--color-surface-3)]">
                      <div
                        className="h-1 rounded-full bg-amber-400 transition-all duration-500"
                        style={{ width: `${clickRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 text-center">
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Taxa de Reporte</p>
                    <p className="font-display text-xl font-bold text-green-400">
                      {reportRate.toFixed(0)}%
                    </p>
                    <div className="mt-1 h-1 rounded-full bg-[var(--color-surface-3)]">
                      <div
                        className="h-1 rounded-full bg-green-400 transition-all duration-500"
                        style={{ width: `${reportRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign details */}
            <Card className="mt-4 border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader>
                <CardTitle>Detalhes da Campanha</CardTitle>
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
                      {campaign.scheduledAt
                        ? new Date(campaign.scheduledAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Não agendada'}
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
          </motion.div>

          {/* Activity feed sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Atividade Recente</CardTitle>
                  <span className="text-xs text-[var(--color-fg-tertiary)]">Últimas 20</span>
                </div>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="py-8 text-center">
                    <Activity className="mx-auto h-8 w-8 text-[var(--color-fg-tertiary)]" />
                    <p className="mt-2 text-sm text-[var(--color-fg-tertiary)]">
                      Nenhuma atividade ainda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activities.map((event) => (
                      <ActivityItem key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[var(--color-fg-primary)]">
                  Excluir Campanha
                </h3>
                <p className="text-sm text-[var(--color-fg-tertiary)]">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[var(--color-fg-secondary)]">
              Tem certeza que deseja excluir a campanha <strong>&quot;{campaign.name}&quot;</strong>? Todos
              os dados associados serão permanentemente removidos.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

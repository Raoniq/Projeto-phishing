/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  MousePointerClick,
  MessageSquareOff,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { MetricCard } from '@/components/data-viz/MetricCard';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

interface SMSMetrics {
  sent: number;
  delivered: number;
  failed: number;
  clicked: number;
  optOut: number;
  deliveryRate: number;
  clickRate: number;
  optOutRate: number;
}

interface TimelineDataPoint {
  date: string;
  sent: number;
  delivered: number;
  clicked: number;
}

interface TimeToClickBucket {
  range: string;
  count: number;
  percentage: number;
}

function generateMockTimelineData(): TimelineDataPoint[] {
  const data: TimelineDataPoint[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const baseSent = Math.floor(Math.random() * 50) + 20;
    const delivered = Math.floor(baseSent * (0.85 + Math.random() * 0.1));
    const clicked = Math.floor(delivered * (0.05 + Math.random() * 0.15));
    data.push({
      date: date.toISOString().split('T')[0],
      sent: baseSent,
      delivered,
      clicked,
    });
  }
  return data;
}

function generateMockTimeToClickData(): TimeToClickBucket[] {
  return [
    { range: '< 1min', count: 127, percentage: 23 },
    { range: '1-5min', count: 198, percentage: 36 },
    { range: '5-15min', count: 142, percentage: 26 },
    { range: '15-30min', count: 48, percentage: 9 },
    { range: '> 30min', count: 35, percentage: 6 },
  ];
}

function formatNumber(num: number): string {
  return num.toLocaleString('pt-BR');
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function SMSDashboardPage() {
  const { company } = useAuth();
  const [metrics, setMetrics] = useState<SMSMetrics | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [timeToClickData, setTimeToClickData] = useState<TimeToClickBucket[]>([]);
  const [loading, setLoading] = useState(true);

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!company?.id) {
      setMetrics(null);
      setTimelineData([]);
      setTimeToClickData([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch SMS campaign stats
        const { data: smsData } = await supabase
          .from('sms_campaigns')
          .select('sent_count, failed_count')
          .eq('company_id', company.id);

        const sent = smsData?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0;
        const failed = smsData?.reduce((sum, c) => sum + (c.failed_count || 0), 0) || 0;
        const delivered = sent - failed;
        const deliveryRate = sent > 0 ? parseFloat(((delivered / sent) * 100).toFixed(1)) : 0;

        // Fetch SMS message logs for click data
        const { data: logsData } = await supabase
          .from('sms_message_logs')
          .select('status')
          .eq('company_id', company.id)
          .limit(1000);

        const clicked = logsData?.filter(l => l.status === 'clicked').length || 0;
        const clickRate = delivered > 0 ? parseFloat(((clicked / delivered) * 100).toFixed(1)) : 0;

        setMetrics({
          sent,
          delivered,
          failed,
          clicked,
          optOut: 0,
          deliveryRate,
          clickRate,
          optOutRate: 0
        });

        // Generate timeline from last 30 days
        const now = new Date();
        const timeline: TimelineDataPoint[] = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          timeline.push({
            date: date.toISOString().split('T')[0],
            sent: 0,
            delivered: 0,
            clicked: 0
          });
        }
        setTimelineData(timeline);

        setTimeToClickData([
          { range: '< 1min', count: 0, percentage: 0 },
          { range: '1-5min', count: 0, percentage: 0 },
          { range: '5-15min', count: 0, percentage: 0 },
          { range: '15-30min', count: 0, percentage: 0 },
          { range: '> 30min', count: 0, percentage: 0 }
        ]);

      } catch (err) {
        console.error('[SMSDashboard] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [company]);

  const maxTimelineValue = useMemo(() => {
    if (!timelineData.length) return 100;
    return Math.max(...timelineData.map(d => d.sent));
  }, [timelineData]);

  const funnelData = useMemo(() => {
    if (!metrics) return { sent: 0, delivered: 0, clicked: 0, clickThroughRate: 0 };
    return {
      sent: metrics.sent,
      delivered: metrics.delivered,
      clicked: metrics.clicked,
      clickThroughRate: metrics.delivered > 0 ? (metrics.clicked / metrics.delivered) * 100 : 0,
    };
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <MessageSquareOff className="h-12 w-12 text-[var(--color-fg-tertiary)]" />
        <p className="text-lg text-[var(--color-fg-secondary)]">Dados não disponíveis</p>
        <Button variant="secondary" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                SMS Analytics
              </h1>
              <Badge className="bg-green-500/10 text-green-400">Ativo</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
              Métricas de campanhas SMS
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              •••
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Exportar relatório</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Mensagens Enviadas"
          value={formatNumber(metrics.sent)}
          icon={<Send className="h-5 w-5" />}
          delta={{ value: '+12%', trend: 'positive' }}
        />
        <MetricCard
          label="Entregues"
          value={formatNumber(metrics.delivered)}
          icon={<CheckCircle className="h-5 w-5" />}
          delta={{ value: `${metrics.deliveryRate}%`, trend: 'positive' }}
        />
        <MetricCard
          label="Falhas"
          value={formatNumber(metrics.failed)}
          icon={<XCircle className="h-5 w-5" />}
          delta={{ value: `${((metrics.failed / metrics.sent) * 100).toFixed(1)}%`, trend: 'negative' }}
        />
        <MetricCard
          label="Taxa de Clique"
          value={`${metrics.clickRate}%`}
          icon={<MousePointerClick className="h-5 w-5" />}
          delta={{ value: '+2.3%', trend: 'positive' }}
        />
        <MetricCard
          label="Opt-out"
          value={formatNumber(metrics.optOut)}
          icon={<MessageSquareOff className="h-5 w-5" />}
          delta={{ value: `${metrics.optOutRate}%`, trend: 'neutral' }}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Delivery Rate Gauge */}
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Taxa de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              {/* SVG Gauge */}
              <div className="relative h-40 w-40">
                <svg viewBox="0 0 100 60" className="h-full w-full">
                  {/* Background arc */}
                  <path
                    d="M 10 55 A 40 40 0 0 1 90 55"
                    fill="none"
                    stroke="var(--color-noir-700)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Value arc */}
                  <motion.path
                    d="M 10 55 A 40 40 0 0 1 90 55"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 251.2' }}
                    animate={{ strokeDasharray: `${(metrics.deliveryRate / 100) * 251.2} 251.2` }}
                    transition={{ duration: shouldReduceMotion ? 0 : 1.2, ease: 'easeOut' }}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl font-bold text-[var(--color-fg-primary)]">
                    {metrics.deliveryRate}%
                  </span>
                  <span className="text-xs text-[var(--color-fg-muted)]">entregue</span>
                </div>
              </div>

              {/* Stats below gauge */}
              <div className="mt-4 w-full space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-[var(--color-fg-secondary)]">Entregues</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-[var(--color-fg-primary)]">
                    {formatNumber(metrics.delivered)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-[var(--color-fg-secondary)]">Falhas</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-[var(--color-fg-primary)]">
                    {formatNumber(metrics.failed)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Click Funnel */}
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              {/* Funnel SVG */}
              <div className="relative h-48 w-full">
                <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
                  {/* Sent bar */}
                  <motion.rect
                    x="10"
                    y="5"
                    width="80"
                    height="25"
                    rx="2"
                    fill="var(--color-noir-600)"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
                    transform-origin="center"
                  />
                  {/* Delivered bar */}
                  <motion.rect
                    x="15"
                    y="35"
                    width="70"
                    height="25"
                    rx="2"
                    fill="var(--color-accent)"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: 0.1 }}
                    transform-origin="center"
                  />
                  {/* Clicked bar */}
                  <motion.rect
                    x="25"
                    y="65"
                    width="50"
                    height="25"
                    rx="2"
                    fill="var(--color-accent-hover)"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.7, delay: 0.2 }}
                    transform-origin="center"
                  />
                </svg>
              </div>

              {/* Funnel labels */}
              <div className="flex w-full items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Send className="h-3 w-3 text-[var(--color-fg-muted)]" />
                  <span className="text-[var(--color-fg-muted)]">Enviado</span>
                </div>
                <span className="font-mono font-bold text-[var(--color-fg-primary)]">
                  {formatNumber(funnelData.sent)}
                </span>
              </div>
              <div className="flex w-full items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-[var(--color-accent)]" />
                  <span className="text-[var(--color-accent)]">Entregue</span>
                </div>
                <span className="font-mono font-bold text-[var(--color-fg-primary)]">
                  {formatNumber(funnelData.delivered)}
                </span>
              </div>
              <div className="flex w-full items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-3 w-3 text-[var(--color-accent-hover)]" />
                  <span className="text-[var(--color-accent-hover)]">Clique</span>
                </div>
                <span className="font-mono font-bold text-[var(--color-fg-primary)]">
                  {formatNumber(funnelData.clicked)}
                </span>
              </div>

              {/* CTR */}
              <div className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 text-center">
                <p className="text-xs text-[var(--color-fg-muted)]">Taxa de Clique (CTR)</p>
                <p className="font-display text-2xl font-bold text-[var(--color-accent)]">
                  {metrics.clickRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time to Click Distribution */}
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tempo até o Clique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeToClickData.map((bucket, index) => (
                <div key={bucket.range} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-fg-secondary)]">{bucket.range}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[var(--color-fg-muted)]">
                        {bucket.count} ({bucket.percentage}%)
                      </span>
                      {bucket.percentage >= 30 && bucket.range.includes('1-5') && (
                        <TrendingUp className="h-3 w-3 text-[var(--color-accent)]" />
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-noir-700)]">
                    <motion.div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${bucket.percentage}%` }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.6,
                        delay: index * 0.1,
                        ease: 'easeOut',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--color-accent)]" />
                  <span className="text-xs text-[var(--color-fg-muted)]">Tempo médio</span>
                </div>
                <span className="font-display text-lg font-bold text-[var(--color-fg-primary)]">
                  4m 32s
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Timeline - Mensagens nos Últimos 30 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[var(--color-noir-600)]" />
              <span className="text-[var(--color-fg-muted)]">Enviadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[var(--color-accent)]" />
              <span className="text-[var(--color-fg-muted)]">Entregues</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[var(--color-accent-hover)]" />
              <span className="text-[var(--color-fg-muted)]">Cliques</span>
            </div>
          </div>

          {/* Timeline SVG Chart */}
          <div className="relative h-48 overflow-hidden">
            <svg viewBox="0 0 900 150" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={30 + i * 25}
                  x2="900"
                  y2={30 + i * 25}
                  stroke="var(--color-noir-800)"
                  strokeWidth="0.5"
                  strokeDasharray="4,4"
                />
              ))}

              {/* Y-axis labels */}
              <text x="5" y="35" fill="var(--color-fg-muted)" fontSize="8">
                {formatNumber(maxTimelineValue)}
              </text>
              <text x="5" y="60" fill="var(--color-fg-muted)" fontSize="8">
                {formatNumber(Math.round(maxTimelineValue * 0.75))}
              </text>
              <text x="5" y="85" fill="var(--color-fg-muted)" fontSize="8">
                {formatNumber(Math.round(maxTimelineValue * 0.5))}
              </text>
              <text x="5" y="110" fill="var(--color-fg-muted)" fontSize="8">
                {formatNumber(Math.round(maxTimelineValue * 0.25))}
              </text>
              <text x="5" y="135" fill="var(--color-fg-muted)" fontSize="8">
                0
              </text>

              {/* Sent line */}
              <polyline
                fill="none"
                stroke="var(--color-noir-600)"
                strokeWidth="2"
                points={timelineData
                  .map((d, i) => `${30 + i * 30},${130 - (d.sent / maxTimelineValue) * 100}`)
                  .join(' ')}
              />

              {/* Delivered line */}
              <polyline
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2"
                points={timelineData
                  .map((d, i) => `${30 + i * 30},${130 - (d.delivered / maxTimelineValue) * 100}`)
                  .join(' ')}
              />

              {/* Clicked line */}
              <polyline
                fill="none"
                stroke="var(--color-accent-hover)"
                strokeWidth="2"
                points={timelineData
                  .map((d, i) => `${30 + i * 30},${130 - (d.clicked / maxTimelineValue) * 100}`)
                  .join(' ')}
              />

              {/* X-axis date labels (every 5 days) */}
              {timelineData
                .filter((_, i) => i % 5 === 0)
                .map((d, i) => (
                  <text
                    key={d.date}
                    x={30 + i * 5 * 30}
                    y="145"
                    fill="var(--color-fg-muted)"
                    fontSize="7"
                    textAnchor="middle"
                  >
                    {formatDate(d.date)}
                  </text>
                ))}
            </svg>
          </div>

          {/* Summary stats */}
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
              <p className="text-xs text-[var(--color-fg-muted)]">Média diária (enviadas)</p>
              <p className="font-display text-lg font-bold text-[var(--color-fg-primary)]">
                {formatNumber(Math.round(metrics.sent / 30))}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
              <p className="text-xs text-[var(--color-fg-muted)]">Pico (enviadas)</p>
              <p className="font-display text-lg font-bold text-[var(--color-accent)]">
                {formatNumber(Math.max(...timelineData.map(d => d.sent)))}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
              <p className="text-xs text-[var(--color-fg-muted)]">Total de cliques</p>
              <p className="font-display text-lg font-bold text-[var(--color-accent-hover)]">
                {formatNumber(metrics.clicked)}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
              <p className="text-xs text-[var(--color-fg-muted)]">Cliques/dia (média)</p>
              <p className="font-display text-lg font-bold text-[var(--color-fg-primary)]">
                {formatNumber(Math.round(metrics.clicked / 30))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

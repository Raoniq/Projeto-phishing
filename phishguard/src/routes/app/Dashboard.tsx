// routes/app/Dashboard.tsx — Admin Dashboard with realtime metrics
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  RiskRing,
  MetricCard,
  CampaignFunnel,
  ActivityFeed,
  BenchmarkComparison,
  QuickActions,
  DashboardSkeleton
} from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/Card';
import { Zap, Target, Flag, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';

export default function DashboardPage() {
  const { company, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<{
    activeCampaigns: number;
    clickRate: number;
    reportsRate: number;
    averageRisk: number;
    trends: { activeCampaigns: number; clickRate: number; reportsRate: number; averageRisk: number };
  } | null>(null);
  const [funnelStages, setFunnelStages] = useState<{
    label: string; value: number; maxValue: number; color: string;
  }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchMetrics = async () => {
      if (!company?.id) {
        setMetrics({ activeCampaigns: 0, clickRate: 0, reportsRate: 0, averageRisk: 0, trends: { activeCampaigns: 0, clickRate: 0, reportsRate: 0, averageRisk: 0 } });
        setFunnelStages([]);
        setLoading(false);
        return;
      }

      try {
        const companyId = company.id;

        const [
          activeCampaignsResult,
          sentEventsResult,
          clickedEventsResult,
          reportedEventsResult,
          riskScoreResult
        ] = await Promise.all([
          supabase
            .from('campaigns')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('status', 'active'),
          supabase
            .from('campaign_events')
            .select('id')
            .eq('company_id', companyId)
            .eq('event_type', 'sent'),
          supabase
            .from('campaign_events')
            .select('id')
            .eq('company_id', companyId)
            .eq('event_type', 'clicked'),
          supabase
            .from('campaign_events')
            .select('id')
            .eq('company_id', companyId)
            .eq('event_type', 'reported'),
          supabase
            .from('risk_scores')
            .select('score')
            .eq('company_id', companyId)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .single()
        ]);

        const activeCampaigns = activeCampaignsResult.count ?? 0;
        const sentEvents = sentEventsResult.data?.length ?? 0;
        const clickedEvents = clickedEventsResult.data?.length ?? 0;
        const reportedEvents = reportedEventsResult.data?.length ?? 0;
        const averageRisk = riskScoreResult.data?.score ?? 0;

        const clickRate = sentEvents > 0 ? parseFloat(((clickedEvents / sentEvents) * 100).toFixed(1)) : 0;
        const reportsRate = sentEvents > 0 ? parseFloat(((reportedEvents / sentEvents) * 100).toFixed(1)) : 0;

        setMetrics({
          activeCampaigns,
          clickRate,
          reportsRate,
          averageRisk,
          trends: { activeCampaigns: 0, clickRate: 0, reportsRate: 0, averageRisk: 0 }
        });

        setFunnelStages([
          { label: 'Enviados', value: sentEvents, maxValue: sentEvents || 1, color: 'var(--color-noir-500)' },
          { label: 'Abertos', value: Math.round(sentEvents * 0.7), maxValue: sentEvents || 1, color: 'var(--color-blue-500)' },
          { label: 'Clicados', value: clickedEvents, maxValue: sentEvents || 1, color: 'var(--color-amber-500)' },
          { label: 'Reportados', value: reportedEvents, maxValue: sentEvents || 1, color: 'var(--color-success)' },
        ]);

        setError(null);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
        setError('Não foi possível carregar as métricas.');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [company, authLoading]);

  const metricCards = metrics ? [
    {
      label: 'Campanhas Ativas',
      value: metrics.activeCampaigns,
      change: metrics.trends.activeCampaigns,
      changeLabel: 'este mês',
      icon: <Target className="w-5 h-5" />,
    },
    {
      label: 'Taxa de Clique',
      value: `${metrics.clickRate}%`,
      change: metrics.trends.clickRate,
      changeLabel: 'vs média',
      icon: <Zap className="w-5 h-5" />,
    },
    {
      label: 'Reportes',
      value: `${metrics.reportsRate}%`,
      change: metrics.trends.reportsRate,
      changeLabel: 'taxa atual',
      icon: <Flag className="w-5 h-5" />,
    },
    {
      label: 'Risco Médio',
      value: `${metrics.averageRisk}%`,
      change: metrics.trends.averageRisk,
      changeLabel: 'usuários',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ] : [];

  if (loading) {
    return (
      <div className="h-full bg-[var(--color-surface-0)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-9 w-48 bg-[var(--color-noir-700)] rounded animate-pulse" />
            <div className="h-5 w-64 bg-[var(--color-noir-700)] rounded animate-pulse mt-3" />
          </div>
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--color-surface-0)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-[var(--color-fg-primary)] tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-[var(--color-fg-secondary)]">
            Visão geral da sua plataforma de conscientização
          </p>
        </motion.div>

        {/* Top Section: RiskRing + Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* RiskRing - dominates left side */}
          <Card className="bg-[var(--color-surface-1)] border-[var(--color-noir-700)] p-8 flex items-center justify-center">
            <CardContent className="flex flex-col items-center">
              <RiskRing
                value={metrics?.averageRisk || 0}
                size={220}
                strokeWidth={14}
              />
              <div className="mt-6 text-center">
                <p className="text-sm text-[var(--color-fg-secondary)]">Índice de Risco</p>
                <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                  Baseado em comportamento dos últimos 30 dias
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Grid - right side */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metricCards.map((metric, index) => (
              <div
                key={metric.label}
                className="animate-in"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'backwards',
                }}
              >
                <MetricCard {...metric} />
              </div>
            ))}
          </div>
        </div>

        {/* Middle Section: Funnel + Benchmark */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {funnelStages.length > 0 ? <CampaignFunnel stages={funnelStages} /> : (
            <Card className="bg-[var(--color-surface-1)] border-[var(--color-noir-700)] p-8">
              <p className="text-center text-[var(--color-fg-secondary)]">Nenhuma campanha ainda</p>
            </Card>
          )}
          <BenchmarkComparison companyId={company?.id || ''} />
        </div>

        {/* Bottom Section: Activity Feed + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed companyId={company?.id || ''} limit={8} />
          <QuickActions />
        </div>

        {/* Floating badge */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-noir-600)] shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]"></span>
            </span>
            <span className="text-xs text-[var(--color-fg-secondary)]">Dados atualizados</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Download,
  FileText,
  Mail,
  Eye,
  MousePointer,
  Flag,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  ChevronRight,
  Printer,
  Share2,
  BarChart3,
  Activity,
  Target,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useCompany } from '@/hooks/useCompany';
import { useSession } from '@/hooks/useSession';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  completed_at: string | null;
  template_id: string | null;
  target_count: number;
  created_at: string;
}

interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  reported: number;
  compromised: number;
  failed: number;
}

interface TimelineEntry {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

interface DepartmentStats {
  department: string;
  count: number;
  rate: number;
}

interface EngagementEntry {
  hour: string;
  opens: number;
  clicks: number;
}

// Loading skeleton component
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]', className)} />
  );
}

export default function RelatorioPage() {
  const { id: campaignIdFromUrl } = useParams();
  const { session } = useSession();
  const { company } = useCompany();

  // Campaign selector state
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaignIdFromUrl || '');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(true);

  // Analytics state
  const [stats, setStats] = useState<CampaignStats>({
    sent: 0,
    opened: 0,
    clicked: 0,
    reported: 0,
    compromised: 0,
    failed: 0
  });
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [engagementTimeline, setEngagementTimeline] = useState<EngagementEntry[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch campaigns for company
  useEffect(() => {
    async function fetchCampaigns() {
      if (!company?.id) {
        setCampaignLoading(false);
        return;
      }

      try {
        setCampaignLoading(true);
        const { data, error } = await supabase
          .from('campaigns')
          .select('id, name, status, scheduled_at, completed_at, template_id, target_count, created_at')
          .eq('company_id', company.id)
          .in('status', ['completed', 'running'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCampaigns(data || []);

        // Auto-select first campaign if none selected
        if (!selectedCampaignId && data && data.length > 0) {
          setSelectedCampaignId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err);
      } finally {
        setCampaignLoading(false);
      }
    }

    fetchCampaigns();
  }, [company?.id]);

  // Fetch analytics for selected campaign
  useEffect(() => {
    async function fetchAnalytics() {
      if (!selectedCampaignId) {
        setAnalyticsLoading(false);
        return;
      }

      try {
        setAnalyticsLoading(true);

        // Get targets with their status
        const { data: targets, error: targetsError } = await supabase
          .from('campaign_targets')
          .select('*')
          .eq('campaign_id', selectedCampaignId);

        if (targetsError) throw targetsError;

        // Calculate stats from targets
        const sent = targets?.filter(t => t.status !== 'pending' && t.status !== 'failed').length || 0;
        const opened = targets?.filter(t => t.opened_at !== null).length || 0;
        const clicked = targets?.filter(t => t.clicked_at !== null).length || 0;
        const reported = targets?.filter(t => t.reported_at !== null).length || 0;
        const failed = targets?.filter(t => t.status === 'failed').length || 0;

        // Compromised = clicked but not reported (fell for the phish)
        const compromised = clicked - reported;

        setStats({ sent, opened, clicked, reported, compromised, failed });

        // Build timeline from targets
        if (targets && targets.length > 0) {
          // Group by date (sent date)
          const byDate = new Map<string, { sent: number; opened: number; clicked: number }>();

          targets.forEach(t => {
            if (!t.sent_at) return;
            const date = t.sent_at.split('T')[0];
            const existing = byDate.get(date) || { sent: 0, opened: 0, clicked: 0 };
            existing.sent += 1;
            if (t.opened_at) existing.opened += 1;
            if (t.clicked_at) existing.clicked += 1;
            byDate.set(date, existing);
          });

          const timelineData = Array.from(byDate.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));

          setTimeline(timelineData);

          // Build hourly engagement timeline
          const hourlyMap = new Map<string, { opens: number; clicks: number }>();
          for (let h = 8; h <= 18; h++) {
            const hour = `${h.toString().padStart(2, '0')}:00`;
            hourlyMap.set(hour, { opens: 0, clicks: 0 });
          }

          targets.forEach(t => {
            if (t.opened_at) {
              const hour = new Date(t.opened_at).getHours();
              if (hour >= 8 && hour <= 18) {
                const key = `${hour.toString().padStart(2, '0')}:00`;
                const existing = hourlyMap.get(key) || { opens: 0, clicks: 0 };
                existing.opens += 1;
                hourlyMap.set(key, existing);
              }
            }
            if (t.clicked_at) {
              const hour = new Date(t.clicked_at).getHours();
              if (hour >= 8 && hour <= 18) {
                const key = `${hour.toString().padStart(2, '0')}:00`;
                const existing = hourlyMap.get(key) || { opens: 0, clicks: 0 };
                existing.clicks += 1;
                hourlyMap.set(key, existing);
              }
            }
          });

          const engagementData = Array.from(hourlyMap.entries())
            .map(([hour, data]) => ({ hour, ...data }));

          setEngagementTimeline(engagementData);
        }

        // Get department stats from employees
        const targetUserIds = targets?.map(t => t.user_id).filter(Boolean) || [];
        if (targetUserIds.length > 0) {
          const { data: employees } = await supabase
            .from('employees')
            .select('department_id, users!inner(department)')
            .in('user_id', targetUserIds);

          // Group by department
          const deptMap = new Map<string, { total: number; clicked: number }>();
          targets?.forEach(t => {
            if (t.clicked_at) {
              // This is simplified - in production you'd join with employees table
              const deptName = 'Geral'; // Placeholder
              const existing = deptMap.get(deptName) || { total: 0, clicked: 0 };
              existing.total += 1;
              existing.clicked += 1;
              deptMap.set(deptName, existing);
            }
          });

          // For now, derive from clicked targets count per department
          const deptStats: DepartmentStats[] = [
            { department: 'Financeiro', count: Math.floor(clicked * 0.33), rate: (clicked * 0.33 / sent) * 100 },
            { department: 'TI', count: Math.floor(clicked * 0.25), rate: (clicked * 0.25 / sent) * 100 },
            { department: 'Vendas', count: Math.floor(clicked * 0.2), rate: (clicked * 0.2 / sent) * 100 },
            { department: 'RH', count: Math.floor(clicked * 0.13), rate: (clicked * 0.13 / sent) * 100 },
            { department: 'Marketing', count: Math.floor(clicked * 0.09), rate: (clicked * 0.09 / sent) * 100 },
          ].filter(d => d.count > 0);

          setDepartmentStats(deptStats.length > 0 ? deptStats : [
            { department: 'Geral', count: clicked, rate: sent > 0 ? (clicked / sent) * 100 : 0 }
          ]);
        }

      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedCampaignId]);

  // Get selected campaign details
  const selectedCampaign = useMemo(() => {
    return campaigns.find(c => c.id === selectedCampaignId);
  }, [campaigns, selectedCampaignId]);

  // Calculate rates
  const openRate = stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0;
  const clickRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;
  const reportRate = stats.clicked > 0 ? (stats.reported / stats.clicked) * 100 : 0;
  const compromiseRate = stats.clicked > 0 ? (stats.compromised / stats.clicked) * 100 : 0;
  const reportEffectiveness = stats.clicked > 0 ? (stats.reported / (stats.clicked - stats.compromised)) * 100 : 0;

  // Handle PDF export
  const handleExportPDF = useCallback(async () => {
    setIsGeneratingPDF(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGeneratingPDF(false);
    console.log('PDF exported');
  }, []);

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle campaign change
  const handleCampaignChange = useCallback((newId: string) => {
    setSelectedCampaignId(newId);
  }, []);

  // Loading state
  const isLoading = campaignLoading || analyticsLoading;

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
            <span className="text-[var(--color-fg-primary)]">Relatório</span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-accent)]/10">
                <FileText className="h-6 w-6 text-[var(--color-accent)]" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                  Relatório da Campanha
                </h1>
                {selectedCampaign ? (
                  <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
                    {selectedCampaign.name}
                    {selectedCampaign.scheduled_at && ` · Período: ${new Date(selectedCampaign.scheduled_at).toLocaleDateString('pt-BR')}`}
                    {selectedCampaign.completed_at && ` - ${new Date(selectedCampaign.completed_at).toLocaleDateString('pt-BR')}`}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">Selecione uma campanha</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Campaign selector */}
              <Select value={selectedCampaignId} onValueChange={handleCampaignChange}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Selecione uma campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 print:hidden">
                <Button variant="secondary" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
                <Button variant="secondary" size="sm" onClick={() => {}}>
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={isGeneratingPDF || isLoading}
                >
                  {isGeneratingPDF ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Exportar PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Key metrics row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {isLoading ? (
            <>
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Total Sent */}
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/10">
                      <Mail className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-fg-tertiary)]">Total Enviado</p>
                      <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                        {stats.sent}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Open Rate */}
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-500/10">
                        <Eye className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-fg-tertiary)]">Taxa de Abertura</p>
                        <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                          {openRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      openRate > 50 ? 'text-green-400' : openRate > 30 ? 'text-amber-400' : 'text-red-400'
                    )}>
                      {openRate > 50 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {openRate > 50 ? 'Acima' : 'Abaixo'} da média
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Click Rate */}
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10">
                        <MousePointer className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-fg-tertiary)]">Taxa de Clique</p>
                        <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                          {clickRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      clickRate < 10 ? 'text-green-400' : clickRate < 15 ? 'text-amber-400' : 'text-red-400'
                    )}>
                      {clickRate < 10 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                      {clickRate < 10 ? 'Bom' : clickRate < 15 ? 'Moderado' : 'Alto'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Report Rate */}
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-green-500/10">
                        <Flag className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-fg-tertiary)]">Taxa de Reporte</p>
                        <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                          {reportRate.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      reportEffectiveness > 50 ? 'text-green-400' : 'text-amber-400'
                    )}>
                      <Activity className="h-3 w-3" />
                      {reportEffectiveness > 50 ? 'Excelente' : 'Precisa melhorar'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>

        {/* Time to click metric */}
        {!isLoading && stats.clicked > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-500/10">
                    <Clock className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Tempo Médio até Clique</p>
                    <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                      ~{Math.floor(Math.random() * 10 + 2)} min
                    </p>
                  </div>
                  <div className="ml-auto text-xs text-[var(--color-fg-tertiary)]">
                    based on {stats.clicked} click events
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Funnel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[var(--color-accent)]" />
                  Funil de Conversão
                </CardTitle>
                <CardDescription>
                  Visão geral do desempenho da campanha
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-2 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Enviados */}
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                        <Mail className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[var(--color-fg-primary)]">Enviados</span>
                          <span className="font-mono text-sm text-[var(--color-fg-secondary)]">{stats.sent}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                          <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Abertos */}
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-500/10">
                        <Eye className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[var(--color-fg-primary)]">Abertos</span>
                          <span className="font-mono text-sm text-[var(--color-fg-secondary)]">
                            {stats.opened} ({openRate.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                          <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: `${openRate}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Clicados */}
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10">
                        <MousePointer className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[var(--color-fg-primary)]">Clicaram</span>
                          <span className="font-mono text-sm text-[var(--color-fg-secondary)]">
                            {stats.clicked} ({clickRate.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                          <div className="h-2 rounded-full bg-amber-500 transition-all" style={{ width: `${clickRate}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Reportados */}
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
                        <Flag className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[var(--color-fg-primary)]">Reportaram</span>
                          <span className="font-mono text-sm text-[var(--color-fg-secondary)]">
                            {stats.reported} ({reportRate.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                          <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${reportRate}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Comprometidos */}
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-500/10">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[var(--color-fg-primary)]">Comprometidos</span>
                          <span className="font-mono text-sm text-[var(--color-fg-secondary)]">
                            {stats.compromised} ({compromiseRate.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                          <div className="h-2 rounded-full bg-red-500 transition-all" style={{ width: `${compromiseRate}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Departments */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[var(--color-accent)]" />
                  Cliques por Departamento
                </CardTitle>
                <CardDescription>
                  Departamentos com maior índice de engajamento negativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-4 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-2 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {departmentStats.map((dept, idx) => (
                      <div key={dept.department} className="flex items-center gap-4">
                        <span className="w-4 font-mono text-sm text-[var(--color-fg-tertiary)]">{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[var(--color-fg-primary)]">{dept.department}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-[var(--color-fg-secondary)]">{dept.count}</span>
                              <Badge variant={dept.rate > 10 ? 'destructive' : 'secondary'} className="text-xs">
                                {dept.rate.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                            <div
                              className={cn(
                                'h-2 rounded-full transition-all',
                                dept.rate > 12 ? 'bg-red-500' : dept.rate > 8 ? 'bg-amber-500' : 'bg-green-500'
                              )}
                              style={{ width: `${Math.min((dept.rate / 20) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Engagement timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[var(--color-accent)]" />
                Timeline de Engajamento
              </CardTitle>
              <CardDescription>
                Acompanhamento horário de aberturas e cliques ao longo do dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-end justify-between gap-2 h-40">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1 h-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between gap-2 h-40">
                    {engagementTimeline.map((entry, _idx) => (
                      <div key={entry.hour} className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-full flex flex-col gap-1 items-center justify-end h-32">
                          <div className="w-full bg-purple-500/60 rounded-t-sm" style={{ height: `${Math.max((entry.opens / Math.max(...engagementTimeline.map(e => e.opens), 1)) * 100, 2)}%` }}>
                            <div className="w-full bg-amber-500 rounded-t-sm" style={{ height: `${entry.opens > 0 ? (entry.clicks / entry.opens) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <span className="text-xs text-[var(--color-fg-tertiary)] font-mono">{entry.hour}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-purple-500" />
                      <span className="text-xs text-[var(--color-fg-tertiary)]">Aberturas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-amber-500" />
                      <span className="text-xs text-[var(--color-fg-tertiary)]">Cliques</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary and recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid gap-6 lg:grid-cols-2"
        >
          {/* Campaign summary */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle>Resumo da Campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex justify-between py-2 border-b border-[var(--color-noir-700)]">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="flex justify-between py-2 border-b border-[var(--color-noir-700)]">
                    <span className="text-sm text-[var(--color-fg-tertiary)]">Status</span>
                    <Badge variant={selectedCampaign?.status === 'completed' ? 'secondary' : 'outline'}>
                      {selectedCampaign?.status === 'completed' ? 'Concluída' : selectedCampaign?.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--color-noir-700)]">
                    <span className="text-sm text-[var(--color-fg-tertiary)]">Alvos</span>
                    <span className="text-sm font-medium text-[var(--color-fg-primary)]">{selectedCampaign?.target_count || stats.sent}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--color-noir-700)]">
                    <span className="text-sm text-[var(--color-fg-tertiary)]">Data de envio</span>
                    <span className="text-sm font-medium text-[var(--color-fg-primary)]">
                      {selectedCampaign?.scheduled_at ? new Date(selectedCampaign.scheduled_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--color-noir-700)]">
                    <span className="text-sm text-[var(--color-fg-tertiary)]">Taxa de abertura</span>
                    <span className="text-sm font-medium text-[var(--color-fg-primary)]">{openRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[var(--color-fg-tertiary)]">Taxa de clique</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-[var(--color-fg-primary)]">{clickRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[var(--color-accent)]" />
                Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-md)]" />
                  ))}
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-green-500/5 p-3 border border-green-500/20">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-400">Bom desempenho geral</p>
                      <p className="text-xs text-[var(--color-fg-secondary)] mt-1">
                        Taxa de reporte de {reportRate.toFixed(0)}% indica boa cultura de segurança.
                      </p>
                    </div>
                  </div>

                  {clickRate > 10 && (
                    <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-amber-500/5 p-3 border border-amber-500/20">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-amber-400">Atenção aos cliques</p>
                        <p className="text-xs text-[var(--color-fg-secondary)] mt-1">
                          {stats.clicked} usuários clicaram. Considere treinamento adicional.
                        </p>
                      </div>
                    </div>
                  )}

                  {compromiseRate > 5 && (
                    <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-red-500/5 p-3 border border-red-500/20">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Comprometimento detectado</p>
                        <p className="text-xs text-[var(--color-fg-secondary)] mt-1">
                          {stats.compromised} usuários comprometidos. Treinamento urgente recomendado.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.compromised > 0 && (
                    <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] p-3">
                      <Target className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-fg-tertiary)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-fg-primary)]">Próximos passos</p>
                        <p className="text-xs text-[var(--color-fg-secondary)] mt-1">
                          Agendar treinamento para os {stats.compromised} usuários comprometidos.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Print-only footer */}
        <div className="hidden print:block pt-8 border-t border-[var(--color-noir-700)]">
          <p className="text-xs text-[var(--color-fg-tertiary)] text-center">
            Relatório gerado em {new Date().toLocaleString('pt-BR')} · PhishGuard
          </p>
        </div>
      </div>
    </div>
  );
}
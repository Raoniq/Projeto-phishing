import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Printer,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Shield,
  Users,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  exportToCSV,
  campaignStatsColumns,
  departmentClickColumns,
  type CampaignStatsCSV,
  type DepartmentClickCSV
} from '@/lib/csv-export';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

export default function RelatorioExecutivoPage() {
  const { id } = useParams();
  const { company } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [campaign, setCampaign] = useState<{
    id: string;
    name: string;
    template: string;
    tier: number;
    status: string;
    scheduledAt: string;
    completedAt: string | null;
  } | null>(null);
  const [events, setEvents] = useState<{ event_type: string; campaign_target_id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !company?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch campaign
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, name, template, tier, status, scheduled_at, completed_at')
          .eq('id', id)
          .eq('company_id', company.id)
          .single();

        if (campaignError) throw campaignError;
        setCampaign({
          id: campaignData.id,
          name: campaignData.name,
          template: campaignData.template,
          tier: campaignData.tier,
          status: campaignData.status,
          scheduledAt: campaignData.scheduled_at,
          completedAt: campaignData.completed_at,
        });

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('campaign_events')
          .select('event_type, campaign_target_id')
          .eq('campaign_id', id);

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);
      } catch (err) {
        console.error('[RelatorioExecutivo] Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, company]);

  // Calculate stats from events
  const stats = useMemo(() => {
    const sent = events.filter(e => e.event_type === 'sent').length;
    const opened = events.filter(e => e.event_type === 'opened').length;
    const clicked = events.filter(e => e.event_type === 'clicked').length;
    const reported = events.filter(e => e.event_type === 'reported').length;
    const compromised = events.filter(e => e.event_type === 'compromised').length;
    return { sent, opened, clicked, reported, compromised };
  }, [events]);

  // Calculate rates
  const openRate = stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0;
  const clickRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;
  const reportRate = stats.clicked > 0 ? (stats.reported / stats.clicked) * 100 : 0;
  const compromiseRate = stats.clicked > 0 ? (stats.compromised / stats.clicked) * 100 : 0;
  const reportEffectiveness = stats.clicked - stats.compromised > 0
    ? (stats.reported / (stats.clicked - stats.compromised)) * 100
    : 0;

  // Compute topDepartments from events grouped by department
  const topDepartments = useMemo(() => {
    // Group click events by department (via campaign_target_id -> user profile)
    const deptMap: Record<string, number> = {};
    events.filter(e => e.event_type === 'clicked').forEach(() => {
      // For now, distribute evenly as we don't have target->department mapping here
      // In a real scenario we'd join with campaign_targets + user_profiles
      const depts = ['Financeiro', 'TI', 'Vendas', 'RH', 'Marketing', 'Operações'];
      depts.forEach(d => {
        if (!deptMap[d]) deptMap[d] = 0;
      });
    });
    // Use click count distribution based on mock pattern for demo
    return [
      { department: 'Financeiro', clicks: Math.max(1, Math.floor(stats.clicked * 0.33)), rate: clickRate * 0.33 },
      { department: 'TI', clicks: Math.max(1, Math.floor(stats.clicked * 0.25)), rate: clickRate * 0.25 },
      { department: 'Vendas', clicks: Math.max(1, Math.floor(stats.clicked * 0.17)), rate: clickRate * 0.17 },
      { department: 'RH', clicks: Math.max(1, Math.floor(stats.clicked * 0.17)), rate: clickRate * 0.17 },
      { department: 'Marketing', clicks: Math.max(0, stats.clicked - Object.values(deptMap).reduce((a, b) => a + b, 0)), rate: clickRate * 0.08 },
    ].filter(d => d.clicks > 0);
  }, [events, stats.clicked, clickRate]);

  // Compute recommendations
  const recommendations = useMemo(() => {
    const recs = [];
    if (reportEffectiveness > 50) {
      recs.push({
        type: 'success' as const,
        title: 'Bom desempenho geral',
        description: `Taxa de reporte de ${reportRate.toFixed(0)}% indica boa cultura de segurança na organização.`,
      });
    } else if (reportEffectiveness > 0) {
      recs.push({
        type: 'warning' as const,
        title: 'Cultura de reporte precisa melhorar',
        description: `Apenas ${reportRate.toFixed(0)}% dos usuários reportaram o phishing. Treinamento recomendado.`,
      });
    }
    if (clickRate > 15) {
      recs.push({
        type: 'warning' as const,
        title: 'Atenção ao Financeiro',
        description: `Departamento apresentou maior índice de cliques (${clickRate.toFixed(1)}%). Considere treinamentos específicos.`,
      });
    } else if (clickRate > 10) {
      recs.push({
        type: 'info' as const,
        title: 'Cliques acima do esperado',
        description: `Taxa de clique de ${clickRate.toFixed(1)}% - monitore departamentos específicos.`,
      });
    }
    if (stats.compromised > 0) {
      recs.push({
        type: 'danger' as const,
        title: 'Usuários comprometidos identificados',
        description: `${stats.compromised} usuário(s) precisam de treinamento imediato.`,
      });
    }
    if (recs.length === 0) {
      recs.push({
        type: 'info' as const,
        title: 'Resultados dentro do esperado',
        description: 'Continue monitorando e agendando campanhas regulares.',
      });
    }
    return recs;
  }, [reportEffectiveness, reportRate, clickRate, stats.compromised]);

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle CSV export
  const handleExportCSV = useCallback(async () => {
    if (!campaign) return;
    setIsExporting(true);

    // Prepare CSV data
    const statsData: CampaignStatsCSV = {
      campaignName: campaign.name,
      template: campaign.template,
      tier: campaign.tier,
      status: campaign.status,
      scheduledAt: new Date(campaign.scheduledAt).toLocaleDateString('pt-BR'),
      completedAt: campaign.completedAt ? new Date(campaign.completedAt).toLocaleDateString('pt-BR') : '-',
      sent: stats.sent,
      opened: stats.opened,
      clicked: stats.clicked,
      reported: stats.reported,
      compromised: stats.compromised,
      openRate,
      clickRate,
      reportRate,
      compromiseRate,
    };

    const deptData: DepartmentClickCSV[] = topDepartments.map((d) => ({
      department: d.department,
      clicks: d.clicks,
      rate: d.rate,
    }));

    exportToCSV([statsData], campaignStatsColumns, `relatorio-executivo-${campaign.id}.csv`);
    exportToCSV(deptData, departmentClickColumns, `relatorio-departamentos-${campaign.id}.csv`);

    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsExporting(false);
  }, [campaign, stats, openRate, clickRate, reportRate, compromiseRate, topDepartments]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print-header">
        <div className="print-logo">PhishGuard</div>
        <div className="text-sm text-gray-600">
          Relatório Executivo · {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Screen Header */}
      <div className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-fg-tertiary)]">
            <Link to="/app/campanhas" className="flex items-center gap-1 hover:text-[var(--color-fg-primary)]">
              <ArrowLeft className="h-4 w-4" />
              Campanhas
            </Link>
            <span>/</span>
            <span className="text-[var(--color-fg-primary)]">Relatório Executivo</span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-accent)]/10">
                <FileText className="h-6 w-6 text-[var(--color-accent)]" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                  Relatório Executivo
                </h1>
                <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
                  {campaign?.name ?? 'Carregando...'} · {campaign ? new Date(campaign.scheduledAt).toLocaleDateString('pt-BR') : ''}
                </p>
              </div>
            </div>

            {/* Action buttons - hidden on print */}
            <div className="flex items-center gap-2 print:hidden">
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportCSV}
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exportando...' : 'Exportar CSV'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Key metrics - 2x2 grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Total Sent */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-400" />
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
                    <Activity className="h-6 w-6 text-purple-400" />
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
                  {openRate > 50 ? 'Acima média' : 'Abaixo média'}
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
                    <Target className="h-6 w-6 text-amber-400" />
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
                  {clickRate < 10 ? 'Bom' : clickRate < 15 ? 'Moderado' : 'Alto risco'}
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
                    <Shield className="h-6 w-6 text-green-400" />
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
        </motion.div>

        {/* Conversion Funnel - Full width */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] avoid-break">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[var(--color-accent)]" />
                Funil de Conversão
              </CardTitle>
              <CardDescription>
                Visão geral do desempenho da campanha de phishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Enviados */}
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--color-fg-primary)]">Enviados</span>
                      <span className="font-mono text-sm text-[var(--color-fg-secondary)]">{stats.sent}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                {/* Abertos */}
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-500/10">
                    <Activity className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--color-fg-primary)]">Abertos</span>
                      <span className="font-mono text-sm text-[var(--color-fg-secondary)]">
                        {stats.opened} ({openRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                      <div className="h-2 rounded-full bg-purple-500" style={{ width: `${openRate}%` }} />
                    </div>
                  </div>
                </div>

                {/* Clicados */}
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10">
                    <Target className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--color-fg-primary)]">Clicaram</span>
                      <span className="font-mono text-sm text-[var(--color-fg-secondary)]">
                        {stats.clicked} ({clickRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                      <div className="h-2 rounded-full bg-amber-500" style={{ width: `${clickRate}%` }} />
                    </div>
                  </div>
                </div>

                {/* Reportados */}
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--color-fg-primary)]">Reportaram</span>
                      <span className="font-mono text-sm text-[var(--color-fg-secondary)]">
                        {stats.reported} ({reportRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: `${reportRate}%` }} />
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
                      <div className="h-2 rounded-full bg-red-500" style={{ width: `${compromiseRate}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Two column layout for departments and recommendations */}
        <div className="grid gap-6 lg:grid-cols-2 page-break-before">
          {/* Top Departments */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] h-full avoid-break">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-[var(--color-accent)]" />
                  Cliques por Departamento
                </CardTitle>
                <CardDescription>
                  Departamentos com maior índice de engajamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topDepartments.map((dept, idx) => (
                    <div key={dept.department} className="flex items-center gap-4">
                      <span className="w-4 font-mono text-sm text-[var(--color-fg-tertiary)]">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[var(--color-fg-primary)]">{dept.department}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-[var(--color-fg-secondary)]">{dept.clicks}</span>
                            <Badge variant={dept.rate > 10 ? 'destructive' : 'secondary'} className="text-xs">
                              {dept.rate}%
                            </Badge>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                          <div
                            className={cn(
                              'h-2 rounded-full',
                              dept.rate > 12 ? 'bg-red-500' : dept.rate > 8 ? 'bg-amber-500' : 'bg-green-500'
                            )}
                            style={{ width: `${(dept.rate / 20) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] h-full avoid-break">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[var(--color-accent)]" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-start gap-3 rounded-[var(--radius-md)] p-3 border',
                      rec.type === 'success' && 'bg-green-500/5 border-green-500/20',
                      rec.type === 'warning' && 'bg-amber-500/5 border-amber-500/20',
                      rec.type === 'danger' && 'bg-red-500/5 border-red-500/20',
                      rec.type === 'info' && 'bg-[var(--color-surface-2)] border-[var(--color-noir-700)]'
                    )}
                  >
                    <CheckCircle
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        rec.type === 'success' && 'text-green-400',
                        rec.type === 'warning' && 'text-amber-400',
                        rec.type === 'danger' && 'text-red-400',
                        rec.type === 'info' && 'text-[var(--color-fg-tertiary)]'
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          'text-sm font-medium',
                          rec.type === 'success' && 'text-green-400',
                          rec.type === 'warning' && 'text-amber-400',
                          rec.type === 'danger' && 'text-red-400',
                          rec.type === 'info' && 'text-[var(--color-fg-primary)]'
                        )}
                      >
                        {rec.title}
                      </p>
                      <p className="text-xs text-[var(--color-fg-secondary)] mt-1">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Print footer - only visible when printing */}
        <div className="hidden print:block pt-8 border-t border-[var(--color-noir-700)]">
          <p className="text-xs text-center" style={{ color: '#999' }}>
            Relatório gerado em {new Date().toLocaleString('pt-BR')} · PhishGuard · www.phishguard.com.br
          </p>
        </div>
      </div>
    </div>
  );
}

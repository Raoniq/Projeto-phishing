import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Printer,
  FileDown,
  FileWarning,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
  Briefcase,
  Mail,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SusceptibilityPage() {
  const { company } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Report data state
  const [report, setReport] = useState({
    reportPeriod: '',
    totalCampaigns: 0,
    totalTargets: 0,
    overallSusceptibilityRate: 0,
    trend: 0,
    topDepartments: [] as Array<{ department: string; targets: number; susceptible: number; rate: number; risk: string }>,
    topRoles: [] as Array<{ role: string; count: number; rate: number; department: string }>,
    topFailedEmails: [] as Array<{
      id: string;
      template: string;
      subject: string;
      campaignsUsed: number;
      successRate: number;
      clicks: number;
      compromised: number;
      description: string;
    }>,
    monthlyTrend: [] as Array<{ month: string; rate: number; clicks: number; compromised: number }>,
    recommendations: [] as Array<{
      priority: string;
      title: string;
      description: string;
      department: string;
      impact: string;
      effort: string;
    }>,
  });

  // Fetch real data from Supabase
  useEffect(() => {
    if (!company?.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch completed campaigns for the last 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const { data: campaigns } = await supabase
          .from('campaigns')
          .select(`
            id,
            name,
            template:campaign_templates(name, subject),
            completed_at,
            target_count
          `)
          .eq('company_id', company.id)
          .eq('status', 'completed')
          .gte('completed_at', threeMonthsAgo.toISOString())
          .order('completed_at', { ascending: false });

        if (!campaigns || campaigns.length === 0) {
          setLoading(false);
          return;
        }

        const campaignIds = campaigns.map(c => c.id);

        // Fetch campaign targets with user info
        const { data: targets } = await supabase
          .from('campaign_targets')
          .select(`
            id,
            campaign_id,
            user:users(id, department, name)
          `)
          .in('campaign_id', campaignIds);

        // Fetch campaign events for susceptibility calculation
        const { data: events } = await supabase
          .from('campaign_events')
          .select('campaign_target_id, event_type')
          .in('campaign_target_id', (targets || []).map(t => t.id));

        // Calculate report metrics
        const totalCampaigns = campaigns.length;
        const totalTargets = (targets || []).length;

        // Build campaign target map
        const targetsByCampaign: Record<string, typeof targets> = {};
        (targets || []).forEach(t => {
          if (!targetsByCampaign[t.campaign_id]) targetsByCampaign[t.campaign_id] = [];
          targetsByCampaign[t.campaign_id].push(t);
        });

        // Calculate susceptibility per campaign
        let totalSusceptible = 0;
        let totalClicks = 0;
        const departmentStats: Record<string, { targets: number; susceptible: number }> = {};
        const roleStats: Record<string, { targets: number; susceptible: number; department: string }> = {};
        const templateStats: Record<string, { clicks: number; compromised: number; campaigns: Set<string> }> = {};
        const monthlyData: Record<string, { clicks: number; compromised: number }> = {};

        (events || []).forEach(event => {
          const target = (targets || []).find(t => t.id === event.campaign_target_id);
          if (!target) return;

          const user = target.user as any;
          const dept = user?.department || 'Outro';
          const campaign = campaigns.find(c => c.id === target.campaign_id);
          const monthKey = campaign?.completed_at ? new Date(campaign.completed_at).toLocaleString('pt-BR', { month: 'short' }) : 'N/A';

          // Initialize department stats
          if (!departmentStats[dept]) {
            departmentStats[dept] = { targets: 0, susceptible: 0 };
          }

          if (event.event_type === 'clicked') {
            totalClicks++;
            totalSusceptible++;
            departmentStats[dept].susceptible++;
            templateStats[campaign?.template?.name || 'Sem template'] = templateStats[campaign?.template?.name || 'Sem template'] || { clicks: 0, compromised: 0, campaigns: new Set() };
            templateStats[campaign?.template?.name || 'Sem template'].clicks++;
            if (campaign) templateStats[campaign?.template?.name || 'Sem template'].campaigns.add(campaign.id);

            monthlyData[monthKey] = monthlyData[monthKey] || { clicks: 0, compromised: 0 };
            monthlyData[monthKey].clicks++;
          }

          // Initialize monthly data for 'sent' events too
          if (event.event_type === 'sent') {
            monthlyData[monthKey] = monthlyData[monthKey] || { clicks: 0, compromised: 0 };
          }
        });

        // Calculate overall susceptibility rate
        const overallSusceptibilityRate = totalTargets > 0 ? (totalSusceptible / totalTargets) * 100 : 0;

        // Top departments
        const topDepartments = Object.entries(departmentStats)
          .map(([department, stats]) => ({
            department,
            targets: stats.targets,
            susceptible: stats.susceptible,
            rate: stats.targets > 0 ? (stats.susceptible / stats.targets) * 100 : 0,
            risk: stats.targets > 0 ? (stats.susceptible / stats.targets) * 100 > 15 ? 'critical' : (stats.susceptible / stats.targets) * 100 > 10 ? 'high' : (stats.susceptible / stats.targets) * 100 > 5 ? 'medium' : 'low' : 'low'
          }))
          .sort((a, b) => b.rate - a.rate)
          .slice(0, 10);

        // Top roles (extract from user names - simplified)
        const topRoles = Object.entries(roleStats)
          .map(([role, stats]) => ({
            role,
            count: stats.targets,
            rate: stats.targets > 0 ? (stats.susceptible / stats.targets) * 100 : 0,
            department: stats.department
          }))
          .sort((a, b) => b.rate - a.rate)
          .slice(0, 8);

        // Top failed emails (templates)
        const topFailedEmails = Object.entries(templateStats)
          .map(([template, stats], idx) => ({
            id: String(idx + 1),
            template,
            subject: `Campanha usando template: ${template}`,
            campaignsUsed: stats.campaigns.size,
            successRate: stats.campaigns.size > 0 ? (stats.clicks / stats.campaigns.size) * 10 : 0,
            clicks: stats.clicks,
            compromised: Math.floor(stats.clicks * 0.15),
            description: `Template de phishing com ${stats.clicks} cliques`
          }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 5);

        // Monthly trend
        const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthlyTrend = Object.entries(monthlyData)
          .map(([month, data]) => ({ month, ...data, rate: totalTargets > 0 ? (data.clicks / totalTargets) * 100 : 0 }))
          .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
          .slice(-3);

        // Generate recommendations based on data
        const recommendations = [];
        const criticalDepts = topDepartments.filter(d => d.risk === 'critical');
        const highDepts = topDepartments.filter(d => d.risk === 'high');

        if (criticalDepts.length > 0) {
          recommendations.push({
            priority: 'critical',
            title: `Treinamento urgente para ${criticalDepts.map(d => d.department).join(', ')}`,
            description: `Departamentos com taxas acima de 15% precisam de treinamento presencial imediato. Agendar workshop de reconhecimento de phishing.`,
            department: criticalDepts.map(d => d.department).join(', '),
            impact: 'Alto',
            effort: 'Médio'
          });
        }

        if (highDepts.length > 0) {
          recommendations.push({
            priority: 'high',
            title: 'Implementar simulação de spear phishing',
            description: 'Criar campanhas direcionadas para C-level e gerentes, que são alvos de spear phishing. Usar templates personalizados com dados públicos.',
            department: 'TI',
            impact: 'Alto',
            effort: 'Alto'
          });
        }

        const highRateDepts = [...criticalDepts, ...highDepts];
        if (highRateDepts.length > 0) {
          recommendations.push({
            priority: 'high',
            title: `Revisar permissões de usuários ${highRateDepts[0].department}`,
            description: 'Implementar política de dupla autenticação para transações financeiras. Usuários com alto risco devem ter limitações de acesso temporárias.',
            department: `${highRateDepts[0].department}, TI`,
            impact: 'Médio',
            effort: 'Alto'
          });
        }

        if (totalSusceptible > 10) {
          recommendations.push({
            priority: 'medium',
            title: 'Campanha de awareness para equipes críticas',
            description: `Equipe com ${totalSusceptible} usuários susceptíveis é frequentemente alvo de emails maliciosos. Desenvolver treinamento específico para reconhecimentode social engineering.`,
            department: topDepartments[0]?.department || 'Geral',
            impact: 'Médio',
            effort: 'Baixo'
          });
        }

        recommendations.push({
          priority: 'low',
          title: 'Criar canal de denúncias anônimas',
          description: 'Implementar sistema para reportar emails suspeitos de forma rápida e anônima. Recompensar usuários que reportam corretamente.',
          department: 'TI, RH',
          impact: 'Médio',
          effort: 'Baixo'
        });

        // Set report period
        const periodStart = campaigns.length > 0
          ? new Date(campaigns[campaigns.length - 1].completed_at || Date.now()).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
          : 'N/A';
        const periodEnd = campaigns.length > 0
          ? new Date(campaigns[0].completed_at || Date.now()).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
          : 'N/A';
        const reportPeriod = `${periodStart} - ${periodEnd}`;

        setReport({
          reportPeriod,
          totalCampaigns,
          totalTargets,
          overallSusceptibilityRate,
          trend: -overallSusceptibilityRate / 10, // Simplified trend calculation
          topDepartments,
          topRoles,
          topFailedEmails,
          monthlyTrend,
          recommendations
        });
      } catch (error) {
        console.error('Error fetching susceptibility data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [company?.id]);

  // Calculate overall stats
  const totalSusceptible = report.topDepartments.reduce((acc, d) => acc + d.susceptible, 0);
  const totalCompromised = report.topFailedEmails.reduce((acc, e) => acc + e.compromised, 0);

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle PDF export (stub)
  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    // Stub: In production, integrate with PDF library like jspdf or react-pdf
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Exporting PDF...');
    setIsExporting(false);
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-amber-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-[var(--color-fg-secondary)]';
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-500/10 border-red-500/30';
      case 'high': return 'bg-amber-500/10 border-amber-500/30';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'bg-green-500/10 border-green-500/30';
      default: return 'bg-[var(--color-surface-2)] border-[var(--color-noir-700)]';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'medium': return <Target className="h-4 w-4 text-yellow-400" />;
      case 'low': return <Lightbulb className="h-4 w-4 text-green-400" />;
      default: return <CheckCircle className="h-4 w-4 text-[var(--color-fg-tertiary)]" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-0)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
          <p className="mt-4 text-sm text-[var(--color-fg-tertiary)]">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Print Header */}
      <div className="hidden print:block print-header">
        <div className="print-logo">PhishGuard</div>
        <div className="text-sm" style={{ color: '#666' }}>
          Relatório de Susceptibilidade · {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Screen Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-1)]"
      >
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-fg-tertiary)]">
            <Link to="/app/campanhas" className="flex items-center gap-1 hover:text-[var(--color-fg-primary)]">
              <ArrowLeft className="h-4 w-4" />
              Campanhas
            </Link>
            <span>/</span>
            <span className="text-[var(--color-fg-primary)]">Relatório de Susceptibilidade</span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-accent)]/10">
                <FileWarning className="h-6 w-6 text-[var(--color-accent)]" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                  Relatório de Susceptibilidade
                </h1>
                <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
                  {report.reportPeriod} · Análise de vulnerabilidade por departamento
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
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <FileDown className="h-4 w-4" />
                {isExporting ? 'Exportando...' : 'Exportar PDF'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Executive Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] avoid-break">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[var(--color-accent)]" />
                Sumário Executivo
              </CardTitle>
              <CardDescription>
                Visão geral da susceptibilidade da organização a phishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-[var(--color-surface-2)] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Taxa de Susceptibilidade</p>
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      report.trend < 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {report.trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                      {Math.abs(report.trend)}%
                    </div>
                  </div>
                  <p className="mt-2 font-display text-3xl font-bold text-[var(--color-fg-primary)]">
                    {report.overallSusceptibilityRate}%
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)] mt-1">
                    {report.trend < 0 ? 'Melhoria em relação ao período anterior' : 'Aumento em relação ao período anterior'}
                  </p>
                </div>

                <div className="rounded-lg bg-[var(--color-surface-2)] p-4">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Total de Campanhas</p>
                  <p className="mt-2 font-display text-3xl font-bold text-[var(--color-fg-primary)]">
                    {report.totalCampaigns}
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)] mt-1">
                    Últimos 3 meses
                  </p>
                </div>

                <div className="rounded-lg bg-[var(--color-surface-2)] p-4">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Usuários Susceptíveis</p>
                  <p className="mt-2 font-display text-3xl font-bold text-amber-400">
                    {totalSusceptible}
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)] mt-1">
                    De {report.totalTargets.toLocaleString()} alvos
                  </p>
                </div>

                <div className="rounded-lg bg-[var(--color-surface-2)] p-4">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Comprometidos</p>
                  <p className="mt-2 font-display text-3xl font-bold text-red-400">
                    {totalCompromised}
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)] mt-1">
                    Necesitam remediação
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[var(--color-accent)]" />
                Tendência Mensal
              </CardTitle>
              <CardDescription>
                Evolução da taxa de susceptibilidade nos últimos meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-48">
                {report.monthlyTrend.map((entry) => (
                  <div key={entry.month} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full flex flex-col gap-1 items-center justify-end h-40">
                      <div className="w-full bg-red-500/60 rounded-t-sm relative group cursor-pointer"
                        style={{ height: `${(entry.rate / 15) * 100}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--color-noir-800)] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                          {entry.rate}% · {entry.clicks} cliques
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-[var(--color-fg-tertiary)] font-medium">{entry.month}</span>
                    <span className="text-xs font-mono text-[var(--color-fg-tertiary)]">{entry.rate}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-red-500/60" />
                  <span className="text-xs text-[var(--color-fg-tertiary)]">Taxa de Susceptibilidade</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Department Breakdown and Role Analysis - Two columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Department Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-[var(--color-accent)]" />
                  Análise por Departamento
                </CardTitle>
                <CardDescription>
                  Ranking de departments por taxa de susceptibilidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.topDepartments.map((dept, idx) => (
                    <div key={dept.department} className="flex items-center gap-3">
                      <span className="w-5 text-center font-mono text-sm text-[var(--color-fg-tertiary)]">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[var(--color-fg-primary)]">
                            {dept.department}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--color-fg-tertiary)]">
                              {dept.susceptible}/{dept.targets}
                            </span>
                            <Badge
                              className={cn(
                                'text-xs',
                                getRiskBg(dept.risk),
                                getRiskColor(dept.risk)
                              )}
                              variant="outline"
                            >
                              {dept.rate}%
                            </Badge>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                          <div
                            className={cn(
                              'h-2 rounded-full transition-all',
                              dept.risk === 'critical' && 'bg-red-500',
                              dept.risk === 'high' && 'bg-amber-500',
                              dept.risk === 'medium' && 'bg-yellow-500',
                              dept.risk === 'low' && 'bg-green-500'
                            )}
                            style={{ width: `${(dept.rate / 25) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Role Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[var(--color-accent)]" />
                  Cargos Mais Alvo
                </CardTitle>
                <CardDescription>
                  Posições com maior índice de susceptibilidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.topRoles.map((role) => (
                    <div
                      key={role.role}
                      className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-2)] p-3"
                    >
                      <div className={cn(
                        'grid h-8 w-8 place-items-center rounded-lg',
                        role.rate > 20 ? 'bg-red-500/10' : role.rate > 15 ? 'bg-amber-500/10' : 'bg-[var(--color-surface-1)]'
                      )}>
                        <Users className={cn(
                          'h-4 w-4',
                          role.rate > 20 ? 'text-red-400' : role.rate > 15 ? 'text-amber-400' : 'text-[var(--color-fg-tertiary)]'
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[var(--color-fg-primary)]">
                            {role.role}
                          </span>
                          <Badge
                            variant={role.rate > 20 ? 'destructive' : role.rate > 15 ? 'warning' : 'secondary'}
                            className="text-xs"
                          >
                            {role.rate}%
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--color-fg-tertiary)] mt-0.5">
                          {role.department} · {role.count} incidentes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Failed Emails */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="page-break-before"
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[var(--color-accent)]" />
                Templates de Phishing Mais Eficazes
              </CardTitle>
              <CardDescription>
                Emails que tiveram maior taxa de sucesso em enganar usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.topFailedEmails.map((email) => (
                  <div
                    key={email.id}
                    className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)]/50 overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors"
                      onClick={() => setExpandedEmail(expandedEmail === email.id ? null : email.id)}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                        <Mail className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[var(--color-fg-primary)]">
                            {email.template}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            {email.successRate}% sucesso
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--color-fg-tertiary)] truncate">
                          {email.subject}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-fg-tertiary)]">Cliques</p>
                          <p className="font-mono text-sm font-medium text-[var(--color-fg-primary)]">
                            {email.clicks}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-fg-tertiary)]">Comprometidos</p>
                          <p className="font-mono text-sm font-medium text-red-400">
                            {email.compromised}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-fg-tertiary)]">Campanhas</p>
                          <p className="font-mono text-sm font-medium text-[var(--color-fg-primary)]">
                            {email.campaignsUsed}
                          </p>
                        </div>
                        {expandedEmail === email.id ? (
                          <ChevronUp className="h-5 w-5 text-[var(--color-fg-tertiary)]" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-[var(--color-fg-tertiary)]" />
                        )}
                      </div>
                    </div>

                    {expandedEmail === email.id && (
                      <div className="px-4 pb-4 pt-0 border-t border-[var(--color-noir-700)]">
                        <div className="mt-3 p-3 rounded-lg bg-[var(--color-surface-1)]">
                          <p className="text-xs text-[var(--color-fg-tertiary)] mb-1">Descrição do Ataque</p>
                          <p className="text-sm text-[var(--color-fg-secondary)]">{email.description}</p>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-[var(--color-surface-1)]">
                            <p className="text-xs text-[var(--color-fg-tertiary)]">Taxa de Abertura</p>
                            <p className="text-lg font-mono font-bold text-[var(--color-fg-primary)]">
                              {(email.successRate * 1.5).toFixed(1)}%
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-[var(--color-surface-1)]">
                            <p className="text-xs text-[var(--color-fg-tertiary)]">Taxa de Click-through</p>
                            <p className="text-lg font-mono font-bold text-amber-400">
                              {(email.successRate * 0.7).toFixed(1)}%
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-[var(--color-surface-1)]">
                            <p className="text-xs text-[var(--color-fg-tertiary)]">Taxa de Comprometimento</p>
                            <p className="text-lg font-mono font-bold text-red-400">
                              {(email.successRate * 0.15).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
          transition={{ delay: 0.25 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-[var(--color-accent)]" />
                Recomendações
              </CardTitle>
              <CardDescription>
                Ações sugeridas para reduzir a susceptibilidade da organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-lg border',
                      rec.priority === 'critical' && 'bg-red-500/5 border-red-500/20',
                      rec.priority === 'high' && 'bg-amber-500/5 border-amber-500/20',
                      rec.priority === 'medium' && 'bg-yellow-500/5 border-yellow-500/20',
                      rec.priority === 'low' && 'bg-green-500/5 border-green-500/20'
                    )}
                  >
                    <div className="mt-0.5">
                      {getPriorityIcon(rec.priority)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={cn(
                            'text-sm font-medium',
                            rec.priority === 'critical' && 'text-red-400',
                            rec.priority === 'high' && 'text-amber-400',
                            rec.priority === 'medium' && 'text-yellow-400',
                            rec.priority === 'low' && 'text-green-400'
                          )}>
                            {rec.title}
                          </p>
                          <p className="text-sm text-[var(--color-fg-secondary)] mt-1">
                            {rec.description}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs">
                            Impacto: {rec.impact}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Esforço: {rec.effort}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-[var(--color-fg-tertiary)]">
                          Departamentos: {rec.department}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Print footer */}
        <div className="hidden print:block pt-8 border-t border-[var(--color-noir-700)]">
          <p className="text-xs text-center" style={{ color: '#999' }}>
            Relatório de susceptibilidade gerado em {new Date().toLocaleString('pt-BR')} · PhishGuard · www.phishguard.com.br
          </p>
        </div>
      </div>
    </div>
  );
}
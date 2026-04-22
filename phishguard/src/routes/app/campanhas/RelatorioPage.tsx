import { useState, useCallback } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Mock campaign data for report
const MOCK_REPORT = {
  campaign: {
    id: 'campaign-1',
    name: 'Black Friday 2026',
    template: 'Black Friday Promo',
    tier: 2 as const,
    status: 'completed' as const,
    createdAt: '2026-04-15T10:00:00Z',
    scheduledAt: '2026-04-20T09:00:00Z',
    completedAt: '2026-04-20T18:30:00Z',
    description: 'Simulação de phishing baseada em promoções falsas de Black Friday.',
  },
  stats: {
    sent: 150,
    opened: 89,
    clicked: 12,
    reported: 3,
    compromised: 2,
  },
  timeline: [
    { date: '2026-04-20', sent: 50, opened: 35, clicked: 5 },
    { date: '2026-04-21', sent: 100, opened: 54, clicked: 7 },
    { date: '2026-04-22', sent: 150, opened: 89, clicked: 12 },
  ],
  topClickedByDepartment: [
    { department: 'Financeiro', count: 4, rate: 15.4 },
    { department: 'TI', count: 3, rate: 12.8 },
    { department: 'Vendas', count: 2, rate: 8.3 },
    { department: 'RH', count: 2, rate: 6.7 },
    { department: 'Marketing', count: 1, rate: 4.2 },
  ],
  engagementTimeline: [
    { hour: '09:00', opens: 12, clicks: 2 },
    { hour: '10:00', opens: 28, clicks: 4 },
    { hour: '11:00', opens: 35, clicks: 5 },
    { hour: '12:00', opens: 42, clicks: 6 },
    { hour: '13:00', opens: 48, clicks: 7 },
    { hour: '14:00', opens: 55, clicks: 8 },
    { hour: '15:00', opens: 62, clicks: 9 },
    { hour: '16:00', opens: 72, clicks: 10 },
    { hour: '17:00', opens: 82, clicks: 11 },
    { hour: '18:00', opens: 89, clicks: 12 },
  ],
};

export default function RelatorioPage() {
  const { id } = useParams();
  const [report] = useState(MOCK_REPORT);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Calculate rates
  const openRate = report.stats.sent > 0 ? (report.stats.opened / report.stats.sent) * 100 : 0;
  const clickRate = report.stats.opened > 0 ? (report.stats.clicked / report.stats.opened) * 100 : 0;
  const reportRate = report.stats.clicked > 0 ? (report.stats.reported / report.stats.clicked) * 100 : 0;
  const compromiseRate = report.stats.clicked > 0 ? (report.stats.compromised / report.stats.clicked) * 100 : 0;
  const reportEffectiveness = report.stats.reported / (report.stats.clicked - report.stats.compromised) * 100;

  // Handle PDF export
  const handleExportPDF = useCallback(async () => {
    setIsGeneratingPDF(true);
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGeneratingPDF(false);
    // In real app, this would trigger download
    console.log('PDF exported');
  }, []);

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

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
            <Link to={`/app/campanhas/${id}`} className="hover:text-[var(--color-fg-primary)]">
              Black Friday 2026
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
                <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
                  {report.campaign.name} · Período: {new Date(report.campaign.scheduledAt).toLocaleDateString('pt-BR')} - {new Date(report.campaign.completedAt!).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

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
                disabled={isGeneratingPDF}
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

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Key metrics row */}
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
                  <Mail className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Total Enviado</p>
                  <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    {report.stats.sent}
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
        </motion.div>

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
                <div className="space-y-4">
                  {/* Enviados */}
                  <div className="flex items-center gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                      <Mail className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--color-fg-primary)]">Enviados</span>
                        <span className="font-mono text-sm text-[var(--color-fg-secondary)]">{report.stats.sent}</span>
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
                          {report.stats.opened} ({openRate.toFixed(1)}%)
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
                          {report.stats.clicked} ({clickRate.toFixed(1)}%)
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
                          {report.stats.reported} ({reportRate.toFixed(1)}%)
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
                          {report.stats.compromised} ({compromiseRate.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                        <div className="h-2 rounded-full bg-red-500 transition-all" style={{ width: `${compromiseRate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
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
                <div className="space-y-4">
                  {report.topClickedByDepartment.map((dept, idx) => (
                    <div key={dept.department} className="flex items-center gap-4">
                      <span className="w-4 font-mono text-sm text-[var(--color-fg-tertiary)]">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[var(--color-fg-primary)]">{dept.department}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-[var(--color-fg-secondary)]">{dept.count}</span>
                            <Badge variant={dept.rate > 10 ? 'destructive' : 'secondary'} className="text-xs">
                              {dept.rate}%
                            </Badge>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                          <div
                            className={cn(
                              'h-2 rounded-full transition-all',
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
              <div className="flex items-end justify-between gap-2 h-40">
                {report.engagementTimeline.map((entry, _idx) => (
                  <div key={entry.hour} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full flex flex-col gap-1 items-center justify-end h-32">
                      <div className="w-full bg-purple-500/60 rounded-t-sm" style={{ height: `${(entry.opens / 100) * 100}%` }}>
                        <div className="w-full bg-amber-500 rounded-t-sm" style={{ height: `${(entry.clicks / entry.opens) * 100}%` }} />
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
              <div className="flex justify-between py-2 border-b border-[var(--color-noir-700)]">
                <span className="text-sm text-[var(--color-fg-tertiary)]">Template utilizado</span>
                <span className="text-sm font-medium text-[var(--color-fg-primary)]">{report.campaign.template}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--color-noir-700)]">
                <span className="text-sm text-[var(--color-fg-tertiary)]">Tier</span>
                <Badge variant="secondary">Tier {report.campaign.tier}</Badge>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--color-noir-700)]">
                <span className="text-sm text-[var(--color-fg-tertiary)]">Data de envio</span>
                <span className="text-sm font-medium text-[var(--color-fg-primary)]">
                  {new Date(report.campaign.scheduledAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--color-noir-700)]">
                <span className="text-sm text-[var(--color-fg-tertiary)]">Duração</span>
                <span className="text-sm font-medium text-[var(--color-fg-primary)]">
                  ~9 horas (09:00 - 18:30)
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-[var(--color-fg-tertiary)]">Status final</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Concluída com sucesso</span>
                </div>
              </div>
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
              <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-green-500/5 p-3 border border-green-500/20">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-400">Bom desempenho geral</p>
                  <p className="text-xs text-[var(--color-fg-secondary)] mt-1">
                    Taxa de reporte de {reportRate.toFixed(0)}% indica boa cultura de segurança.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-amber-500/5 p-3 border border-amber-500/20">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Atenção ao Financeiro</p>
                  <p className="text-xs text-[var(--color-fg-secondary)] mt-1">
                    Departamento apresentou maior índice de cliques. Considere treinamento específico.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] p-3">
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-fg-tertiary)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">Próximos passos</p>
                  <p className="text-xs text-[var(--color-fg-secondary)] mt-1">
                    Agendar campanha Tier 2 para os {report.stats.compromised} usuários comprometidos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Print-only footer */}
        <div className="hidden print:block pt-8 border-t border-[var(--color-noir-700)]">
          <p className="text-xs text-[var(--color-fg-tertiary)] text-center">
            Relatório gerado em {new Date().toLocaleString('pt-BR')} · PhishGuard · www.phishguard.com.br
          </p>
        </div>
      </div>
    </div>
  );
}
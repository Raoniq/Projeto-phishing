import { useState, useCallback } from 'react';
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

// Mock data for susceptibility analysis
const MOCK_SUSCEPTIBILITY_DATA = {
  reportPeriod: 'Janeiro - Março 2026',
  totalCampaigns: 12,
  totalTargets: 1847,
  overallSusceptibilityRate: 8.4,
  trend: -2.1, // compared to previous period
  topDepartments: [
    { department: 'Financeiro', targets: 89, susceptible: 18, rate: 20.2, risk: 'critical' },
    { department: 'Compras', targets: 67, susceptible: 12, rate: 17.9, risk: 'critical' },
    { department: 'TI', targets: 124, susceptible: 18, rate: 14.5, risk: 'high' },
    { department: 'Contabilidade', targets: 45, susceptible: 6, rate: 13.3, risk: 'high' },
    { department: 'Vendas', targets: 312, susceptible: 38, rate: 12.2, risk: 'high' },
    { department: 'Marketing', targets: 156, susceptible: 14, rate: 9.0, risk: 'medium' },
    { department: 'RH', targets: 78, susceptible: 6, rate: 7.7, risk: 'medium' },
    { department: 'Operações', targets: 234, susceptible: 15, rate: 6.4, risk: 'low' },
    { department: 'Jurídico', targets: 42, susceptible: 2, rate: 4.8, risk: 'low' },
    { department: 'Administrativo', targets: 156, susceptible: 8, rate: 5.1, risk: 'low' },
  ],
  topRoles: [
    { role: 'Diretor Financeiro', count: 4, rate: 25.0, department: 'Financeiro' },
    { role: 'Gerente de Compras', count: 3, rate: 21.4, department: 'Compras' },
    { role: 'Coordenador de TI', count: 5, rate: 18.5, department: 'TI' },
    { role: 'Analista Financeiro', count: 6, rate: 16.2, department: 'Financeiro' },
    { role: 'Assistente Administrativo', count: 8, rate: 14.8, department: 'Administrativo' },
    { role: 'Vendedor Sênior', count: 12, rate: 13.6, department: 'Vendas' },
    { role: 'Contador', count: 3, rate: 12.5, department: 'Contabilidade' },
    { role: 'Coordenador de Marketing', count: 4, rate: 11.9, department: 'Marketing' },
  ],
  topFailedEmails: [
    {
      id: 1,
      template: 'Atualização Urgente de Senha',
      subject: '⚠️ Sua conta será suspensa em 24h - Ação necessária',
      campaignsUsed: 4,
      successRate: 34.2,
      clicks: 156,
      compromised: 23,
      description: 'Email simulando alerta de segurança do Microsoft 365'
    },
    {
      id: 2,
      template: 'Confirmação de Pagamento',
      subject: 'Pagamento aprovado - NF-e #45892',
      campaignsUsed: 3,
      successRate: 28.7,
      clicks: 98,
      compromised: 15,
      description: 'Email fingindo ser da área financeira com link para "comprovante"'
    },
    {
      id: 3,
      template: 'Black Friday Promocional',
      subject: '🔥 Oferta exclusiva para clientes VIP - 70% OFF',
      campaignsUsed: 2,
      successRate: 22.4,
      clicks: 187,
      compromised: 8,
      description: 'Email promocionais com links encurtados para landing page falsa'
    },
    {
      id: 4,
      template: 'Convite para Reunião',
      subject: 'Reunião urgente: Revisão do budget Q2',
      campaignsUsed: 3,
      successRate: 19.8,
      clicks: 67,
      compromised: 11,
      description: 'Convite falso de reunião com link para "documento confidencial"'
    },
    {
      id: 5,
      template: 'Notificação do RH',
      subject: 'Atualize seus dados cadastrais - Prazo: hoje',
      campaignsUsed: 2,
      successRate: 16.5,
      clicks: 52,
      compromised: 6,
      description: 'Email fingindo ser do RH solicitando atualização de dados'
    },
  ],
  monthlyTrend: [
    { month: 'Jan', rate: 10.5, clicks: 89, compromised: 12 },
    { month: 'Fev', rate: 9.2, clicks: 78, compromised: 9 },
    { month: 'Mar', rate: 8.4, clicks: 71, compromised: 7 },
  ],
  recommendations: [
    {
      priority: 'critical',
      title: 'Treinamento urgente para Financeiro e Compras',
      description: 'Departamentos com taxas acima de 15% precisam de treinamento presencial imediato. Agendar workshop de reconhecimento de phishing.',
      department: 'Financeiro, Compras',
      impact: 'Alto',
      effort: 'Médio'
    },
    {
      priority: 'high',
      title: 'Implementar simulação de spear phishing',
      description: 'Criar campanhas direcionadas para C-level e gerentes, que são alvos de spear phishing. Usar templates personalizados com dados públicos.',
      department: 'TI',
      impact: 'Alto',
      effort: 'Alto'
    },
    {
      priority: 'high',
      title: 'Revisar permissões de usuários Financeiro',
      description: 'Implementar política de dupla autenticação para transações financeiras. Usuários com alto risco devem ter limitações de acesso temporárias.',
      department: 'Financeiro, TI',
      impact: 'Médio',
      effort: 'Alto'
    },
    {
      priority: 'medium',
      title: 'Campanha de awareness para Vendas',
      description: 'Equipe de vendas é frequentemente alvo de emails de "confirmação de pedido". Desenvolver treinamento específico para reconhecimentode social engineering.',
      department: 'Vendas, RH',
      impact: 'Médio',
      effort: 'Baixo'
    },
    {
      priority: 'low',
      title: 'Criar canal de denúncias anônimas',
      description: 'Implementar sistema para reportar emails suspeitos de forma rápida e anônima. Recompensar usuários que reportam corretamente.',
      department: 'TI, RH',
      impact: 'Médio',
      effort: 'Baixo'
    },
  ],
};

export default function SusceptibilityPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<number | null>(null);
  const report = MOCK_SUSCEPTIBILITY_DATA;

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
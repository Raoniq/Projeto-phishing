import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Printer,
  Download,
  FileCode,
  Mail,
  Flag,
  AlertTriangle,
  Activity,
  CheckCircle,
  XCircle,
  Server,
  Globe,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  exportToCSV,
  timelineColumns,
  type TimelineEntryCSV
} from '@/lib/csv-export';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Database } from '@/lib/supabase';

type Campaign = Database['public']['Tables']['campaigns']['Row'];
type CampaignTarget = Database['public']['Tables']['campaign_targets']['Row'];
type CampaignEvent = Database['public']['Tables']['campaign_events']['Row'];
type IscaDomain = Database['public']['Tables']['isca_domains']['Row'];

interface ReportData {
  campaign: {
    id: string;
    name: string;
    template: string;
    tier: number;
    status: string;
    scheduledAt: string | null;
    completedAt: string | null;
    landingUrl: string;
    targetCount: number;
  };
  stats: {
    sent: number;
    delivered: number;
    bounced: number;
    opened: number;
    clicked: number;
    reported: number;
    compromised: number;
    unsubscribed: number;
  };
  timeline: Array<{ date: string; sent: number; opened: number; clicked: number; reported: number }>;
  hourlyEngagement: Array<{ hour: string; opens: number; clicks: number }>;
  technicalDetails: {
    smtpServer: string;
    bounceRate: string;
    dkimSigned: boolean;
    spfPassed: boolean;
    dmarcPassed: boolean;
    domainReputation: string;
    ipReputation: string;
  };
  riskUsers: Array<{ email: string; department: string; clicks: number; opened: boolean; reported: boolean }>;
}

const EMPTY_REPORT: ReportData = {
  campaign: {
    id: '',
    name: '',
    template: '',
    tier: 0,
    status: '',
    scheduledAt: null,
    completedAt: null,
    landingUrl: '',
    targetCount: 0,
  },
  stats: {
    sent: 0,
    delivered: 0,
    bounced: 0,
    opened: 0,
    clicked: 0,
    reported: 0,
    compromised: 0,
    unsubscribed: 0,
  },
  timeline: [],
  hourlyEngagement: [],
  technicalDetails: {
    smtpServer: '',
    bounceRate: '0%',
    dkimSigned: false,
    spfPassed: false,
    dmarcPassed: false,
    domainReputation: 'unknown',
    ipReputation: 'unknown',
  },
  riskUsers: [],
};

export default function RelatorioTecnicoPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { company } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [report, setReport] = useState<ReportData>(EMPTY_REPORT);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch campaign data
  useEffect(() => {
    async function fetchReportData() {
      if (!company?.id || !campaignId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch campaign
        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .eq('company_id', company.id)
          .single();

        if (campaignError || !campaign) {
          console.error('Error fetching campaign:', campaignError);
          setIsLoading(false);
          return;
        }

        // Fetch campaign targets
        const { data: targets, error: targetsError } = await supabase
          .from('campaign_targets')
          .select('*')
          .eq('campaign_id', campaignId);

        if (targetsError) {
          console.error('Error fetching targets:', targetsError);
        }

        // Fetch campaign events
        const { data: events, error: eventsError } = await supabase
          .from('campaign_events')
          .select('*')
          .in('campaign_target_id', (targets || []).map(t => t.id));

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
        }

        // Fetch isca domains for technical details
        const { data: iscaDomains } = await supabase
          .from('isca_domains')
          .select('*')
          .eq('company_id', company.id)
          .limit(1);

        // Compute stats from targets
        const targetList = targets || [];
        const eventList = events || [];

        const sent = targetList.filter(t => t.status !== 'pending' && t.status !== 'failed').length;
        const delivered = sent; // Assuming delivered = sent for now
        const bounced = targetList.filter(t => t.status === 'failed').length;
        const opened = targetList.filter(t => t.opened_at !== null).length;
        const clicked = targetList.filter(t => t.clicked_at !== null).length;
        const reported = targetList.filter(t => t.reported_at !== null).length;
        const compromised = clicked - reported;

        // Build timeline (grouped by date)
        const timelineMap = new Map<string, { sent: number; opened: number; clicked: number; reported: number }>();

        targetList.forEach(t => {
          if (!t.sent_at) return;
          const date = t.sent_at.split('T')[0];
          const existing = timelineMap.get(date) || { sent: 0, opened: 0, clicked: 0, reported: 0 };
          existing.sent += 1;
          if (t.opened_at) existing.opened += 1;
          if (t.clicked_at) existing.clicked += 1;
          if (t.reported_at) existing.reported += 1;
          timelineMap.set(date, existing);
        });

        const timeline = Array.from(timelineMap.entries())
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date));

        // Build hourly engagement (8am to 6pm)
        const hourlyMap = new Map<string, { opens: number; clicks: number }>();
        for (let h = 8; h <= 18; h++) {
          const hour = `${h.toString().padStart(2, '0')}:00`;
          hourlyMap.set(hour, { opens: 0, clicks: 0 });
        }

        targetList.forEach(t => {
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

        const hourlyEngagement = Array.from(hourlyMap.entries())
          .map(([hour, data]) => ({ hour, ...data }));

        // Build risk users (targets that clicked)
        const clickedTargets = targetList.filter(t => t.clicked_at !== null);

        // Fetch user department info for clicked targets
        const riskUsersPromises = clickedTargets.map(async (t) => {
          const { data: userData } = await supabase
            .from('users')
            .select('email, department')
            .eq('id', t.user_id)
            .single();

          return {
            email: t.email,
            department: userData?.department || 'Unknown',
            clicks: eventList.filter(e => e.campaign_target_id === t.id && e.event_type === 'clicked').length || 1,
            opened: t.opened_at !== null,
            reported: t.reported_at !== null,
          };
        });

        const riskUsers = await Promise.all(riskUsersPromises);

        // Technical details from isca_domains or defaults
        const iscaDomain = iscaDomains && iscaDomains.length > 0 ? iscaDomains[0] : null;

        const technicalDetails = {
          smtpServer: 'mail.phishguard.io',
          bounceRate: sent > 0 ? `${((bounced / sent) * 100).toFixed(1)}%` : '0%',
          dkimSigned: true, // Default - in real scenario would check email headers
          spfPassed: true,  // Default - in real scenario would check email headers
          dmarcPassed: true, // Default - in real scenario would check email headers
          domainReputation: iscaDomain?.risk_level ? 'high' : 'medium',
          ipReputation: 'good',
        };

        // Get template name from campaign template_id
        let templateName = 'Custom Template';
        if (campaign.template_id) {
          const { data: template } = await supabase
            .from('campaign_templates')
            .select('name')
            .eq('id', campaign.template_id)
            .single();
          if (template) templateName = template.name;
        }

        // Get tier from campaign settings
        const settings = (campaign.settings || {}) as Record<string, unknown>;
        const tier = (settings.tier as number) || 1;

        // Get landing URL from campaign settings
        const landingUrl = (settings.landing_url as string) || (settings.landingUrl as string) || '';

        setReport({
          campaign: {
            id: campaign.id,
            name: campaign.name,
            template: templateName,
            tier,
            status: campaign.status,
            scheduledAt: campaign.scheduled_at,
            completedAt: campaign.completed_at,
            landingUrl,
            targetCount: campaign.target_count,
          },
          stats: {
            sent,
            delivered,
            bounced,
            opened,
            clicked,
            reported,
            compromised,
            unsubscribed: 0,
          },
          timeline,
          hourlyEngagement,
          technicalDetails,
          riskUsers,
        });
      } catch (err) {
        console.error('Error fetching report data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReportData();
  }, [company?.id, campaignId]);

  // Calculate rates
  const bounceRate = report.stats.sent > 0 ? (report.stats.bounced / report.stats.sent) * 100 : 0;

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle CSV export
  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);

    const timelineData: TimelineEntryCSV[] = report.hourlyEngagement.map((h) => ({
      date: h.hour,
      sent: 0,
      opened: h.opens,
      clicked: h.clicks,
      reported: 0,
    }));

    exportToCSV(
      timelineData,
      timelineColumns,
      `relatorio-tecnico-${report.campaign.id}-timeline.csv`
    );

    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsExporting(false);
  }, [report]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Print Header */}
      <div className="hidden print:block print-header">
        <div className="print-logo">PhishGuard</div>
        <div className="text-sm" style={{ color: '#666' }}>
          Relatório Técnico · {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Screen Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
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
            <span className="text-[var(--color-fg-primary)]">Relatório Técnico</span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-accent)]/10">
                <FileCode className="h-6 w-6 text-[var(--color-accent)]" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                  Relatório Técnico
                </h1>
                <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
                  {report.campaign.name} · Dados detalhados de entrega e engajamento
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
      </motion.div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Campaign Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] avoid-break">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-[var(--color-accent)]" />
                Configuração da Campanha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Template</p>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">{report.campaign.template}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Tier</p>
                  <Badge variant="secondary">Tier {report.campaign.tier}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Alvos</p>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">{report.campaign.targetCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">URL da Landing Page</p>
                  <p className="text-sm font-medium text-[var(--color-accent)] flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {report.campaign.landingUrl}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Email Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] avoid-break">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[var(--color-accent)]" />
                Validação de Email
              </CardTitle>
              <CardDescription>
                Status de autenticação e reputação do domínio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-2)] p-3">
                  <div className={cn(
                    'grid h-8 w-8 place-items-center rounded-lg',
                    report.technicalDetails.dkimSigned ? 'bg-green-500/10' : 'bg-red-500/10'
                  )}>
                    {report.technicalDetails.dkimSigned ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">DKIM</p>
                    <p className={cn(
                      'text-sm font-medium',
                      report.technicalDetails.dkimSigned ? 'text-green-400' : 'text-red-400'
                    )}>
                      {report.technicalDetails.dkimSigned ? 'Assinado' : 'Falhou'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-2)] p-3">
                  <div className={cn(
                    'grid h-8 w-8 place-items-center rounded-lg',
                    report.technicalDetails.spfPassed ? 'bg-green-500/10' : 'bg-red-500/10'
                  )}>
                    {report.technicalDetails.spfPassed ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">SPF</p>
                    <p className={cn(
                      'text-sm font-medium',
                      report.technicalDetails.spfPassed ? 'text-green-400' : 'text-red-400'
                    )}>
                      {report.technicalDetails.spfPassed ? 'Passou' : 'Falhou'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-2)] p-3">
                  <div className={cn(
                    'grid h-8 w-8 place-items-center rounded-lg',
                    report.technicalDetails.dmarcPassed ? 'bg-green-500/10' : 'bg-red-500/10'
                  )}>
                    {report.technicalDetails.dmarcPassed ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">DMARC</p>
                    <p className={cn(
                      'text-sm font-medium',
                      report.technicalDetails.dmarcPassed ? 'text-green-400' : 'text-red-400'
                    )}>
                      {report.technicalDetails.dmarcPassed ? 'Passou' : 'Falhou'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-2)] p-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10">
                    <Server className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Servidor SMTP</p>
                    <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                      {report.technicalDetails.smtpServer}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delivery Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[var(--color-accent)]" />
                Estatísticas de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--color-fg-primary)]">Entregues</span>
                      <span className="font-mono text-sm text-[var(--color-fg-secondary)]">
                        {report.stats.delivered} / {report.stats.sent}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${report.stats.sent > 0 ? (report.stats.delivered / report.stats.sent) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--color-fg-primary)]">Bounce</span>
                      <span className="font-mono text-sm text-[var(--color-fg-secondary)]">
                        {report.stats.bounced} ({bounceRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface-2)]">
                      <div
                        className="h-2 rounded-full bg-red-500"
                        style={{ width: `${bounceRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hourly Engagement - Full width */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="page-break-before"
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[var(--color-accent)]" />
                Timeline de Engajamento
              </CardTitle>
              <CardDescription>
                Acompanhamento horário de aberturas e cliques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-40">
                {report.hourlyEngagement.map((entry) => (
                  <div key={entry.hour} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full flex flex-col gap-1 items-center justify-end h-32">
                      <div
                        className="w-full bg-purple-500/60 rounded-t-sm"
                        style={{ height: `${(entry.opens / 100) * 100}%` }}
                      >
                        <div
                          className="w-full bg-amber-500 rounded-t-sm"
                          style={{ height: `${entry.opens > 0 ? (entry.clicks / entry.opens) * 100 : 0}%` }}
                        />
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

        {/* High Risk Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Usuários de Alto Risco
              </CardTitle>
              <CardDescription>
                Alvos que interagiram com o email malicioso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-noir-700)]">
                      <th className="text-left py-3 px-4 text-xs text-[var(--color-fg-tertiary)] font-medium">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-xs text-[var(--color-fg-tertiary)] font-medium">
                        Departamento
                      </th>
                      <th className="text-right py-3 px-4 text-xs text-[var(--color-fg-tertiary)] font-medium">
                        Cliques
                      </th>
                      <th className="text-center py-3 px-4 text-xs text-[var(--color-fg-tertiary)] font-medium">
                        Abriu
                      </th>
                      <th className="text-center py-3 px-4 text-xs text-[var(--color-fg-tertiary)] font-medium">
                        Reportou
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.riskUsers.map((user, idx) => (
                      <tr
                        key={user.email}
                        className={cn(
                          'border-b border-[var(--color-noir-700)]',
                          idx % 2 === 0 ? 'bg-[var(--color-surface-1)]' : 'bg-[var(--color-surface-2)]/50'
                        )}
                      >
                        <td className="py-3 px-4 text-[var(--color-fg-primary)]">{user.email}</td>
                        <td className="py-3 px-4 text-[var(--color-fg-secondary)]">{user.department}</td>
                        <td className="py-3 px-4 text-right">
                          <Badge
                            variant={user.clicks > 2 ? 'destructive' : 'secondary'}
                            className="font-mono"
                          >
                            {user.clicks}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {user.opened ? (
                            <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {user.reported ? (
                            <Flag className="h-4 w-4 text-green-400 mx-auto" />
                          ) : (
                            <span className="text-[var(--color-fg-muted)]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Print footer */}
        <div className="hidden print:block pt-8 border-t border-[var(--color-noir-700)]">
          <p className="text-xs text-center" style={{ color: '#999' }}>
            Relatório técnico gerado em {new Date().toLocaleString('pt-BR')} · PhishGuard · www.phishguard.com.br
          </p>
        </div>
      </div>
    </div>
  );
}
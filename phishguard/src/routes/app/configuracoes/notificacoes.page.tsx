// src/routes/app/configuracoes/notificacoes.page.tsx
// Slack/Teams webhook notification settings page
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Slack,
  MessageSquare,
  TestTube,
  Save,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

type ConnectionStatus = 'connected' | 'disconnected' | 'error';

interface IntegrationConfig {
  enabled: boolean;
  webhookUrl: string;
  channel?: string;
  status: ConnectionStatus;
  lastTestAt?: string;
}

interface NotificationPreferences {
  campaignStart: boolean;
  campaignComplete: boolean;
  learnerReportPhishing: boolean;
  weeklyDigest: boolean;
}

const STATUS_CONFIG = {
  connected: {
    label: 'Conectado',
    color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    icon: CheckCircle,
  },
  disconnected: {
    label: 'Desconectado',
    color: 'bg-[var(--color-surface-3)] text-[var(--color-fg-tertiary)] border border-[var(--color-noir-700)]',
    icon: XCircle,
  },
  error: {
    label: 'Erro',
    color: 'bg-red-500/20 text-red-400 border border-red-500/30',
    icon: AlertTriangle,
  },
} as const;

export default function NotificacoesPage() {
  // Slack integration state
  const [slackConfig, setSlackConfig] = useState<IntegrationConfig>(() => ({
    enabled: true,
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
    channel: '#phishguard-alerts',
    status: 'connected',
    lastTestAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  }));

  // Teams integration state
  const [teamsConfig, setTeamsConfig] = useState<IntegrationConfig>(() => ({
    enabled: true,
    webhookUrl: 'https://outlookwebso wedpappc.webhook.core.windows.net/xxx',
    status: 'connected',
    lastTestAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  }));

  // Notification preferences state
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    campaignStart: true,
    campaignComplete: true,
    learnerReportPhishing: true,
    weeklyDigest: false,
  });

  // UI state
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [isTestingTeams, setIsTestingTeams] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);

  // Validation
  const [slackUrlError, setSlackUrlError] = useState<string | null>(null);
  const [teamsUrlError, setTeamsUrlError] = useState<string | null>(null);

  const validateWebhookUrl = (url: string, platform: 'slack' | 'teams'): string | null => {
    if (!url) return null;

    if (platform === 'slack') {
      if (!url.includes('hooks.slack.com')) {
        return 'URL deve ser um webhook do Slack (hooks.slack.com)';
      }
    } else {
      if (!url.includes('webhook.core.windows.net') && !url.includes('outlook.office.com')) {
        return 'URL deve ser um webhook do Microsoft Teams';
      }
    }
    return null;
  };

  const handleSlackUrlChange = (url: string) => {
    setSlackConfig(prev => ({ ...prev, webhookUrl: url }));
    const error = validateWebhookUrl(url, 'slack');
    setSlackUrlError(error);
    if (error) {
      setSlackConfig(prev => ({ ...prev, status: 'error' }));
    } else if (slackConfig.status === 'error') {
      setSlackConfig(prev => ({ ...prev, status: 'disconnected' }));
    }
  };

  const handleTeamsUrlChange = (url: string) => {
    setTeamsConfig(prev => ({ ...prev, webhookUrl: url }));
    const error = validateWebhookUrl(url, 'teams');
    setTeamsUrlError(error);
    if (error) {
      setTeamsConfig(prev => ({ ...prev, status: 'error' }));
    } else if (teamsConfig.status === 'error') {
      setTeamsConfig(prev => ({ ...prev, status: 'disconnected' }));
    }
  };

  const handleTestSlack = useCallback(async () => {
    if (!slackConfig.webhookUrl || slackUrlError) {
      setTestResult({ type: 'error', message: 'Configure uma URL válida antes de testar' });
      setShowTestDialog(true);
      return;
    }

    setIsTestingSlack(true);
    setTestDialogPlatform('slack');

    // Simulate test
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 90% success rate for demo
    const success = Math.random() > 0.1;

    if (success) {
      setSlackConfig(prev => ({
        ...prev,
        status: 'connected',
        lastTestAt: new Date().toISOString(),
      }));
      setTestResult({ type: 'success', message: 'Notificação de teste enviada com sucesso para o Slack!' });
    } else {
      setSlackConfig(prev => ({ ...prev, status: 'error' }));
      setTestResult({ type: 'error', message: 'Falha ao enviar notificação. Verifique a URL do webhook.' });
    }

    setIsTestingSlack(false);
    setShowTestDialog(true);
  }, [slackConfig.webhookUrl, slackUrlError]);

  const handleTestTeams = useCallback(async () => {
    if (!teamsConfig.webhookUrl || teamsUrlError) {
      setTestResult({ type: 'error', message: 'Configure uma URL válida antes de testar' });
      setShowTestDialog(true);
      return;
    }

    setIsTestingTeams(true);
    setTestDialogPlatform('teams');

    // Simulate test
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 90% success rate for demo
    const success = Math.random() > 0.1;

    if (success) {
      setTeamsConfig(prev => ({
        ...prev,
        status: 'connected',
        lastTestAt: new Date().toISOString(),
      }));
      setTestResult({ type: 'success', message: 'Notificação de teste enviada com sucesso para o Teams!' });
    } else {
      setTeamsConfig(prev => ({ ...prev, status: 'error' }));
      setTestResult({ type: 'error', message: 'Falha ao enviar notificação. Verifique a URL do webhook.' });
    }

    setIsTestingTeams(false);
    setShowTestDialog(true);
  }, [teamsConfig.webhookUrl, teamsUrlError]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
  }, []);

  const formatLastTest = (dateStr?: string) => {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                Notificações
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                Configure integrações com Slack e Microsoft Teams para receber alertas
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
            >
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-surface-2)]">
                    <Bell className="h-5 w-5 text-[var(--color-fg-secondary)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                      {Object.values(preferences).filter(Boolean).length}
                    </p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Notificações ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                    <Slack className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                      {slackConfig.enabled ? '1' : '0'}
                    </p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Integrações Slack</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                    <MessageSquare className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                      {teamsConfig.enabled ? '1' : '0'}
                    </p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Integrações Teams</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Slack Integration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#4A154B]/20">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#E01E5A">
                      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Slack</CardTitle>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      Receba alertas no seu workspace do Slack
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', STATUS_CONFIG[slackConfig.status].color)}>
                    {(() => {
                      const Icon = STATUS_CONFIG[slackConfig.status].icon;
                      return <Icon className="h-3.5 w-3.5" />;
                    })()}
                    {STATUS_CONFIG[slackConfig.status].label}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] p-4">
                <div>
                  <p className="font-medium text-[var(--color-fg-primary)]">Habilitar integração</p>
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    Ativar envio de notificações para o Slack
                  </p>
                </div>
                <Switch
                  checked={slackConfig.enabled}
                  onCheckedChange={(checked) => setSlackConfig(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <AnimatePresence>
                {slackConfig.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Webhook URL */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                        Webhook URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://hooks.slack.com/services/..."
                        value={slackConfig.webhookUrl}
                        onChange={(e) => handleSlackUrlChange(e.target.value)}
                        className={cn(
                          'h-10 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:outline-none transition-colors',
                          slackUrlError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[var(--color-noir-700)] focus:border-[var(--color-accent)]'
                        )}
                      />
                      {slackUrlError && (
                        <p className="mt-1 text-xs text-red-400">{slackUrlError}</p>
                      )}
                    </div>

                    {/* Channel */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                        Canal
                      </label>
                      <input
                        type="text"
                        placeholder="#canal-alertas"
                        value={slackConfig.channel || ''}
                        onChange={(e) => setSlackConfig(prev => ({ ...prev, channel: e.target.value }))}
                        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Test Button */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Último teste: {formatLastTest(slackConfig.lastTestAt)}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleTestSlack}
                        disabled={isTestingSlack || !!slackUrlError}
                      >
                        {isTestingSlack ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <TestTube className="h-4 w-4" />
                            Enviar teste
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Microsoft Teams Integration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#5059C9]/20">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#5059C9">
                      <path d="M20.625 8.25c0-.81-.64-1.47-1.43-1.47h-3.25V5.625c0-.81-.64-1.47-1.43-1.47H5.625c-.79 0-1.43.66-1.43 1.47v3.55H.875c-.79 0-1.43.66-1.43 1.47v8.45c0 .81.64 1.47 1.43 1.47h3.25v1.125c0 .81.64 1.47 1.43 1.47h8.875c.79 0 1.43-.66 1.43-1.47v-1.125H18.2c.79 0 1.43-.66 1.43-1.47v-3.55h.995c.79 0 1.43-.66 1.43-1.47V8.25zm-12 6.6h-.995V18.7H1.43v-3.85h-.995V9.25H1.43V5.625h7.18v9.225H8.625zm9.25 0c0 .81-.64 1.47-1.43 1.47h-3.25V18.7h-.995V9.25h.995V5.625h3.25c.79 0 1.43.66 1.43 1.47v3.55H18.2c-.79 0-1.43.66-1.43 1.47v3.55h-.995v-3.55H18.2z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Microsoft Teams</CardTitle>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      Receba alertas no Microsoft Teams
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', STATUS_CONFIG[teamsConfig.status].color)}>
                    {(() => {
                      const Icon = STATUS_CONFIG[teamsConfig.status].icon;
                      return <Icon className="h-3.5 w-3.5" />;
                    })()}
                    {STATUS_CONFIG[teamsConfig.status].label}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] p-4">
                <div>
                  <p className="font-medium text-[var(--color-fg-primary)]">Habilitar integração</p>
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    Ativar envio de notificações para o Teams
                  </p>
                </div>
                <Switch
                  checked={teamsConfig.enabled}
                  onCheckedChange={(checked) => setTeamsConfig(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <AnimatePresence>
                {teamsConfig.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Webhook URL */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                        Webhook URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://outlookoffice.webhook.core.windows.net/..."
                        value={teamsConfig.webhookUrl}
                        onChange={(e) => handleTeamsUrlChange(e.target.value)}
                        className={cn(
                          'h-10 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:outline-none transition-colors',
                          teamsUrlError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[var(--color-noir-700)] focus:border-[var(--color-accent)]'
                        )}
                      />
                      {teamsUrlError && (
                        <p className="mt-1 text-xs text-red-400">{teamsUrlError}</p>
                      )}
                    </div>

                    {/* Test Button */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Último teste: {formatLastTest(teamsConfig.lastTestAt)}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleTestTeams}
                        disabled={isTestingTeams || !!teamsUrlError}
                      >
                        {isTestingTeams ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <TestTube className="h-4 w-4" />
                            Enviar teste
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[var(--color-accent)]" />
                Preferências de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Campaign Start */}
                <label className="flex items-start gap-4 p-4 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]/80 transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={preferences.campaignStart}
                    onChange={(e) => setPreferences(prev => ({ ...prev, campaignStart: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--color-fg-primary)]">Início de campanha</p>
                      <Badge variant="secondary" className="text-xs">Evento</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
                      Receba uma notificação quando uma nova campanha for iniciada
                    </p>
                  </div>
                  <Send className="h-4 w-4 text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                </label>

                {/* Campaign Complete */}
                <label className="flex items-start gap-4 p-4 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]/80 transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={preferences.campaignComplete}
                    onChange={(e) => setPreferences(prev => ({ ...prev, campaignComplete: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--color-fg-primary)]">Campanha concluída</p>
                      <Badge variant="secondary" className="text-xs">Evento</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
                      Receba uma notificação quando uma campanha for concluída (com resultados)
                    </p>
                  </div>
                  <Send className="h-4 w-4 text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                </label>

                {/* Learner Reports Phishing */}
                <label className="flex items-start gap-4 p-4 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]/80 transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={preferences.learnerReportPhishing}
                    onChange={(e) => setPreferences(prev => ({ ...prev, learnerReportPhishing: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--color-fg-primary)]">Aprendiz reporta phishing</p>
                      <Badge variant="secondary" className="text-xs">Alerta</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
                      Receba um alerta imediato quando um aprendiz reportar um email como phishing
                    </p>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-[var(--color-fg-muted)] group-hover:text-amber-400 transition-colors" />
                </label>

                {/* Weekly Digest */}
                <label className="flex items-start gap-4 p-4 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]/80 transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={preferences.weeklyDigest}
                    onChange={(e) => setPreferences(prev => ({ ...prev, weeklyDigest: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--color-fg-primary)]">Resumo semanal</p>
                      <Badge variant="secondary" className="text-xs">Resumo</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
                      Receba um resumo semanal com métricas e estatísticas das campanhas
                    </p>
                  </div>
                  <Bell className="h-4 w-4 text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                </label>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connection Guide */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="text-base">Como obter Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Slack Guide */}
                <div className="rounded-lg border border-[var(--color-noir-700)] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#E01E5A">
                      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                    </svg>
                    <span className="font-medium text-[var(--color-fg-primary)]">Slack</span>
                  </div>
                  <ol className="space-y-2 text-xs text-[var(--color-fg-muted)] list-decimal list-inside">
                    <li>Acesse <strong>api.slack.com/apps</strong></li>
                    <li>Crie um novo App ou selecione um existente</li>
                    <li>Vá em <strong>Incoming Webhooks</strong></li>
                    <li>Ative webhooks e selecione um canal</li>
                    <li>Copie a URL do webhook gerada</li>
                  </ol>
                </div>

                {/* Teams Guide */}
                <div className="rounded-lg border border-[var(--color-noir-700)] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#5059C9">
                      <path d="M20.625 8.25c0-.81-.64-1.47-1.43-1.47h-3.25V5.625c0-.81-.64-1.47-1.43-1.47H5.625c-.79 0-1.43.66-1.43 1.47v3.55H.875c-.79 0-1.43.66-1.43 1.47v8.45c0 .81.64 1.47 1.43 1.47h3.25v1.125c0 .81.64 1.47 1.43 1.47h8.875c.79 0 1.43-.66 1.43-1.47v-1.125H18.2c.79 0 1.43-.66 1.43-1.47v-3.55h.995c.79 0 1.43-.66 1.43-1.47V8.25zm-12 6.6h-.995V18.7H1.43v-3.85h-.995V9.25H1.43V5.625h7.18v9.225H8.625zm9.25 0c0 .81-.64 1.47-1.43 1.47h-3.25V18.7h-.995V9.25h.995V5.625h3.25c.79 0 1.43.66 1.43 1.47v3.55H18.2c-.79 0-1.43.66-1.43 1.47v3.55h-.995v-3.55H18.2z" />
                    </svg>
                    <span className="font-medium text-[var(--color-fg-primary)]">Microsoft Teams</span>
                  </div>
                  <ol className="space-y-2 text-xs text-[var(--color-fg-muted)] list-decimal list-inside">
                    <li>No Teams, clique em <strong>...</strong> no canal</li>
                    <li>Selecione <strong>Conectores</strong></li>
                    <li>Encontre e configure <strong>Incoming Webhook</strong></li>
                    <li>Dê um nome ao webhook e crie</li>
                    <li>Copie a URL do webhook gerada</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Test Result Dialog */}
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {testResult?.type === 'success' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-amber-400" />
                    Teste Enviado
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-400" />
                    Teste Falhou
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {testResult?.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowTestDialog(false)}>
                Fechar
              </Button>
              {testResult?.type === 'success' && (
                <Button variant="primary" onClick={() => setShowTestDialog(false)}>
                  Entendido
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
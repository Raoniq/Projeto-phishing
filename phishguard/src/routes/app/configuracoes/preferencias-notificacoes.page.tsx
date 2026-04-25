// src/routes/app/configuracoes/preferencias-notificacoes.page.tsx
// User notification preferences per channel and event type
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  Bell,
  MessageSquare,
  Shield,
  GraduationCap,
  BarChart3,
  Calendar,
  AlertTriangle,
  Save,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type Channel = 'email' | 'in_app' | 'sms';
type EventType = 'new_training_assigned' | 'campaign_launched' | 'campaign_results' | 'weekly_digest' | 'security_alert';

interface Preference {
  channel: Channel;
  eventType: EventType;
  enabled: boolean;
}

interface PreferenceRow {
  id: string;
  channel: Channel;
  event_type: EventType;
  enabled: boolean;
}

// Event type metadata
const EVENT_TYPES: { key: EventType; label: string; description: string; icon: typeof Bell }[] = [
  {
    key: 'new_training_assigned',
    label: 'Novo treinamento atribuído',
    description: 'Quando um novo treinamento é designado a você',
    icon: GraduationCap,
  },
  {
    key: 'campaign_launched',
    label: 'Campanha iniciada',
    description: 'Quando uma campanha de phishing é iniciada',
    icon: BarChart3,
  },
  {
    key: 'campaign_results',
    label: 'Resultados de campanha',
    description: 'Quando os resultados de uma campanha são publicados',
    icon: BarChart3,
  },
  {
    key: 'weekly_digest',
    label: 'Resumo semanal',
    description: 'Resumo semanal do seu desempenho e métricas',
    icon: Calendar,
  },
  {
    key: 'security_alert',
    label: 'Alerta de segurança',
    description: 'Alertas importantes de segurança da conta',
    icon: Shield,
  },
];

// Channel metadata
const CHANNELS: { key: Channel; label: string; icon: typeof Mail; color: string }[] = [
  { key: 'email', label: 'Email', icon: Mail, color: 'text-amber-400' },
  { key: 'in_app', label: 'No app', icon: Bell, color: 'text-blue-400' },
  { key: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-green-400' },
];

export default function PreferenciasNotificacoesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current user preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('user_notification_preferences')
          .select('id, channel, event_type, enabled')
          .eq('user_id', user.id);

        if (error) throw error;

        // Initialize with defaults if no preferences exist
        if (!data || data.length === 0) {
          const defaultPrefs: Preference[] = [];
          CHANNELS.forEach(channel => {
            EVENT_TYPES.forEach(event => {
              // Apply default rules
              let enabled = true;
              if (channel.key === 'email' && event.key === 'weekly_digest') {
                enabled = false;
              } else if (channel.key === 'sms' && !['security_alert', 'campaign_results'].includes(event.key)) {
                enabled = false;
              }
              defaultPrefs.push({
                channel: channel.key,
                eventType: event.key,
                enabled,
              });
            });
          });
          setPreferences(defaultPrefs);
        } else {
          // Build preferences array from database
          const prefs: Preference[] = [];
          CHANNELS.forEach(channel => {
            EVENT_TYPES.forEach(event => {
              const dbPref = data.find(
                (p: PreferenceRow) => p.channel === channel.key && p.event_type === event.key
              );
              prefs.push({
                channel: channel.key,
                eventType: event.key,
                enabled: dbPref?.enabled ?? true,
              });
            });
          });
          setPreferences(prefs);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Toggle a single preference
  const togglePreference = useCallback((channel: Channel, eventType: EventType) => {
    setPreferences(prev => {
      const updated = prev.map(p =>
        p.channel === channel && p.eventType === eventType
          ? { ...p, enabled: !p.enabled }
          : p
      );
      setHasChanges(true);
      return updated;
    });
  }, []);

  // Save all preferences
  const handleSave = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setIsSaving(true);

      // Upsert each preference
      const promises = preferences.map(p =>
        supabase.rpc('upsert_user_notification_preference', {
          p_user_id: user.id,
          p_channel: p.channel,
          p_event_type: p.eventType,
          p_enabled: p.enabled,
        })
      );

      await Promise.all(promises);
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  }, [preferences]);

  // Check if channel has any enabled preferences
  const getChannelStats = (channel: Channel) => {
    const channelPrefs = preferences.filter(p => p.channel === channel);
    const enabled = channelPrefs.filter(p => p.enabled).length;
    const total = channelPrefs.length;
    return { enabled, total };
  };

  // Check if event has any enabled preferences
  const getEventStats = (eventType: EventType) => {
    const eventPrefs = preferences.filter(p => p.eventType === eventType);
    const enabled = eventPrefs.filter(p => p.enabled).length;
    const total = eventPrefs.length;
    return { enabled, total };
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" 
           style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'}} />

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                Preferências de Notificação
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                Configure como e quando deseja receber notificações
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastSaved && !hasChanges && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 text-sm text-[var(--color-fg-tertiary)]"
                >
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </motion.div>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Channel Summary Cards */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {CHANNELS.map((channel, idx) => {
            const stats = getChannelStats(channel.key);
            const Icon = channel.icon;
            return (
              <motion.div
                key={channel.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-surface-2)]',
                        channel.key === 'email' && 'bg-amber-500/10',
                        channel.key === 'in_app' && 'bg-blue-500/10',
                        channel.key === 'sms' && 'bg-green-500/10'
                      )}>
                        <Icon className={cn('h-5 w-5', channel.color)} />
                      </div>
                      <div>
                        <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                          {stats.enabled}/{stats.total}
                        </p>
                        <p className="text-xs text-[var(--color-fg-tertiary)]">
                          {channel.label}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Notification Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden">
            <CardHeader className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-2)]">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[var(--color-accent)]" />
                Matriz de Preferências
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="grid gap-4 border-b border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-6 py-4"
                   style={{ gridTemplateColumns: '2fr repeat(3, 1fr)' }}>
                <div className="text-sm font-medium text-[var(--color-fg-secondary)]">
                  Tipo de Evento
                </div>
                {CHANNELS.map(channel => {
                  const Icon = channel.icon;
                  return (
                    <div key={channel.key} className="flex items-center justify-center gap-2">
                      <Icon className={cn('h-4 w-4', channel.color)} />
                      <span className="text-sm font-medium text-[var(--color-fg-secondary)]">
                        {channel.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Table Body */}
              <div className="divide-y divide-[var(--color-noir-700)]">
                {EVENT_TYPES.map((event, eventIdx) => {
                  const EventIcon = event.icon;
                  const stats = getEventStats(event.key);
                  const isSecurityAlert = event.key === 'security_alert';

                  return (
                    <motion.div
                      key={event.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + eventIdx * 0.03 }}
                      className="grid items-center gap-4 px-6 py-4 hover:bg-[var(--color-surface-2)]/50 transition-colors"
                      style={{ gridTemplateColumns: '2fr repeat(3, 1fr)' }}
                    >
                      {/* Event Info */}
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                          isSecurityAlert ? 'bg-red-500/10' : 'bg-[var(--color-surface-2)]'
                        )}>
                          <EventIcon className={cn(
                            'h-4 w-4',
                            isSecurityAlert ? 'text-red-400' : 'text-[var(--color-fg-tertiary)]'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[var(--color-fg-primary)]">
                              {event.label}
                            </p>
                            {isSecurityAlert && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                                <AlertTriangle className="h-3 w-3" />
                                Prioridade
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
                            {event.description}
                          </p>
                        </div>
                      </div>

                      {/* Channel Toggles */}
                      {CHANNELS.map(channel => {
                        const pref = preferences.find(
                          p => p.channel === channel.key && p.eventType === event.key
                        );
                        return (
                          <div key={channel.key} className="flex justify-center">
                            <div className="relative">
                              <Switch
                                checked={pref?.enabled ?? false}
                                onCheckedChange={() => togglePreference(channel.key, event.key)}
                                className={cn(
                                  'transition-all duration-200',
                                  pref?.enabled && channel.key === 'email' && 'bg-amber-500 data-[state=checked]:bg-amber-500',
                                  pref?.enabled && channel.key === 'in_app' && 'bg-blue-500 data-[state=checked]:bg-blue-500',
                                  pref?.enabled && channel.key === 'sms' && 'bg-green-500 data-[state=checked]:bg-green-500'
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6"
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                  <Shield className="h-4 w-4 text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-fg-primary)]">
                    Sobre as notificações de segurança
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                    Alertas de segurança são sempre enviados para o email cadastrado e não podem ser desativados.
                    Isso garante que você seja notificado imediatamente sobre atividades suspeitas na sua conta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
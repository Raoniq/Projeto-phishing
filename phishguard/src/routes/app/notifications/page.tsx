// src/routes/app/notifications/page.tsx
// Full notification list page with filter, mark as read, and realtime updates
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  FileText,
  GraduationCap,
  Award,
  AlertTriangle,
  Info,
  Trash2,
  Loader2,
  Inbox,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSession, isMockMode } from '@/lib/auth/session';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Notification } from '@/components/notifications/NotificationBell';

// ============================================================================
// Types
// ============================================================================

type FilterType = 'all' | 'unread';
type NotificationType = 'campaign_completed' | 'training_assigned' | 'certificate_earned' | 'info' | 'warning';

interface NotificationItem extends Notification {
  type: NotificationType;
}

// ============================================================================
// Type Icons & Colors
// ============================================================================

const TYPE_CONFIG = {
  campaign_completed: {
    icon: FileText,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    badgeVariant: 'warning' as const,
  },
  training_assigned: {
    icon: GraduationCap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    badgeVariant: 'info' as const,
  },
  certificate_earned: {
    icon: Award,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    badgeVariant: 'default' as const,
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    badgeVariant: 'destructive' as const,
  },
  info: {
    icon: Info,
    color: 'text-[var(--color-fg-secondary)]',
    bgColor: 'bg-[var(--color-surface-2)]',
    borderColor: 'border-[var(--color-noir-700)]',
    badgeVariant: 'secondary' as const,
  },
} as const;

const TYPE_LABELS = {
  campaign_completed: 'Campanha',
  training_assigned: 'Treinamento',
  certificate_earned: 'Certificado',
  warning: 'Alerta',
  info: 'Info',
} as const;

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    user_id: 'mock',
    title: 'Campanha "Phishing Q1" concluída',
    body: 'A campanha foi finalizada com 156 cliques e 48 reportes. Taxa de reporte: 38.4%.',
    type: 'campaign_completed',
    read_at: null,
    metadata: { campaign_id: 'camp-123', stats: { clicks: 156, reports: 48 } },
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    user_id: 'mock',
    title: 'Novo treinamento atribuído',
    body: 'Complete o módulo de "Reconhecimento de Phishing" até sexta-feira. Duração: 45 minutos.',
    type: 'training_assigned',
    read_at: null,
    metadata: { track_id: 'track-456', deadline: '2026-04-30' },
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    user_id: 'mock',
    title: 'Certificado conquistado',
    body: 'Você completou o treinamento de Segurança Digital Básico! Baixe seu certificado.',
    type: 'certificate_earned',
    read_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { certificate_id: 'cert-789' },
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    user_id: 'mock',
    title: 'Campanha "Simulação SMS" iniciada',
    body: 'A campanha de smishing foi iniciada com 200 alvos. Monitore os resultados em tempo real.',
    type: 'info',
    read_at: null,
    metadata: { campaign_id: 'camp-456', target_count: 200 },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    user_id: 'mock',
    title: 'Novo usuário registrado',
    body: 'Maria Silva foi adicionada à empresa. Complete o onboarding.',
    type: 'info',
    read_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    metadata: { user_id: 'user-999', action: 'user_created' },
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    user_id: 'mock',
    title: 'Relatório semanal disponível',
    body: 'Seu resumo semanal de phishing está pronto. Clique para visualizar.',
    type: 'campaign_completed',
    read_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    metadata: { report_id: 'report-111' },
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// Page Component
// ============================================================================

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Initialize and fetch
  useEffect(() => {
    const init = async () => {
      const session = await getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    init();
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isMockMode()) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setNotifications(MOCK_NOTIFICATIONS);
      } else if (userId) {
        let query = supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (!error && data) {
          setNotifications(data as NotificationItem[]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (isMockMode() || !userId) return;

    const channel = supabase
      .channel('notifications-page-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationItem;
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as NotificationItem;
          setNotifications(prev =>
            prev.map(n => n.id === updated.id ? updated : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    if (isMockMode()) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      return;
    }

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
    );
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!userId && !isMockMode()) return;

    setIsMarkingAllRead(true);
    try {
      if (isMockMode()) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setNotifications(prev =>
          prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        );
      } else {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', userId)
          .is('read_at', null);

        setNotifications(prev =>
          prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        );
      }
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    setIsDeleting(notificationId);
    try {
      if (isMockMode()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId);

        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } finally {
      setIsDeleting(null);
    }
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const timeStr = diffMins < 1 ? 'Agora'
      : diffMins < 60 ? `${diffMins}min atrás`
      : diffHours < 24 ? `${diffHours}h atrás`
      : `${diffDays}d atrás`;

    const dateStr2 = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    return `${timeStr} · ${dateStr2}`;
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read_at;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10">
                <Bell className="h-6 w-6 text-[var(--color-accent)]" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                  Notificações
                </h1>
                <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                  {unreadCount > 0
                    ? `${unreadCount} não lidas`
                    : 'Todas as notificações foram lidas'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={markAllAsRead}
                disabled={isMarkingAllRead}
              >
                {isMarkingAllRead ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Marcando...
                  </>
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4" />
                    Marcar todas lidas
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Filters & Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 flex flex-wrap items-center gap-4"
        >
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 rounded-lg bg-[var(--color-surface-1)] p-1 border border-[var(--color-noir-700)]">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                filter === 'all'
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-fg-primary)]'
                  : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-secondary)]'
              )}
            >
              Todas
              <Badge variant="secondary" className="ml-1">
                {notifications.length}
              </Badge>
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                filter === 'unread'
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-fg-primary)]'
                  : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-secondary)]'
              )}
            >
              Não lidas
              {unreadCount > 0 && (
                <Badge variant="warning" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="ml-auto flex items-center gap-4 text-sm text-[var(--color-fg-muted)]">
            <span className="flex items-center gap-1.5">
              <Filter className="h-4 w-4" />
              {filteredNotifications.length} notificações
            </span>
          </div>
        </motion.div>

        {/* Notification List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {isLoading ? (
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-fg-muted)] mb-3" />
                <p className="text-sm text-[var(--color-fg-muted)]">Carregando notificações...</p>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
                  <Inbox className="h-8 w-8 text-[var(--color-fg-muted)]" />
                </div>
                <p className="text-lg font-medium text-[var(--color-fg-primary)]">
                  {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                </p>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  {filter === 'unread'
                    ? 'Você leu todas as suas notificações!'
                    : 'Suas notificações aparecerão aqui'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className={cn(
                        'border transition-all hover:border-[var(--color-noir-600)]',
                        config.borderColor,
                        !notification.read_at && 'bg-[var(--color-accent)]/5'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Icon */}
                          <div className={cn(
                            'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                            config.bgColor
                          )}>
                            <Icon className={cn('h-5 w-5', config.color)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className={cn(
                                    'text-sm font-medium text-[var(--color-fg-primary)]',
                                    !notification.read_at && 'font-semibold'
                                  )}>
                                    {notification.title}
                                  </h3>
                                  <Badge variant={config.badgeVariant} className="text-xs">
                                    {TYPE_LABELS[notification.type]}
                                  </Badge>
                                </div>
                                {notification.body && (
                                  <p className="mt-1.5 text-sm text-[var(--color-fg-secondary)] leading-relaxed">
                                    {notification.body}
                                  </p>
                                )}
                                <p className="mt-2 text-xs text-[var(--color-fg-tertiary)]">
                                  {formatTime(notification.created_at)}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                {!notification.read_at && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-8 w-8 p-0"
                                    title="Marcar como lida"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  disabled={isDeleting === notification.id}
                                  className="h-8 w-8 p-0 text-[var(--color-fg-muted)] hover:text-red-400"
                                  title="Excluir"
                                >
                                  {isDeleting === notification.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Realtime indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-[var(--color-fg-tertiary)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          Atualização em tempo real ativa
        </motion.div>
      </div>
    </div>
  );
}
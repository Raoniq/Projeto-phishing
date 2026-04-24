// src/components/notifications/NotificationBell.tsx
// Notification bell with unread badge and dropdown preview
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, CheckCheck, X, FileText, GraduationCap, Award, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSession, isMockMode } from '@/lib/auth/session';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: 'campaign_completed' | 'training_assigned' | 'certificate_earned' | 'info' | 'warning';
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// Type Icons
// ============================================================================

const TYPE_CONFIG = {
  campaign_completed: {
    icon: FileText,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  training_assigned: {
    icon: GraduationCap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  certificate_earned: {
    icon: Award,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  info: {
    icon: Info,
    color: 'text-[var(--color-fg-secondary)]',
    bgColor: 'bg-[var(--color-surface-2)]',
  },
} as const;

// ============================================================================
// NotificationBell Component
// ============================================================================

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user ID and initial notifications
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
    if (!userId && !isMockMode()) return;

    setIsLoading(true);
    try {
      if (isMockMode()) {
        // Mock data for demo
        const mockNotifications: Notification[] = [
          {
            id: '1',
            user_id: 'mock',
            title: 'Campanha "Phishing Q1" concluída',
            body: 'A campanha foi finalizada com 156 cliques e 48 reportes.',
            type: 'campaign_completed',
            read_at: null,
            metadata: { campaign_id: 'camp-123' },
            created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            user_id: 'mock',
            title: 'Novo treinamento atribuído',
            body: 'Complete o módulo de "Reconhecimento de Phishing" até sexta-feira.',
            type: 'training_assigned',
            read_at: null,
            metadata: { track_id: 'track-456' },
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            user_id: 'mock',
            title: 'Certificado conquistado',
            body: 'Você completou o treinamento de Segurança Digital Básico!',
            type: 'certificate_earned',
            read_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            metadata: { certificate_id: 'cert-789' },
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          },
        ];
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read_at).length);
      } else {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read_at).length);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchNotifications();

    if (isMockMode() || !userId) return;

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, userId]);

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    if (isMockMode()) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (isMockMode()) {
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
      return;
    }

    if (!userId) return;

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    setUnreadCount(0);
  };

  // Format relative time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-[var(--color-surface-2)]">
          <Bell className="h-5 w-5 text-[var(--color-fg-secondary)]" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-xs font-bold text-black"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-noir-700)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--color-accent)]" />
            <span className="font-display font-semibold text-[var(--color-fg-primary)]">
              Notificações
            </span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas lidas
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-[var(--color-fg-muted)]">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-[var(--color-fg-muted)] mb-2" />
              <p className="text-sm text-[var(--color-fg-muted)]">Nenhuma notificação</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                      'relative border-b border-[var(--color-noir-800)] last:border-b-0',
                      !notification.read_at && 'bg-[var(--color-accent)]/5'
                    )}
                  >
                    <div className="flex gap-3 p-3 hover:bg-[var(--color-surface-2)]/50 transition-colors">
                      {/* Icon */}
                      <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', config.bgColor)}>
                        <Icon className={cn('h-4 w-4', config.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-sm font-medium text-[var(--color-fg-primary)] leading-tight',
                            !notification.read_at && 'font-semibold'
                          )}>
                            {notification.title}
                          </p>
                          {!notification.read_at && (
                            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                          )}
                        </div>
                        {notification.body && (
                          <p className="mt-1 text-xs text-[var(--color-fg-muted)] line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-xs text-[var(--color-fg-tertiary)]">
                            {formatTime(notification.created_at)}
                          </span>
                          {!notification.read_at && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="ml-auto flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors"
                            >
                              <Check className="h-3 w-3" />
                              Marcar lida
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="border-[var(--color-noir-700)]" />
            <div className="p-2">
              <NotificationBellNavigation />
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Navigation Component (links to full notifications page)
// ============================================================================

function NotificationBellNavigation() {
  return (
    <a
      href="/app/notifications"
      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)] transition-colors"
    >
      Ver todas as notificações
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

export default NotificationBell;
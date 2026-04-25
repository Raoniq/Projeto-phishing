// src/components/notifications/NotificationBell.tsx
// Notification bell with unread badge and dropdown preview
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, CheckCheck, FileText, GraduationCap, Award, AlertTriangle, Info } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useNotifications } from '@/lib/hooks';
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
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(user?.id);

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
          {loading && notifications.length === 0 ? (
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
              {notifications.slice(0, 10).map((notification) => {
                const config = TYPE_CONFIG[notification.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
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
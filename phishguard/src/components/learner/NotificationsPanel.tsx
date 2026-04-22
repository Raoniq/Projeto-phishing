import { useState } from 'react';
import { Bell, Check, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'training';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationsPanelProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

const defaultNotifications: Notification[] = [
  {
    id: '1',
    type: 'training',
    title: 'Nova trilha atribuída',
    message: 'Você foi inscrito no curso "Phishing: Recognize and Report"',
    time: 'há 2 horas',
    read: false,
    actionUrl: '/learner/trilhas/phishing-basico',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Campanha agendada',
    message: 'Sua empresa realizará uma simulação de phishing amanhã',
    time: 'há 5 horas',
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Certificado disponível',
    message: 'Você completou o módulo "Introdução ao Phishing"',
    time: 'há 1 dia',
    read: true,
    actionUrl: '/learner/certificados',
  },
  {
    id: '4',
    type: 'info',
    title: 'Lembrete de progresso',
    message: 'Você tem 3 dias para completar o módulo atual',
    time: 'há 2 dias',
    read: true,
  },
];

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  training: Bell,
};

const iconColorMap = {
  info: 'text-[var(--color-blue-500)]',
  warning: 'text-[var(--color-warning)]',
  success: 'text-[var(--color-success)]',
  training: 'text-[var(--color-accent)]',
};

export function NotificationsPanel({
  notifications = defaultNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  className,
}: NotificationsPanelProps) {
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const unreadCount = localNotifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    onMarkAsRead?.(id);
  };

  const handleMarkAllAsRead = () => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onMarkAllAsRead?.();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-surface-3)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-5 w-5 text-[var(--color-fg-primary)]" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <h3 className="font-display text-base font-semibold text-[var(--color-fg-primary)]">
            Notificações
          </h3>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-subtle)]"
          >
            <Check className="h-3.5 w-3.5" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {localNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-[var(--color-surface-3)]" />
            <p className="mt-3 text-sm text-[var(--color-fg-tertiary)]">
              Nenhuma notificação
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-surface-3)]">
            {localNotifications.map((notification) => {
              const Icon = iconMap[notification.type];
              return (
                <li key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-[var(--color-surface-2)]',
                      !notification.read && 'bg-[var(--color-accent-subtle)]/30'
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        notification.type === 'training'
                          ? 'bg-[var(--color-accent-subtle)]'
                          : 'bg-[var(--color-surface-2)]'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', iconColorMap[notification.type])} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            notification.read
                              ? 'text-[var(--color-fg-secondary)]'
                              : 'text-[var(--color-fg-primary)]'
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--color-fg-tertiary)]">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--color-fg-quaternary)]">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--color-fg-tertiary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg-secondary)]"
                        aria-label="Marcar como lida"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
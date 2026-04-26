// components/dashboard/ActivityFeed.tsx
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { Mail, MousePointerClick, Flag, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'open' | 'click' | 'report' | 'campaign_start' | 'campaign_end';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  companyId: string;
  limit?: number;
  loading?: boolean;
  className?: string;
}

const activityIcons = {
  open: Mail,
  click: MousePointerClick,
  report: Flag,
  campaign_start: CheckCircle,
  campaign_end: Clock,
};

const activityColors = {
  open: 'text-[var(--color-blue-500)] bg-[var(--color-blue-500)]/10',
  click: 'text-[var(--color-amber-500)] bg-[var(--color-amber-500)]/10',
  report: 'text-[var(--color-success)] bg-[var(--color-success)]/10',
  campaign_start: 'text-[var(--color-success)] bg-[var(--color-success)]/10',
  campaign_end: 'text-[var(--color-fg-secondary)] bg-[var(--color-noir-700)]',
};

export function ActivityFeed({
  companyId,
  limit = 10,
  loading = false,
  className,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const formatActivityMessage = (action: string): string => {
      switch (action) {
        case 'open':
          return 'E-mail aberto por usuário';
        case 'click':
          return 'Link clicado em campanha';
        case 'report':
          return 'E-mail reportado como phishing';
        case 'campaign_launch':
          return 'Campanha iniciada';
        case 'campaign_complete':
          return 'Campanha finalizada';
        default:
          return action;
      }
    };

    const fetchInitialActivities = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        const mapped: ActivityItem[] = data.map((log) => ({
          id: log.id,
          type: log.action as ActivityItem['type'],
          message: formatActivityMessage(log.action, log),
          timestamp: log.created_at,
          metadata: log.new_data as Record<string, unknown> | undefined,
        }));
        setActivities(mapped);
      }
    };

    // Realtime subscription
    subscription = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const log = payload.new as Record<string, unknown>;
          const newActivity: ActivityItem = {
            id: log.id as string,
            type: log.action as ActivityItem['type'],
            message: formatActivityMessage(log.action as string, log as Record<string, unknown>),
            timestamp: log.created_at as string,
            metadata: log.new_data as Record<string, unknown> | undefined,
          };
          setActivities((prev) => [newActivity, ...prev.slice(0, limit - 1)]);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    fetchInitialActivities();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [companyId, limit]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Card className={cn('bg-[var(--color-surface-1)] border-[var(--color-noir-700)]', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
            <div className="w-2 h-2 rounded-full bg-[var(--color-noir-600)] animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--color-noir-700)] rounded" />
                <div className="flex-1">
                  <div className="h-3 w-32 bg-[var(--color-noir-700)] rounded mb-2" />
                  <div className="h-2 w-16 bg-[var(--color-noir-700)] rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-[var(--color-surface-1)] border-[var(--color-noir-700)]', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Atividade Recente</CardTitle>
          <div
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              isConnected ? 'bg-[var(--color-success)]' : 'bg-[var(--color-noir-600)]'
            )}
            title={isConnected ? 'Conectado' : 'Desconectado'}
          />
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-fg-muted)]">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma atividade ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type] || AlertCircle;
              const colorClass = activityColors[activity.type] || activityColors.campaign_end;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 group hover:bg-[var(--color-surface-2)] -mx-2 px-2 py-2 rounded-lg transition-colors"
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-fg-primary)]">{activity.message}</p>
                    <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// components/analytics/AttachmentTracking.tsx
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Download, Eye, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

interface AttachmentStat {
  id: string;
  attachment_name: string;
  attachment_hash: string;
  opened_count: number;
  opened_at: string | null;
}

interface AttachmentTrackingProps {
  campaignId: string;
  className?: string;
}

export function AttachmentTracking({
  campaignId: _campaignId,
  className,
}: AttachmentTrackingProps) {
  const { company } = useAuth();
  const [attachments, setAttachments] = useState<AttachmentStat[]>([]);
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEngagementLevel(count: number): { label: string; color: string; bgColor: string } {
  if (count >= 20) {
    return { label: 'High', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' };
  }
  if (count >= 10) {
    return { label: 'Medium', color: 'text-amber-400', bgColor: 'bg-amber-400/10' };
  }
  if (count >= 1) {
    return { label: 'Low', color: 'text-red-400', bgColor: 'bg-red-400/10' };
  }
  return { label: 'None', color: 'text-[var(--color-noir-400)]', bgColor: 'bg-[var(--color-noir-700)]' };
}

export function AttachmentTracking({
  campaignId: _campaignId,
  className,
}: AttachmentTrackingProps) {
  const [attachments, setAttachments] = useState<AttachmentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'count' | 'date'>('count');

  useEffect(() => {
    if (!company?.id) return;

    const loadData = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('campaign_events')
        .select(`
          id,
          event_type,
          created_at,
          campaign_target:campaign_targets(
            id,
            attachment_name,
            attachment_hash
          )
        `)
        .eq('company_id', company.id)
        .eq('event_type', 'attachment_opened')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading attachment data:', error);
        setAttachments([]);
      } else {
        // Aggregate attachment stats
        const statsMap = new Map<string, AttachmentStat>();
        for (const event of data || []) {
          const target = event.campaign_target as unknown as { id: string; attachment_name: string; attachment_hash: string } | null;
          if (!target) continue;

          const key = target.attachment_hash;
          const existing = statsMap.get(key);
          if (existing) {
            existing.opened_count += 1;
            if (!existing.opened_at || event.created_at > existing.opened_at) {
              existing.opened_at = event.created_at;
            }
          } else {
            statsMap.set(key, {
              id: target.id,
              attachment_name: target.attachment_name,
              attachment_hash: key,
              opened_count: 1,
              opened_at: event.created_at,
            });
          }
        }
        setAttachments(Array.from(statsMap.values()));
      }

      setLoading(false);
    };

    loadData();
  }, [company?.id]);

  const sortedAttachments = [...attachments].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.attachment_name.localeCompare(b.attachment_name);
      case 'count':
        return b.opened_count - a.opened_count;
      case 'date':
        return new Date(b.opened_at || 0).getTime() - new Date(a.opened_at || 0).getTime();
      default:
        return 0;
    }
  });

  const totalOpens = attachments.reduce((sum, a) => sum + a.opened_count, 0);
  const uniqueAttachments = attachments.length;
  const engagementRate = uniqueAttachments > 0
    ? ((attachments.filter(a => a.opened_count > 0).length / uniqueAttachments) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <Card className={cn('bg-[var(--color-surface-1)] border-[var(--color-noir-700)]', className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-accent)]" />
            Attachment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--color-noir-700)] rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-[var(--color-noir-700)] rounded" />
                  <div className="h-3 w-32 bg-[var(--color-noir-800)] rounded" />
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
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-accent)]" />
            Attachment Tracking
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 text-xs',
                sortBy === 'count' ? 'bg-[var(--color-noir-700)]' : ''
              )}
              onClick={() => setSortBy('count')}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Top
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 text-xs',
                sortBy === 'name' ? 'bg-[var(--color-noir-700)]' : ''
              )}
              onClick={() => setSortBy('name')}
            >
              <FileText className="w-3 h-3 mr-1" />
              A-Z
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 text-xs',
                sortBy === 'date' ? 'bg-[var(--color-noir-700)]' : ''
              )}
              onClick={() => setSortBy('date')}
            >
              <Eye className="w-3 h-3 mr-1" />
              Recent
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--color-noir-800)] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-[var(--color-accent)]">{totalOpens}</div>
            <div className="text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wider">
              Total Opens
            </div>
          </div>
          <div className="bg-[var(--color-noir-800)] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-[var(--color-accent-teal)]">{uniqueAttachments}</div>
            <div className="text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wider">
              Attachments
            </div>
          </div>
          <div className="bg-[var(--color-noir-800)] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-[var(--color-accent-gold)]">{engagementRate}%</div>
            <div className="text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wider">
              Engagement
            </div>
          </div>
        </div>

        {/* Attachment List */}
        {sortedAttachments.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-fg-muted)]">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No attachments tracked yet</p>
            <p className="text-xs mt-1">Attachments will appear here once recipients open them</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAttachments.map((attachment, idx) => {
              const engagement = getEngagementLevel(attachment.opened_count);

              return (
                <div
                  key={attachment.id}
                  className="animate-fade-in bg-[var(--color-noir-800)] rounded-lg p-4 transition-all hover:bg-[var(--color-noir-750)]"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-1)] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[var(--color-accent)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-[var(--color-fg-primary)] truncate">
                            {attachment.attachment_name}
                          </p>
                          <span className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider',
                            engagement.bgColor,
                            engagement.color
                          )}>
                            {engagement.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-[var(--color-fg-muted)]">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {attachment.opened_count} opens
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {formatDate(attachment.opened_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-bold text-[var(--color-fg-primary)]">
                          {attachment.opened_count}
                        </div>
                        <div className="text-[10px] text-[var(--color-fg-muted)] uppercase">
                          views
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Engagement Bar */}
                  <div className="mt-3 h-1.5 bg-[var(--color-noir-700)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min((attachment.opened_count / 30) * 100, 100)}%`,
                        backgroundColor: engagement.color.replace('text-', ''),
                        background: engagement.color.includes('emerald')
                          ? 'linear-gradient(90deg, var(--color-accent-teal), var(--color-accent))'
                          : engagement.color.includes('amber')
                            ? 'linear-gradient(90deg, var(--color-accent-gold), var(--color-accent))'
                            : 'linear-gradient(90deg, var(--color-noir-600), var(--color-noir-500))',
                      }}
                    />
                  </div>

                  {/* Hash identifier (truncated) */}
                  <div className="mt-2 text-[9px] text-[var(--color-noir-500)] font-mono truncate">
                    ID: {attachment.attachment_hash.substring(0, 16)}...
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {sortedAttachments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[var(--color-noir-700)]">
            <div className="flex items-center justify-between text-[10px] text-[var(--color-fg-muted)]">
              <span className="flex items-center gap-1.5">
                <Download className="w-3 h-3" />
                Tracking based on hash verification
              </span>
              <span>Updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
// components/dashboard/CampaignFunnel.tsx
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface FunnelStage {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

interface CampaignFunnelProps {
  stages: FunnelStage[];
  loading?: boolean;
  className?: string;
}

export function CampaignFunnel({ stages, loading, className }: CampaignFunnelProps) {
  if (loading) {
    return (
      <Card className={cn('bg-[var(--color-surface-1)] border-[var(--color-noir-700)]', className)}>
        <CardHeader>
          <CardTitle className="text-lg">Funil de Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[80, 60, 40, 20].map((w, i) => (
              <div key={i}>
                <div className="h-3 w-20 bg-[var(--color-noir-700)] rounded mb-2" />
                <div
                  className="h-8 bg-[var(--color-noir-700)] rounded"
                  style={{ width: `${w}%` }}
                />
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
        <CardTitle className="text-lg">Funil de Campanha</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stages.map((stage) => {
            const percentage = (stage.value / stage.maxValue) * 100;
            return (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--color-fg-secondary)]">
                    {stage.label}
                  </span>
                  <span className="text-sm font-mono text-[var(--color-fg-primary)]">
                    {stage.value.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="relative h-8 bg-[var(--color-noir-800)] rounded overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded transition-all duration-700 ease-out"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: stage.color,
                      opacity: 0.85,
                    }}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-[var(--color-fg-muted)]">
                    {((percentage / 100) * 100).toFixed(1)}% do total
                  </span>
                  <span className="text-xs text-[var(--color-fg-muted)]">
                    meta: {stage.maxValue.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

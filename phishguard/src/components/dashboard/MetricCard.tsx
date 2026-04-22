// components/dashboard/MetricCard.tsx
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number; // percentage change
  changeLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  loading = false,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="w-3 h-3" />;
    }
    return change > 0 ? (
      <TrendingUp className="w-3 h-3" />
    ) : (
      <TrendingDown className="w-3 h-3" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-[var(--color-fg-secondary)]';
    // For negative change in risk/phishing rate, it's good
    if (label.toLowerCase().includes('risco') || label.toLowerCase().includes('phishing')) {
      return change < 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]';
    }
    return change > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]';
  };

  const formatChange = () => {
    if (change === undefined) return null;
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change}%`;
  };

  if (loading) {
    return (
      <Card className={cn('bg-[var(--color-surface-1)] border-[var(--color-noir-700)]', className)}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 w-24 bg-[var(--color-noir-700)] rounded mb-3" />
            <div className="h-8 w-16 bg-[var(--color-noir-700)] rounded mb-2" />
            <div className="h-3 w-20 bg-[var(--color-noir-700)] rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'bg-[var(--color-surface-1)] border-[var(--color-noir-700)] hover:border-[var(--color-noir-600)] transition-all duration-200',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-[var(--color-fg-secondary)]">{label}</p>
            <p className="mt-2 text-3xl font-display font-bold text-[var(--color-fg-primary)]">
              {value}
            </p>
            {change !== undefined && (
              <div className={cn('mt-2 flex items-center gap-1 text-xs', getTrendColor())}>
                {getTrendIcon()}
                <span>{formatChange()}</span>
                {changeLabel && (
                  <span className="text-[var(--color-fg-muted)] ml-1">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-accent)]">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

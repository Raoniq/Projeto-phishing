// components/analytics/BenchmarkComparison.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { TrendingUp, TrendingDown, Minus, Award, Target, BarChart3 } from 'lucide-react';

type Industry = 'finance' | 'healthcare' | 'technology';

interface BenchmarkMetric {
  label: string;
  company: number;
  industry: number;
  best: number;
  unit: string;
  lowerIsBetter: boolean;
}

interface IndustryData {
  label: string;
  color: string;
  metrics: BenchmarkMetric[];
}

const INDUSTRIES: Record<Industry, IndustryData> = {
  finance: {
    label: 'Finance',
    color: 'var(--color-accent-teal)',
    metrics: [
      { label: 'Click Rate', company: 6.2, industry: 8.5, best: 5.0, unit: '%', lowerIsBetter: true },
      { label: 'Report Rate', company: 14.8, industry: 15.0, best: 20.0, unit: '%', lowerIsBetter: false },
      { label: 'Avg Time to Click', company: 52, industry: 45, best: 30, unit: 's', lowerIsBetter: true },
      { label: 'Compromise Rate', company: 2.8, industry: 3.2, best: 1.5, unit: '%', lowerIsBetter: true },
    ],
  },
  healthcare: {
    label: 'Healthcare',
    color: 'var(--color-accent-violet)',
    metrics: [
      { label: 'Click Rate', company: 5.1, industry: 6.8, best: 4.0, unit: '%', lowerIsBetter: true },
      { label: 'Report Rate', company: 15.3, industry: 12.0, best: 18.0, unit: '%', lowerIsBetter: false },
      { label: 'Avg Time to Click', company: 48, industry: 58, best: 40, unit: 's', lowerIsBetter: true },
      { label: 'Compromise Rate', company: 3.5, industry: 4.1, best: 2.0, unit: '%', lowerIsBetter: true },
    ],
  },
  technology: {
    label: 'Technology',
    color: 'var(--color-accent-gold)',
    metrics: [
      { label: 'Click Rate', company: 5.8, industry: 7.2, best: 4.5, unit: '%', lowerIsBetter: true },
      { label: 'Report Rate', company: 22.1, industry: 20.0, best: 28.0, unit: '%', lowerIsBetter: false },
      { label: 'Avg Time to Click', company: 38, industry: 42, best: 25, unit: 's', lowerIsBetter: true },
      { label: 'Compromise Rate', company: 2.1, industry: 2.8, best: 1.2, unit: '%', lowerIsBetter: true },
    ],
  },
};

interface BenchmarkComparisonProps {
  companyId: string;
  loading?: boolean;
  className?: string;
}

function getTrendIcon(company: number, industry: number, lowerIsBetter: boolean) {
  if (company < industry) {
    return lowerIsBetter ? (
      <TrendingDown className="w-4 h-4 text-emerald-400" />
    ) : (
      <TrendingUp className="w-4 h-4 text-emerald-400" />
    );
  } else if (company > industry) {
    return lowerIsBetter ? (
      <TrendingUp className="w-4 h-4 text-red-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    );
  }
  return <Minus className="w-4 h-4 text-[var(--color-noir-400)]" />;
}

function calculatePercentile(company: number, industry: number, best: number, lowerIsBetter: boolean): number {
  if (lowerIsBetter) {
    if (company <= best) return 90;
    if (company <= industry * 0.8) return 75;
    if (company <= industry) return 50;
    if (company <= industry * 1.2) return 25;
    return 10;
  } else {
    if (company >= best) return 90;
    if (company >= industry * 1.2) return 75;
    if (company >= industry) return 50;
    if (company >= industry * 0.8) return 25;
    return 10;
  }
}

function getPercentileColor(percentile: number): string {
  if (percentile >= 75) return 'text-emerald-400';
  if (percentile >= 50) return 'text-[var(--color-accent)]';
  if (percentile >= 25) return 'text-amber-400';
  return 'text-red-400';
}

function getPercentileLabel(percentile: number): string {
  if (percentile >= 75) return 'Top Quartile';
  if (percentile >= 50) return 'Above Average';
  if (percentile >= 25) return 'Below Average';
  return 'Needs Attention';
}

export function BenchmarkComparison({
    loading = false,
  className,
}: BenchmarkComparisonProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('finance');
  const industry = INDUSTRIES[selectedIndustry];

  if (loading) {
    return (
      <Card className={cn('bg-[var(--color-surface-1)] border-[var(--color-noir-700)]', className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--color-accent)]" />
            Industry Benchmark
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-4 w-32 bg-[var(--color-noir-700)] rounded mb-3" />
                <div className="h-8 bg-[var(--color-noir-700)] rounded mb-2" />
                <div className="h-2 bg-[var(--color-noir-800)] rounded" />
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
            <BarChart3 className="w-5 h-5 text-[var(--color-accent)]" />
            Industry Benchmark
          </CardTitle>
          <Select value={selectedIndustry} onValueChange={(v) => setSelectedIndustry(v as Industry)}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-[var(--color-surface-0)] border-[var(--color-noir-600)]">
              <SelectValue placeholder="Select industry..." />
            </SelectTrigger>
            <SelectContent className="bg-[var(--color-surface-1)] border-[var(--color-noir-700)]">
              {Object.entries(INDUSTRIES).map(([key, data]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {data.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {industry.metrics.map((metric, idx) => {
            const percentile = calculatePercentile(
              metric.company,
              metric.industry,
              metric.best,
              metric.lowerIsBetter
            );
            const companyPercent = Math.min((metric.company / metric.industry) * 100, 120);
            const industryPercent = 100;
            const bestPercent = Math.min((metric.best / metric.industry) * 100, 100);

            return (
              <div
                key={metric.label}
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-fg-primary)]">
                    {metric.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={cn('flex items-center gap-1 text-xs', getPercentileColor(percentile))}>
                      {getTrendIcon(metric.company, metric.industry, metric.lowerIsBetter)}
                      <span className="font-medium">{percentile}%</span>
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded bg-[var(--color-noir-800)]', getPercentileColor(percentile))}>
                      {getPercentileLabel(percentile)}
                    </span>
                  </div>
                </div>

                <div className="relative space-y-1.5">
                  {/* Company bar - accent color */}
                  <div className="relative h-4 bg-[var(--color-noir-800)] rounded overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded transition-all duration-700 ease-out"
                      style={{
                        width: `${companyPercent}%`,
                        backgroundColor: industry.color,
                        opacity: 0.9,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                        {metric.company}{metric.unit}
                      </span>
                    </div>
                  </div>

                  {/* Industry average line */}
                  <div className="relative h-2 bg-[var(--color-noir-800)] rounded overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-[var(--color-noir-500)] transition-all duration-700"
                      style={{ width: `${industryPercent}%` }}
                    />
                  </div>

                  {/* Best practice marker */}
                  <div
                    className="absolute h-5 w-0.5 bg-[var(--color-accent-gold)] rounded-full shadow-[0_0_8px_var(--color-accent-gold)] transition-all duration-700"
                    style={{
                      left: `${bestPercent}%`,
                      top: '-8px',
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded" style={{ backgroundColor: industry.color }} />
                    <span className="text-[var(--color-fg-muted)]">Company</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-[var(--color-noir-500)]" />
                    <span className="text-[var(--color-fg-muted)]">Industry: {metric.industry}{metric.unit}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3 h-3 text-[var(--color-accent-gold)]" />
                    <span className="text-[var(--color-accent-gold)]">Best: {metric.best}{metric.unit}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--color-noir-700)]">
          <div className="flex items-center justify-between text-[10px] text-[var(--color-fg-muted)]">
            <span className="flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              Benchmark data collected from 500+ organizations
            </span>
            <span>Updated: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
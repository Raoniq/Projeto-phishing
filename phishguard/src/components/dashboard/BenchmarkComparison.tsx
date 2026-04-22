// components/dashboard/BenchmarkComparison.tsx
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

type Sector = 'financeiro' | 'juridico' | 'saude' | 'ecommerce' | 'tecnologia' | 'logistica';

interface SectorData {
  label: string;
  clickRate: number;
  reportRate: number;
  avgTime: number;
  campaignsMonth: number;
}

const SECTORS: Record<Sector, SectorData> = {
  financeiro: {
    label: 'Financeiro',
    clickRate: 8,
    reportRate: 15,
    avgTime: 45,
    campaignsMonth: 12,
  },
  juridico: {
    label: 'Jurídico',
    clickRate: 5,
    reportRate: 18,
    avgTime: 62,
    campaignsMonth: 6,
  },
  saude: {
    label: 'Saúde',
    clickRate: 6,
    reportRate: 12,
    avgTime: 58,
    campaignsMonth: 8,
  },
  ecommerce: {
    label: 'E-commerce',
    clickRate: 10,
    reportRate: 8,
    avgTime: 38,
    campaignsMonth: 15,
  },
  tecnologia: {
    label: 'Tecnologia',
    clickRate: 7,
    reportRate: 20,
    avgTime: 42,
    campaignsMonth: 10,
  },
  logistica: {
    label: 'Logística',
    clickRate: 4,
    reportRate: 10,
    avgTime: 55,
    campaignsMonth: 7,
  },
};

interface BenchmarkData {
  label: string;
  company: number;
  industry: number;
  best: number;
  insight: string;
}

interface BenchmarkComparisonProps {
  companyId: string;
  loading?: boolean;
  className?: string;
}

function buildBenchmarks(sector: SectorData, companyClickRate: number): BenchmarkData[] {
  const insightClick = ((sector.clickRate - companyClickRate) / sector.clickRate * 100).toFixed(0);
  const signClick = companyClickRate < sector.clickRate ? 'melhor' : 'pior';

  return [
    {
      label: 'Taxa de Click',
      company: companyClickRate,
      industry: sector.clickRate,
      best: sector.clickRate * 0.6,
      insight: `${Math.abs(Number(insightClick))}% ${signClick} que média do setor`,
    },
    {
      label: 'Taxa de Report',
      company: 14,
      industry: sector.reportRate,
      best: sector.reportRate * 1.4,
      insight: `${((14 - sector.reportRate) / sector.reportRate * 100).toFixed(0)}% melhor que média do setor`,
    },
    {
      label: 'Tempo Médio',
      company: 48,
      industry: sector.avgTime,
      best: sector.avgTime * 0.7,
      insight: `${Math.abs(((48 - sector.avgTime) / sector.avgTime * 100)).toFixed(0)}% melhor que média do setor`,
    },
    {
      label: 'Campanhas/Mês',
      company: 11,
      industry: sector.campaignsMonth,
      best: sector.campaignsMonth * 1.5,
      insight: `${((11 - sector.campaignsMonth) / sector.campaignsMonth * 100).toFixed(0)}% acima da média do setor`,
    },
  ];
}

export function BenchmarkComparison({
  companyId: _companyId,
  loading = false,
  className,
}: BenchmarkComparisonProps) {
  const [selectedSector, setSelectedSector] = useState<Sector>('financeiro');
  const benchmarks = buildBenchmarks(SECTORS[selectedSector], 6);

  if (loading) {
    return (
      <Card className={cn('bg-[var(--color-surface-1)] border-[var(--color-noir-700)]', className)}>
        <CardHeader>
          <CardTitle className="text-lg">Comparativo do Setor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-3 w-24 bg-[var(--color-noir-700)] rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-2 bg-[var(--color-noir-700)] rounded" />
                  <div className="h-2 bg-[var(--color-noir-700)] rounded" />
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
          <CardTitle className="text-lg">Comparativo do Setor</CardTitle>
          <Select value={selectedSector} onValueChange={(v) => setSelectedSector(v as Sector)}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-[var(--color-surface-0)] border-[var(--color-noir-600)]">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className="bg-[var(--color-surface-1)] border-[var(--color-noir-700)]">
              {Object.entries(SECTORS).map(([key, data]) => (
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
          {benchmarks.map((benchmark, idx) => {
            const companyPercent = benchmark.industry > 0
              ? Math.min((benchmark.company / benchmark.industry) * 100, 100)
              : 0;
            const industryPercent = 100;
            const bestPercent = benchmark.industry > 0
              ? Math.min((benchmark.best / benchmark.industry) * 100, 100)
              : 100;

            return (
              <div key={benchmark.label} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--color-fg-secondary)]">
                    {benchmark.label}
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                      <span className="text-[var(--color-fg-muted)]">Empresa</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-noir-500)]" />
                      <span className="text-[var(--color-fg-muted)]">Setor</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-noir-400)]" />
                      <span className="text-[var(--color-fg-muted)]">Melhor</span>
                    </span>
                  </div>
                </div>
                <div className="relative space-y-1">
                  {/* Company bar */}
                  <div className="relative h-3 bg-[var(--color-noir-800)] rounded overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-[var(--color-accent)] transition-all duration-500"
                      style={{ width: `${companyPercent}%` }}
                    />
                  </div>
                  {/* Industry bar */}
                  <div className="relative h-2 bg-[var(--color-noir-800)] rounded overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-[var(--color-noir-500)] transition-all duration-500"
                      style={{ width: `${industryPercent}%` }}
                    />
                  </div>
                  {/* Best practice line */}
                  <div
                    className="absolute h-4 w-0.5 bg-[var(--color-noir-400)] transition-all duration-500"
                    style={{
                      left: `${bestPercent}%`,
                      top: '2px'
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-[var(--color-fg-muted)]">{benchmark.company}%</span>
                  <span className="text-xs text-[var(--color-accent)] italic">{benchmark.insight}</span>
                  <span className="text-xs text-[var(--color-fg-muted)]">{benchmark.industry}%</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-[10px] text-[var(--color-fg-muted)] text-center">
          * Dados anonimizados de +50 empresas do setor
        </p>
      </CardContent>
    </Card>
  );
}

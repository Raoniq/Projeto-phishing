// components/dashboard/BenchmarkComparison.tsx
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { supabase } from '@/lib/supabase';

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

const SECTOR_MAP: Record<Sector, string> = {
  financeiro: 'finance',
  juridico: 'healthcare',
  saude: 'healthcare',
  ecommerce: 'ecommerce',
  tecnologia: 'technology',
  logistica: 'logistics',
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

interface CompanyMetrics {
  clickRate: number;
  reportRate: number;
  avgTime: number;
  campaignsPerMonth: number;
}

interface IndustryBenchmarks {
  clickRate: number | null;
  reportRate: number | null;
  avgTime: number | null;
  campaignsPerMonth: number | null;
}

export function BenchmarkComparison({
  companyId,
  loading = false,
  className,
}: BenchmarkComparisonProps) {
  const [selectedSector, setSelectedSector] = useState<Sector>('financeiro');
  const [companyMetrics, setCompanyMetrics] = useState<CompanyMetrics | null>(null);
  const [industryBenchmarks, setIndustryBenchmarks] = useState<IndustryBenchmarks | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasCompanyData, setHasCompanyData] = useState(false);
  const [hasIndustryData, setHasIndustryData] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setIsLoadingData(false);
      return;
    }

    const fetchData = async () => {
      setIsLoadingData(true);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      const [
        sentResult,
        clickedResult,
        reportedResult,
        campaignsResult,
        benchmarksResult,
      ] = await Promise.all([
        supabase
          .from('campaign_events')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('event_type', 'sent'),
        supabase
          .from('campaign_events')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('event_type', 'clicked'),
        supabase
          .from('campaign_events')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('event_type', 'reported'),
        supabase
          .from('campaigns')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('created_at', thirtyDaysAgoStr),
        supabase
          .from('industry_benchmarks')
          .select('metric_type, percentile_50')
          .eq('industry', SECTOR_MAP[selectedSector]),
      ]);

      const sent = sentResult.count || 0;
      const clicked = clickedResult.count || 0;
      const reported = reportedResult.count || 0;
      const campaignsCount = campaignsResult.count || 0;

      setHasCompanyData(sent > 0);

      const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;
      const reportRate = sent > 0 ? (reported / sent) * 100 : 0;

      setCompanyMetrics({
        clickRate: Math.round(clickRate * 100) / 100,
        reportRate: Math.round(reportRate * 100) / 100,
        avgTime: 0,
        campaignsPerMonth: campaignsCount,
      });

      if (benchmarksResult.data && benchmarksResult.data.length > 0) {
        setHasIndustryData(true);
        const bmData = benchmarksResult.data;
        const getBenchmark = (metricType: string) => {
          const item = bmData.find((b) => b.metric_type === metricType);
          return item?.percentile_50 ?? null;
        };

        setIndustryBenchmarks({
          clickRate: getBenchmark('click_rate'),
          reportRate: getBenchmark('report_rate'),
          avgTime: getBenchmark('avg_time'),
          campaignsPerMonth: getBenchmark('campaigns_per_month'),
        });
      } else {
        setHasIndustryData(false);
        setIndustryBenchmarks(null);
      }

      setIsLoadingData(false);
    };

    fetchData();
  }, [companyId, selectedSector]);

  const buildBenchmarks = (): BenchmarkData[] => {
    if (!companyMetrics || !hasCompanyData) return [];

    const sector = SECTORS[selectedSector];
    const industry = industryBenchmarks;

    const industryClickRate = industry?.clickRate ?? sector.clickRate;
    const industryReportRate = industry?.reportRate ?? sector.reportRate;
    const industryAvgTime = industry?.avgTime ?? sector.avgTime;
    const industryCampaignsMonth = industry?.campaignsPerMonth ?? sector.campaignsMonth;

    const insightClick = ((industryClickRate - companyMetrics.clickRate) / industryClickRate * 100).toFixed(0);
    const signClick = companyMetrics.clickRate < industryClickRate ? 'melhor' : 'pior';

    const insightReport = ((companyMetrics.reportRate - industryReportRate) / industryReportRate * 100).toFixed(0);
    const signReport = companyMetrics.reportRate > industryReportRate ? 'melhor' : 'pior';

    const insightCampaigns = ((companyMetrics.campaignsPerMonth - industryCampaignsMonth) / industryCampaignsMonth * 100).toFixed(0);
    const signCampaigns = companyMetrics.campaignsPerMonth > industryCampaignsMonth ? 'acima' : 'abaixo';

    return [
      {
        label: 'Taxa de Click',
        company: companyMetrics.clickRate,
        industry: industryClickRate,
        best: industryClickRate * 0.6,
        insight: `${Math.abs(Number(insightClick))}% ${signClick} que média do setor`,
      },
      {
        label: 'Taxa de Report',
        company: companyMetrics.reportRate,
        industry: industryReportRate,
        best: industryReportRate * 1.4,
        insight: `${Math.abs(Number(insightReport))}% ${signReport} que média do setor`,
      },
      {
        label: 'Tempo Médio',
        company: companyMetrics.avgTime,
        industry: industryAvgTime,
        best: industryAvgTime * 0.7,
        insight: companyMetrics.avgTime > 0
          ? `${Math.abs(((companyMetrics.avgTime - industryAvgTime) / industryAvgTime * 100)).toFixed(0)}% melhor que média do setor`
          : 'Sem dados de tempo',
      },
      {
        label: 'Campanhas/Mês',
        company: companyMetrics.campaignsPerMonth,
        industry: industryCampaignsMonth,
        best: industryCampaignsMonth * 1.5,
        insight: `${Math.abs(Number(insightCampaigns))}% ${signCampaigns} da média do setor`,
      },
    ];
  };

  if (loading || isLoadingData) {
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

  const benchmarks = hasCompanyData ? buildBenchmarks() : [];

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
        {!hasCompanyData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-[var(--color-fg-muted)]">Sem dados suficientes para comparar</p>
            <p className="text-xs text-[var(--color-fg-muted)] mt-1">Crie campanhas para ver métricas reais</p>
          </div>
        ) : (
          <>
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
            <p className={`mt-6 text-[10px] text-[var(--color-fg-muted)] text-center ${!hasIndustryData ? '' : ''}`}>
              {!hasIndustryData ? (
                <>
                  * Dados setoriais estimados
                </>
              ) : (
                <>
                  * Dados anonimizados de +50 empresas do setor
                </>
              )}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
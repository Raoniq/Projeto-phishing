// routes/app/inteligencia/page.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Target,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RiskRing, BenchmarkComparison } from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

// Department risk from real data
type DeptRisk = { name: string; risk: number };

// Insights generated from real data
type Insight = {
  icon: typeof Users;
  text: string;
  trend: 'up' | 'down';
  trendColor: string;
};

function getRiskColor(value: number): string {
  if (value > 50) return 'var(--color-danger)';
  if (value > 30) return 'var(--color-amber-500)';
  return 'var(--color-success)';
}

function getBarColor(value: number): string {
  if (value > 50) return 'bg-[var(--color-danger)]';
  if (value > 30) return 'bg-[var(--color-amber-500)]';
  return 'bg-[var(--color-success)]';
}

export default function InteligenciaPage() {
  const { company, loading: authLoading } = useAuth();
  const [departments, setDepartments] = useState<DeptRisk[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [avgRisk, setAvgRisk] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !company?.id) {
      if (!authLoading && !company?.id) {
        setDepartments([]);
        setInsights([]);
        setAvgRisk(0);
        setLoading(false);
      }
      return;
    }

    const fetchData = async () => {
      try {
        const companyId = company.id;

        // Fetch department scores
        const { data: deptData } = await supabase
          .from('department_scores')
          .select('department, avg_risk_score')
          .eq('company_id', companyId)
          .order('avg_risk_score', { ascending: false })
          .limit(5);

        if (deptData && deptData.length > 0) {
          setDepartments(deptData.map(d => ({
            name: d.department,
            risk: Math.round(d.avg_risk_score)
          })));
        } else {
          // Fallback if no department data
          setDepartments([
            { name: 'Sem dados', risk: 0 }
          ]);
        }

        // Calculate avg risk from dept scores
        if (deptData && deptData.length > 0) {
          const avg = Math.round(
            deptData.reduce((sum, d) => sum + d.avg_risk_score, 0) / deptData.length
          );
          setAvgRisk(avg);
        }

        // Generate insights from real data
        const newInsights: Insight[] = [];

        // Insight: highest risk department
        if (deptData && deptData.length > 0) {
          const highest = deptData[0];
          newInsights.push({
            icon: AlertTriangle,
            text: `Depto ${highest.department} tem maior risco (${Math.round(highest.avg_risk_score)}%)`,
            trend: 'up',
            trendColor: 'text-[var(--color-danger)]'
          });
        }

        // Insight: users without campaigns
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        if (userCount === 0) {
          newInsights.push({
            icon: Users,
            text: 'Nenhum usuário cadastrado na empresa',
            trend: 'up',
            trendColor: 'text-[var(--color-warning)]'
          });
        }

        setInsights(newInsights.length > 0 ? newInsights : [{
          icon: Lightbulb,
          text: 'Cadastre usuários e envie campanhas para ver insights',
          trend: 'down',
          trendColor: 'text-[var(--color-success)]'
        }]);

      } catch (err) {
        console.error('[Inteligencia] Failed to fetch data:', err);
        setDepartments([{ name: 'Erro ao carregar', risk: 0 }]);
        setInsights([{
          icon: AlertTriangle,
          text: 'Não foi possível carregar os dados',
          trend: 'up',
          trendColor: 'text-[var(--color-danger)]'
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [company, authLoading]);
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <h1 className="font-display text-3xl font-bold text-[var(--color-fg-primary)]">
          Inteligência
        </h1>
        <span className="inline-flex items-center rounded-full bg-[var(--color-amber-500)]/20 px-2.5 py-0.5 text-xs font-medium text-[var(--color-amber-500)] border border-[var(--color-amber-500)]/30">
          Beta
        </span>
      </motion.div>

      {/* Top Row: Risk Ring + Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        {/* Risk Ring */}
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[var(--color-accent)]" />
              Risco Organizacional
            </CardTitle>
            <CardDescription>
              Score geral de vulnerabilidade
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <RiskRing value={avgRisk} size={180} strokeWidth={14} />
            <p className="mt-4 text-center text-sm text-[var(--color-fg-secondary)]">
              {avgRisk}% dos funcionários expostos a phishing
            </p>
          </CardContent>
        </Card>

        {/* Department Risk Summary */}
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[var(--color-accent)]" />
              Top Departamentos
            </CardTitle>
            <CardDescription>
              Ranking de risco por departamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-8 bg-[var(--color-noir-800)] rounded animate-pulse" />
                ))}
              </div>
            ) : departments.length === 0 ? (
              <p className="text-sm text-[var(--color-fg-secondary)]">Nenhum dado de departamento</p>
            ) : (
              departments.map((dept, index) => (
                <div key={dept.name} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-[var(--color-fg-secondary)]">
                    {dept.name}
                  </div>
                  <div className="flex-1">
                    <div className="h-4 rounded bg-[var(--color-noir-800)] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dept.risk}%` }}
                        transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                        className={cn('h-full rounded', getBarColor(dept.risk))}
                        style={{
                          boxShadow: `0 0 8px ${getRiskColor(dept.risk)}60`
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className="w-12 text-right text-sm font-mono font-bold"
                    style={{ color: getRiskColor(dept.risk) }}
                  >
                    {dept.risk}%
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[var(--color-accent)]" />
              Insights Automáticos
            </CardTitle>
            <CardDescription>
              Análises geradas automaticamente pelos dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {loading ? (
                [1,2].map(i => (
                  <div key={i} className="h-20 bg-[var(--color-surface-2)] rounded animate-pulse" />
                ))
              ) : insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-surface-1)]">
                    <insight.icon className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-fg-primary)]">
                      {insight.text}
                    </p>
                  </div>
                  <div className={cn('shrink-0', insight.trendColor)}>
                    {insight.trend === 'up' ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Benchmark Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <BenchmarkComparison companyId={company?.id || ''} />
      </motion.div>
    </div>
  );
}
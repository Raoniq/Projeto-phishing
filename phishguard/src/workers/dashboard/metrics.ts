// workers/dashboard/metrics.ts — dashboard metrics worker
import { createAdminClient } from '../_lib/supabase-admin';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface DashboardMetrics {
  activeCampaigns: number;
  clickRate: number;
  reportsRate: number;
  averageRisk: number;
  trends: {
    activeCampaigns: number;
    clickRate: number;
    reportsRate: number;
    averageRisk: number;
  };
}

export async function getDashboardMetrics(
  companyId: string,
  env: Env
): Promise<DashboardMetrics | null> {
  const supabase = createAdminClient(env);

  // Get active campaigns count
  const { count: activeCampaigns } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'active');

  // Get campaign stats for click and report rates
  const { data: campaignStats } = await supabase
    .from('campaign_events')
    .select('event_type, campaign_id')
    .eq('company_id', companyId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const totalSent = campaignStats?.filter(e => e.event_type === 'sent').length || 0;
  const totalClicked = campaignStats?.filter(e => e.event_type === 'click').length || 0;
  const totalReported = campaignStats?.filter(e => e.event_type === 'report').length || 0;

  const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
  const reportsRate = totalSent > 0 ? (totalReported / totalSent) * 100 : 0;

  // Calculate average risk based on user behavior
  const { data: userRisks } = await supabase
    .from('user_risk_scores')
    .select('risk_score')
    .eq('company_id', companyId);

  const averageRisk = userRisks && userRisks.length > 0
    ? userRisks.reduce((acc, r) => acc + (r.risk_score || 0), 0) / userRisks.length
    : 0;

  // Trends would compare with previous period - simplified for now
  const trends = {
    activeCampaigns: 0,
    clickRate: 0,
    reportsRate: 0,
    averageRisk: 0,
  };

  return {
    activeCampaigns: activeCampaigns || 0,
    clickRate: Math.round(clickRate * 10) / 10,
    reportsRate: Math.round(reportsRate * 10) / 10,
    averageRisk: Math.round(averageRisk),
    trends,
  };
}

export async function handleGetMetrics(
  request: Request,
  companyId: string,
  env: Env
): Promise<Response> {
  const metrics = await getDashboardMetrics(companyId, env);

  if (!metrics) {
    return new Response(JSON.stringify({ error: 'Erro ao buscar métricas' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ data: metrics }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

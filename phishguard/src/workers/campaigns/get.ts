// workers/campaigns/get.ts — get campaign by id
import { createAdminClient } from '../_lib/supabase-admin';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function handleGet(
  campaignId: string,
  companyId: string,
  env: Env
): Promise<Response> {
  const supabase = createAdminClient(env);

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      template:campaign_templates(id, name, subject, category)
    `)
    .eq('id', campaignId)
    .eq('company_id', companyId)
    .single();

  if (error || !campaign) {
    return new Response(JSON.stringify({ error: 'Campanha não encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get summary stats
  const { count: sentCount } = await supabase
    .from('campaign_targets')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'sent');

  const { count: openedCount } = await supabase
    .from('campaign_targets')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'opened');

  const { count: clickedCount } = await supabase
    .from('campaign_targets')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'clicked');

  const { count: reportedCount } = await supabase
    .from('campaign_targets')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'reported');

  return new Response(JSON.stringify({
    ...campaign,
    stats: {
      sent: sentCount ?? 0,
      opened: openedCount ?? 0,
      clicked: clickedCount ?? 0,
      reported: reportedCount ?? 0,
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

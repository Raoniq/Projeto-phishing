// workers/campaigns/pause.ts — pause campaign (stop pending sends)
import { createAdminClient } from '../_lib/supabase-admin';
import { validateCampaignPause } from './_lib/validation';
import { logAudit } from './_lib/audit';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function handlePause(
  campaignId: string,
  request: Request,
  companyId: string,
  userId: string,
  env: Env
): Promise<Response> {
  const clientIP = request.headers.get('CF-Connecting-IP') ?? undefined;
  const userAgent = request.headers.get('User-Agent') ?? undefined;

  // Validate pause prerequisites
  const validationErrors = await validateCampaignPause(campaignId, companyId, env);
  if (validationErrors.length > 0) {
    return new Response(JSON.stringify({
      error: 'Não é possível pausar campanha',
      details: validationErrors,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createAdminClient(env);

  // Get existing campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return new Response(JSON.stringify({ error: 'Campanha não encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Count how many were already sent
  const { count: sentCount } = await supabase
    .from('campaign_targets')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'sent');

  // Update campaign status to paused
  const { data: updated, error } = await supabase
    .from('campaigns')
    .update({ status: 'paused' })
    .eq('id', campaignId)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: 'Erro ao pausar campanha' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Audit log
  await logAudit({
    companyId,
    userId,
    action: 'pause',
    tableName: 'campaigns',
    recordId: campaignId,
    oldData: campaign as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
    ipAddress: clientIP,
    userAgent,
  }, env);

  return new Response(JSON.stringify({
    success: true,
    message: 'Campanha pausada com sucesso',
    sentCount: sentCount ?? 0,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

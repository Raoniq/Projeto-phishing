// workers/campaigns/launch.ts — launch campaign (schedule sends)
import { createAdminClient } from '../_lib/supabase-admin';
import { validateCampaignLaunch } from './_lib/validation';
import { logAudit } from './_lib/audit';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function handleLaunch(
  campaignId: string,
  request: Request,
  companyId: string,
  userId: string,
  env: Env
): Promise<Response> {
  const clientIP = request.headers.get('CF-Connecting-IP') ?? undefined;
  const userAgent = request.headers.get('User-Agent') ?? undefined;

  // Validate launch prerequisites
  const validationErrors = await validateCampaignLaunch(campaignId, companyId, env);
  if (validationErrors.length > 0) {
    return new Response(JSON.stringify({
      error: 'Não é possível lançar campanha',
      details: validationErrors,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createAdminClient(env);

  // Get campaign with schedule
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

  const now = new Date();
  let scheduledTime = campaign.scheduled_at ? new Date(campaign.scheduled_at) : null;

  // If no schedule or schedule is in past, launch immediately
  if (!scheduledTime || scheduledTime <= now) {
    scheduledTime = now;
  }

  // Get all pending targets
  const { data: targets } = await supabase
    .from('campaign_targets')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending');

  if (!targets || targets.length === 0) {
    return new Response(JSON.stringify({
      error: 'Não há alvos pendentes para enviar',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Calculate staggered send times (spread over configurable window)
  const sendWindowMinutes = 30; // Send all within 30 min window
  const intervalMs = (sendWindowMinutes * 60 * 1000) / Math.max(targets.length, 1);

  // Update targets with scheduled_at times
  const targetUpdates = targets.map((target, index) => ({
    id: target.id,
    status: 'sent',
    sent_at: new Date(scheduledTime.getTime() + (index * intervalMs)).toISOString(),
  }));

  // Batch update targets
  for (const update of targetUpdates) {
    await supabase
      .from('campaign_targets')
      .update({
        status: update.status as 'sent',
        sent_at: update.sent_at,
      })
      .eq('id', update.id);
  }

  // Update campaign status to running
  const { data: updated, error } = await supabase
    .from('campaigns')
    .update({
      status: 'running',
      started_at: now.toISOString(),
      scheduled_at: scheduledTime.toISOString(),
    })
    .eq('id', campaignId)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: 'Erro ao lançar campanha' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Audit log
  await logAudit({
    companyId,
    userId,
    action: 'launch',
    tableName: 'campaigns',
    recordId: campaignId,
    oldData: campaign as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
    ipAddress: clientIP,
    userAgent,
  }, env);

  return new Response(JSON.stringify({
    success: true,
    message: 'Campanha lançada com sucesso',
    scheduledAt: scheduledTime.toISOString(),
    targetsScheduled: targets.length,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

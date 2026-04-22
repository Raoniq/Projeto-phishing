// workers/campaigns/create.ts — create campaign
import { createAdminClient } from '../_lib/supabase-admin';
import { validateCampaignCreate } from './_lib/validation';
import { logAudit } from './_lib/audit';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface CreateCampaignInput {
  name: string;
  description?: string;
  targetAudience: string;
  templateId: string;
  scheduledAt?: string;
  tags?: string[];
  targetEmails?: string[];
}

export async function handleCreate(
  request: Request,
  companyId: string,
  userId: string,
  env: Env
): Promise<Response> {
  let body: CreateCampaignInput;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clientIP = request.headers.get('CF-Connecting-IP') ?? undefined;
  const userAgent = request.headers.get('User-Agent') ?? undefined;

  // Validate input
  const validationErrors = await validateCampaignCreate(body, companyId, env);
  if (validationErrors.length > 0) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: validationErrors,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createAdminClient(env);

  // Create campaign
  const { data: campaign, error: createError } = await supabase
    .from('campaigns')
    .insert({
      company_id: companyId,
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      template_id: body.templateId,
      target_count: 0,
      status: 'draft',
      scheduled_at: body.scheduledAt ? new Date(body.scheduledAt).toISOString() : null,
      settings: {
        target_audience: body.targetAudience,
        tags: body.tags ?? [],
      },
      created_by: userId,
    })
    .select()
    .single();

  if (createError) {
    return new Response(JSON.stringify({ error: 'Erro ao criar campanha' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // If targetEmails provided, create targets directly
  if (body.targetEmails && body.targetEmails.length > 0) {
    const targetInserts = body.targetEmails.map(email => ({
      campaign_id: campaign.id,
      email: email.trim().toLowerCase(),
      user_id: userId, // Will need proper user lookup in production
      status: 'pending',
      tracking_id: crypto.randomUUID(),
    }));

    const { error: targetsError } = await supabase
      .from('campaign_targets')
      .insert(targetInserts);

    if (!targetsError) {
      // Update target count
      await supabase
        .from('campaigns')
        .update({ target_count: body.targetEmails.length })
        .eq('id', campaign.id);
    }
  }

  // Audit log
  await logAudit({
    companyId,
    userId,
    action: 'create',
    tableName: 'campaigns',
    recordId: campaign.id,
    newData: campaign as unknown as Record<string, unknown>,
    ipAddress: clientIP,
    userAgent,
  }, env);

  return new Response(JSON.stringify({ data: campaign }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

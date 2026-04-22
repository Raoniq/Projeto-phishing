// workers/campaigns/update.ts — update campaign
import { createAdminClient } from '../_lib/supabase-admin';
import { logAudit } from './_lib/audit';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface UpdateCampaignInput {
  name?: string;
  description?: string;
  targetAudience?: string;
  templateId?: string;
  scheduledAt?: string | null;
  tags?: string[];
}

export async function handleUpdate(
  campaignId: string,
  request: Request,
  companyId: string,
  userId: string,
  env: Env
): Promise<Response> {
  // Get existing campaign first
  const supabase = createAdminClient(env);

  const { data: existing, error: fetchError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('company_id', companyId)
    .single();

  if (fetchError || !existing) {
    return new Response(JSON.stringify({ error: 'Campanha não encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Can only update draft or paused campaigns
  if (existing.status !== 'draft' && existing.status !== 'paused') {
    return new Response(JSON.stringify({
      error: `Não é possível editar campanha com status '${existing.status}'`,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: UpdateCampaignInput;
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

  // Build update object
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (body.name.trim().length < 3) {
      return new Response(JSON.stringify({
        error: 'Nome deve ter pelo menos 3 caracteres',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    updates.name = body.name.trim();
  }

  if (body.description !== undefined) {
    updates.description = body.description?.trim() ?? null;
  }

  if (body.templateId !== undefined) {
    updates.template_id = body.templateId;
  }

  if (body.scheduledAt !== undefined) {
    if (body.scheduledAt === null) {
      updates.scheduled_at = null;
    } else {
      const scheduledDate = new Date(body.scheduledAt);
      if (scheduledDate <= new Date()) {
        return new Response(JSON.stringify({
          error: 'Data de agendamento deve ser no futuro',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updates.scheduled_at = scheduledDate.toISOString();
    }
  }

  if (body.targetAudience !== undefined) {
    updates.settings = {
      ...(existing.settings as Record<string, unknown> ?? {}),
      target_audience: body.targetAudience,
    };
  }

  if (body.tags !== undefined) {
    updates.settings = {
      ...(existing.settings as Record<string, unknown> ?? {}),
      tags: body.tags,
    };
  }

  // Perform update
  const { data: updated, error: updateError } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', campaignId)
    .select()
    .single();

  if (updateError) {
    return new Response(JSON.stringify({ error: 'Erro ao atualizar campanha' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Audit log
  await logAudit({
    companyId,
    userId,
    action: 'update',
    tableName: 'campaigns',
    recordId: campaignId,
    oldData: existing as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
    ipAddress: clientIP,
    userAgent,
  }, env);

  return new Response(JSON.stringify({ data: updated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
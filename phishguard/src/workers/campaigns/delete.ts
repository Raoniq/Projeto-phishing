// workers/campaigns/delete.ts — soft delete campaign
import { createAdminClient } from '../_lib/supabase-admin';
import { logAudit } from './_lib/audit';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function handleDelete(
  campaignId: string,
  companyId: string,
  userId: string,
  env: Env
): Promise<Response> {
  const supabase = createAdminClient(env);

  // Get existing campaign
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

  // Can only delete draft or completed campaigns
  if (existing.status !== 'draft' && existing.status !== 'completed' && existing.status !== 'cancelled') {
    return new Response(JSON.stringify({
      error: `Não é possível excluir campanha com status '${existing.status}'`,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clientIP = 'unknown'; // Delete doesn't have request
  const userAgent = 'unknown';

  // Soft delete: set status to cancelled
  const { data: updated, error: deleteError } = await supabase
    .from('campaigns')
    .update({ status: 'cancelled' })
    .eq('id', campaignId)
    .select()
    .single();

  if (deleteError) {
    return new Response(JSON.stringify({ error: 'Erro ao excluir campanha' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Audit log
  await logAudit({
    companyId,
    userId,
    action: 'delete',
    tableName: 'campaigns',
    recordId: campaignId,
    oldData: existing as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
    ipAddress: clientIP,
    userAgent,
  }, env);

  return new Response(JSON.stringify({ success: true, message: 'Campanha cancelada' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

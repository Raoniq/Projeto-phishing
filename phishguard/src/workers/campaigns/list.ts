// workers/campaigns/list.ts — list campaigns
import { createAdminClient } from '../_lib/supabase-admin';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function handleList(
  request: Request,
  companyId: string,
  _userId: string,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  const supabase = createAdminClient(env);

  let query = supabase
    .from('campaigns')
    .select(`
      id,
      name,
      description,
      status,
      scheduled_at,
      started_at,
      completed_at,
      target_count,
      template_id,
      created_at
    `, { count: 'exact' })
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: campaigns, error, count } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: 'Erro ao buscar campanhas' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    data: campaigns,
    total: count ?? 0,
    limit,
    offset,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
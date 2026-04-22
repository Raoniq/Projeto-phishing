// workers/dashboard/index.ts — dashboard worker entry point
import { createAdminClient } from '../_lib/supabase-admin';
import { handleGetMetrics } from './metrics';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

async function verifyAuth(request: Request, env: Env): Promise<{ companyId: string; userId: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  if (!token) return null;

  const supabase = createAdminClient(env);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, company_id')
    .eq('auth_id', user.id)
    .single();

  if (!profile) {
    return null;
  }

  return { companyId: profile.company_id, userId: profile.id };
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts.length < 1 || pathParts[0] !== 'dashboard') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const auth = await verifyAuth(request, env);
    if (!auth) {
      return unauthorized();
    }

    const { companyId} = auth;
    const resource = pathParts[1];

    // GET /dashboard/metrics
    if (request.method === 'GET' && (!resource || resource === 'metrics')) {
      return handleGetMetrics(request, companyId, env);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

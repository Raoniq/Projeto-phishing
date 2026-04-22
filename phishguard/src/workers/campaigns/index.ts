// workers/campaigns/index.ts — campaigns worker entry point
import { createAdminClient } from '../_lib/supabase-admin';
import { handleList } from './list';
import { handleGet } from './get';
import { handleCreate } from './create';
import { handleUpdate } from './update';
import { handleDelete } from './delete';
import { handleLaunch } from './launch';
import { handlePause } from './pause';

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

  // Verify JWT with Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return null;
  }

  // Get company_id from users table
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

    // Expected path: /campaigns or /campaigns/:id or /campaigns/:id/launch etc
    if (pathParts.length < 1 || pathParts[0] !== 'campaigns') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify auth for all campaign routes
    const auth = await verifyAuth(request, env);
    if (!auth) {
      return unauthorized();
    }

    const { companyId, userId } = auth;
    const campaignId = pathParts[1];
    const action = pathParts[2];

    // POST /campaigns — create
    if (request.method === 'POST' && pathParts.length === 1) {
      return handleCreate(request, companyId, userId, env);
    }

    // GET /campaigns — list
    if (request.method === 'GET' && pathParts.length === 1) {
      return handleList(request, companyId, userId, env);
    }

    // GET /campaigns/:id
    if (request.method === 'GET' && pathParts.length === 2 && campaignId) {
      return handleGet(campaignId, companyId, env);
    }

    // PUT /campaigns/:id
    if (request.method === 'PUT' && pathParts.length === 2 && campaignId) {
      return handleUpdate(campaignId, request, companyId, userId, env);
    }

    // DELETE /campaigns/:id
    if (request.method === 'DELETE' && pathParts.length === 2 && campaignId) {
      return handleDelete(campaignId, companyId, userId, env);
    }

    // POST /campaigns/:id/launch
    if (request.method === 'POST' && pathParts.length === 3 && campaignId && action === 'launch') {
      return handleLaunch(campaignId, request, companyId, userId, env);
    }

    // POST /campaigns/:id/pause
    if (request.method === 'POST' && pathParts.length === 3 && campaignId && action === 'pause') {
      return handlePause(campaignId, request, companyId, userId, env);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

// workers/tracking/report.ts — report de phishing
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RATE_LIMIT: KVNamespace;
}

const RATE_LIMIT_MAX = 100;

async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `rate:${ip}`;
  const current = await env.RATE_LIMIT.get(key, 'text');

  if (!current) {
    await env.RATE_LIMIT.put(key, '1', { expirationTtl: 60 });
    return true;
  }

  const count = parseInt(current, 10);
  if (count >= RATE_LIMIT_MAX) {
    return false;
  }

  await env.RATE_LIMIT.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return true;
}

async function logPhishingReport(
  campaignTargetId: string,
  ip: string,
  userAgent: string | null,
  reporterEmail: string | null,
  env: Env
): Promise<void> {
  await fetch(`${env.SUPABASE_URL}/rest/v1/campaign_events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      campaign_target_id: campaignTargetId,
      event_type: 'reported',
      ip_address: ip,
      user_agent: userAgent,
      metadata: {
        reporter_email: reporterEmail,
        reported_at: new Date().toISOString(),
      },
      occurred_at: new Date().toISOString(),
    }),
  }).catch(err => console.error('Failed to log report event:', err));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const campaignTargetId = pathParts[pathParts.length - 1];

    if (!campaignTargetId) {
      return new Response(JSON.stringify({ error: 'Missing campaign target ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const allowed = await checkRateLimit(clientIP, env);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse body for reporter email if provided
    let reporterEmail: string | null = null;
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        reporterEmail = body?.reporter_email ?? null;
      } catch {
        // ignore parse errors
      }
    }

    // Log report event asynchronously
    ctx.waitUntil(
      logPhishingReport(campaignTargetId, clientIP, request.headers.get('User-Agent'), reporterEmail, env)
    );

    return new Response(JSON.stringify({ success: true, message: 'Report logged' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache',
      },
    });
  },
};
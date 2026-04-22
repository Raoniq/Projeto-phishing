// workers/tracking/click.ts — redirect rastreado
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RATE_LIMIT: KVNamespace;
  APP_URL: string;
}

const RATE_LIMIT_MAX = 100;

async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `rate:${ip}`;
  const current = await env.RATE_LIMIT.get(key, 'text');
  const count = current ? parseInt(current, 10) : 0;

  if (count >= RATE_LIMIT_MAX) {
    return false;
  }

  await env.RATE_LIMIT.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return true;
}

async function getLandingUrl(campaignTargetId: string, env: Env): Promise<string | null> {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/campaign_targets?id=eq.${campaignTargetId}&select=landing_url`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data[0]?.landing_url ?? null;
}

async function logEvent(
  campaignTargetId: string,
  ip: string,
  userAgent: string | null,
  geoCountry: string | undefined,
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
      event_type: 'clicked',
      ip_address: ip,
      user_agent: userAgent,
      geo_country: geoCountry,
      occurred_at: new Date().toISOString(),
    }),
  }).catch(err => console.error('Failed to log click event:', err));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const campaignTargetId = pathParts[pathParts.length - 1];

    if (!campaignTargetId) {
      return Response.redirect(env.APP_URL ?? 'https://phishguard.com.br', 302);
    }

    // Rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const allowed = await checkRateLimit(clientIP, env);
    if (!allowed) {
      return new Response(null, { status: 429 });
    }

    // Log event asynchronously - does NOT block redirect
    const logPromise = logEvent(
      campaignTargetId,
      clientIP,
      request.headers.get('User-Agent'),
      request.cf?.country,
      env
    );
    ctx.waitUntil(logPromise);

    // Fetch landing URL (only thing that affects redirect time)
    const landingUrl = await getLandingUrl(campaignTargetId, env);
    const redirectUrl = landingUrl ?? `${env.APP_URL}/pescado/${campaignTargetId}`;

    return Response.redirect(redirectUrl, 302);
  },
};
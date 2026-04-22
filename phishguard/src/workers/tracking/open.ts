// workers/tracking/open.ts — 1x1 pixel tracking
const PIXEL_B64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RATE_LIMIT: KVNamespace;
}

const RATE_LIMIT_MAX = 100; // requests per minute

async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `rate:${ip}`;
  const current = await env.RATE_LIMIT.get(key, 'text');
  const count = current ? parseInt(current, 10) : 0;

  if (count >= RATE_LIMIT_MAX) {
    return false;
  }

  // Atomic increment - use put with expiration to handle race condition
  // If another request writes first, our write will be ignored (last-write-wins)
  // This is acceptable for rate limiting (may allow slightly more requests under race)
  await env.RATE_LIMIT.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return true;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const campaignTargetId = pathParts[pathParts.length - 1];

    if (!campaignTargetId) {
      return new Response(null, { status: 400 });
    }

    // Rate limiting via KV
    const clientIP = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const allowed = await checkRateLimit(clientIP, env);
    if (!allowed) {
      return new Response(null, { status: 429 });
    }

    // Registrar evento SEM bloquear a resposta
    ctx.waitUntil(
      fetch(`${env.SUPABASE_URL}/rest/v1/campaign_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          campaign_target_id: campaignTargetId,
          event_type: 'opened',
          ip_address: clientIP,
          user_agent: request.headers.get('User-Agent'),
          geo_country: request.cf?.country,
          occurred_at: new Date().toISOString(),
        }),
      }).catch(err => console.error('Failed to log open event:', err))
    );

    const pixelBytes = Uint8Array.from(atob(PIXEL_B64), (c) => c.charCodeAt(0));
    return new Response(pixelBytes, {
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': '42',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  },
};
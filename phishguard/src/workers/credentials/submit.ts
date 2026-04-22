// workers/credentials/submit.ts
// Credential submission endpoint - receives hash only, NEVER plaintext password
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RATE_LIMIT: KVNamespace;
}

interface CredentialSubmission {
  campaign_target_id: string;
  attempt_hash: string;
  password_length: number;
  email: string;
  email_matches_corporate: boolean;
}

async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `cred-rate:${ip}`;
  const current = await env.RATE_LIMIT.get(key, 'text');

  if (!current) {
    await env.RATE_LIMIT.put(key, '1', { expirationTtl: 60 });
    return true;
  }

  const count = parseInt(current, 10);
  if (count >= 20) {
    // Stricter rate limit for credentials
    return false;
  }

  await env.RATE_LIMIT.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return true;
}

async function logCredentialAttempt(
  data: CredentialSubmission,
  ip: string,
  userAgent: string | null,
  env: Env
): Promise<void> {
  // CRITICAL: Log WITHOUT exposing the actual password
  // We log the hash and length for verification purposes
  const payload = {
    campaign_target_id: data.campaign_target_id,
    attempt_hash: data.attempt_hash,
    password_length: data.password_length,
    email_hash: await hashEmail(data.email), // Hash email for privacy
    email_matches_corporate: data.email_matches_corporate,
    event_type: 'credentials_submitted',
    ip_address: ip, // IP is logged for security audit (LGPD compliant)
    user_agent: userAgent,
    occurred_at: new Date().toISOString(),
    // NOTE: password is NEVER logged
  };

  await fetch(`${env.SUPABASE_URL}/rest/v1/campaign_events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(payload),
  }).catch((err) => console.error('Failed to log credential event:', err));
}

// Simple email hash for privacy (different from credential hash)
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Only accept POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clientIP = request.headers.get('CF-Connecting-IP') ?? 'unknown';

    // Rate limiting
    const allowed = await checkRateLimit(clientIP, env);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body: CredentialSubmission;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!body.campaign_target_id || !body.attempt_hash || body.password_length === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: campaign_target_id, attempt_hash, password_length' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate hash format (SHA-256 = 64 hex chars)
    if (!/^[a-f0-9]{64}$/i.test(body.attempt_hash)) {
      return new Response(
        JSON.stringify({ error: 'Invalid hash format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (body.password_length < 1 || body.password_length > 128) {
      return new Response(
        JSON.stringify({ error: 'Invalid password length' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log event WITHOUT password data
    await ctx.waitUntil(
      logCredentialAttempt(
        body,
        clientIP,
        request.headers.get('User-Agent'),
        env
      )
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credential attempt logged securely',
        // WARNING: We explicitly confirm password was NOT stored
        password_stored: false,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};

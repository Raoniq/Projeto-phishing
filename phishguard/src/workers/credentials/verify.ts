// workers/credentials/verify.ts
// Verification endpoint - allows verifying if a password matches a stored hash
// Used for audit purposes when investigating security incidents
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface VerifyRequest {
  campaign_target_id: string;
  email: string;
  password_to_verify: string;
}

async function hashCredentials(email: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${email}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getStoredCredential(
  campaignTargetId: string,
  env: Env
): Promise<{ attempt_hash: string; password_length: number } | null> {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/campaign_events?campaign_target_id=eq.${campaignTargetId}&event_type=eq.credentials_submitted&order=occurred_at.desc&limit=1`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!res.ok) return null;
  const events = await res.json();
  return events[0] ?? null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only accept POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: VerifyRequest;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!body.campaign_target_id || !body.email || !body.password_to_verify) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get stored credential for this campaign target
    const stored = await getStoredCredential(body.campaign_target_id, env);

    if (!stored) {
      return new Response(
        JSON.stringify({
          verified: false,
          reason: 'no_credentials_found',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Compute hash of the password to verify
    const computedHash = await hashCredentials(body.email, body.password_to_verify);

    // Compare with stored hash
    const matches = computedHash === stored.attempt_hash;

    return new Response(
      JSON.stringify({
        verified: matches,
        password_length: stored.password_length,
        // WARNING: We only confirm if it matches, never reveal the actual password
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};

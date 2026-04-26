// workers/certificates/verify.ts — handle certificate verification
import { verifyCertificate } from '../../lib/certificates/generateCertificate';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  APP_URL: string;
}

/**
 * Handle GET /api/certificates/verify/:certificateNumber
 *
 * Verifies a certificate by its certificate number.
 */
export async function handleVerify(
  _request: Request,
  env: Env,
  _ctx: ExecutionContext,
  certificateNumber: string
): Promise<Response> {
  if (!certificateNumber) {
    return new Response(JSON.stringify({ error: 'Certificate number required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await verifyCertificate(certificateNumber, {
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!result.valid) {
    return new Response(JSON.stringify({
      valid: false,
      error: 'Certificate not found or expired',
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    valid: true,
    certificate: result.certificate,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

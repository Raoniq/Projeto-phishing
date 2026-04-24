// workers/certificates/generate.ts — handle certificate generation
import { createAdminClient } from '../_lib/supabase-admin';
import { generateCertificate, type CertificateData } from '@/lib/certificates/generateCertificate';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  APP_URL: string;
}

interface GenerateCertificateInput {
  user_id: string;
  track_id: string;
}

/**
 * Handle POST /api/certificates/generate
 *
 * Generates a completion certificate for a training track.
 */
export async function handleGenerate(
  request: Request,
  env: Env,
  _ctx: ExecutionContext
): Promise<Response> {
  // Only accept POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse body
  let body: GenerateCertificateInput;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate required fields
  if (!body.user_id || !body.track_id) {
    return new Response(JSON.stringify({
      error: 'Missing required fields',
      details: ['user_id is required', 'track_id is required'],
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createAdminClient(env);

  // Fetch user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, email, company_id')
    .eq('id', body.user_id)
    .single();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch track data
  const { data: track, error: trackError } = await supabase
    .from('learning_tracks')
    .select('id, name, category, company_id')
    .eq('id', body.track_id)
    .single();

  if (trackError || !track) {
    return new Response(JSON.stringify({ error: 'Track not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch company data
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name, settings')
    .eq('id', user.company_id)
    .single();

  if (companyError || !company) {
    return new Response(JSON.stringify({ error: 'Company not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get company logo from settings if available
  const companySettings = (company.settings as Record<string, unknown>) ?? {};
  const companyLogoUrl = companySettings.certificate_logo_url as string | undefined;

  // Determine certificate validity period (1 year default)
  const completedAt = new Date();
  const expiresAt = new Date(completedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Build certificate data
  const certificateData: CertificateData = {
    userId: user.id,
    trackId: track.id,
    recipientName: user.name ?? 'Aluno',
    recipientEmail: user.email,
    trackName: track.name,
    trackCategory: track.category,
    companyName: company.name,
    companyLogoUrl,
    completedAt,
    expiresAt,
    verificationUrl: env.APP_URL ?? 'https://phishguard.example.com',
  };

  // Generate certificate
  const result = await generateCertificate(certificateData, {
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!result.success) {
    return new Response(JSON.stringify({
      error: 'Certificate generation failed',
      details: result.error,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    data: {
      certificateId: result.certificateId,
      certificateNumber: result.certificateNumber,
      pdfUrl: result.pdfUrl,
      completedAt: completedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

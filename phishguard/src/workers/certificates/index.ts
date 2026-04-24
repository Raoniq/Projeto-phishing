// workers/certificates/index.ts — certificates worker
import generateWorker from './generate';
import verifyWorker from './verify';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  APP_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // POST /api/certificates/generate — generate certificate
    if (pathname === '/api/certificates/generate' && request.method === 'POST') {
      return generateWorker.handleGenerate(request, env, ctx);
    }

    // GET /api/certificates/verify/:certificateNumber — verify certificate
    if (pathname.startsWith('/api/certificates/verify/') && request.method === 'GET') {
      const certificateNumber = pathname.split('/').pop();
      if (!certificateNumber) {
        return new Response(JSON.stringify({ error: 'Certificate number required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return verifyWorker.handleVerify(request, env, ctx, certificateNumber);
    }

    // OPTIONS for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

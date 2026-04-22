// workers/router.ts — Cloudflare Workers router
import openWorker from './tracking/open';
import clickWorker from './tracking/click';
import reportWorker from './tracking/report';
import emailWorker from './email/worker';
import dashboardWorker from './dashboard';
import credentialsWorker from './credentials';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RATE_LIMIT: KVNamespace;
  APP_URL: string;
  EMAIL_QUEUE?: KVNamespace;
  EMAIL_MAX_PER_MINUTE?: number;
  EMAIL_MAX_PER_HOUR?: number;
  EMAIL_MAX_PER_DAY?: number;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

// Route to appropriate worker handler
    if (pathname.startsWith('/tracking/open/')) {
      return openWorker.fetch(request, env, ctx);
    }

    if (pathname.startsWith('/tracking/click/')) {
      return clickWorker.fetch(request, env, ctx);
    }

    if (pathname.startsWith('/tracking/report/')) {
      return reportWorker.fetch(request, env, ctx);
    }

    // Credential hashing routes (hash only, NEVER plaintext)
    if (pathname.startsWith('/tracking/credentials') || pathname.startsWith('/verify')) {
      return credentialsWorker.fetch(request, env, ctx);
    }

    // Email sending routes
    if (pathname.startsWith('/email/')) {
      return emailWorker.fetch(request, env, ctx);
    }

    // Dashboard routes
    if (pathname.startsWith('/dashboard/')) {
      return dashboardWorker.default.fetch(request, env, ctx);
    }

    // 404 for unmatched routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
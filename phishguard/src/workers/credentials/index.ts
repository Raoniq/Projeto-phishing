// workers/credentials/index.ts
// Credential workers barrel export
import submitWorker from './submit';
import verifyWorker from './verify';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === '/tracking/credentials' || pathname.startsWith('/tracking/credentials/')) {
      return submitWorker.fetch(request, env, ctx);
    }

    if (pathname === '/verify' || pathname.startsWith('/verify/')) {
      return verifyWorker.fetch(request, env, ctx);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

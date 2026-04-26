/**
 * PhishGuard API Router
 * Cloudflare Workers entry point
 */

interface Env {
  RATE_LIMIT: KVNamespace;
  ENVIRONMENT: string;
  API_VERSION: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT || "development",
          version: env.API_VERSION || "1.0.0"
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // API routes
    if (url.pathname.startsWith("/api/")) {
      // TODO: Route to appropriate handler
      return new Response(
        JSON.stringify({ error: "Not implemented" }),
        { status: 501, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default 404
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
} satisfies ExportedHandler<Env>;
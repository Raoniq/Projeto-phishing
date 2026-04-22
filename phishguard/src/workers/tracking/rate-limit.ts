// workers/tracking/rate-limit.ts — rate limiting via KV
const RATE_LIMIT_MAX = 100; // requests per minute
const RATE_LIMIT_WINDOW = 60; // seconds

export async function checkRateLimit(
  ip: string,
  env: { RATE_LIMIT: KVNamespace }
): Promise<boolean> {
  const key = `rate:${ip}`;
  const current = await env.RATE_LIMIT.get(key, 'text');
  const count = current ? parseInt(current, 10) : 0;

  if (count >= RATE_LIMIT_MAX) {
    return false;
  }

  // Atomic increment - use put with expiration to handle race condition
  // If another request writes first, our write will be ignored (last-write-wins)
  // This is acceptable for rate limiting (may allow slightly more requests under race)
  await env.RATE_LIMIT.put(key, (count + 1).toString(), { expirationTtl: RATE_LIMIT_WINDOW });
  return true;
}
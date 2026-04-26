import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RATE_LIMIT = 100
const RATE_WINDOW_MS = 60 * 1000

// In-memory rate limiting store (per-edge-instance)
// For production, use Redis or Supabase DB for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// 1x1 transparent GIF (base64)
const PIXEL_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const PIXEL_BYTES = Uint8Array.from(atob(PIXEL_BASE64), c => c.charCodeAt(0))

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

function getRateLimitKey(clientIp: string): string {
  return `ratelimit:${clientIp}`
}

function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number; limit: number } {
  const key = getRateLimitKey(clientIp)
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT - 1, limit: RATE_LIMIT }
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, limit: RATE_LIMIT }
  }

  entry.count++
  rateLimitStore.set(key, entry)

  return { allowed: true, remaining: RATE_LIMIT - entry.count, limit: RATE_LIMIT }
}

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         req.headers.get('cf-connecting-ip') ||
         'unknown'
}

Deno.serve(async (req: Request): Promise<Response> => {
  const clientIp = getClientIP(req)

  // Rate limiting
  const rateLimit = checkRateLimit(clientIp)

  if (!rateLimit.allowed) {
    return new Response(PIXEL_BYTES, {
      status: 429,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': String(PIXEL_BYTES.length),
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': '0',
        'Retry-After': '60',
      },
    })
  }

  // Parse URL to get tracking_id from path
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)

  // Expected path: /tracking-open/{tracking_id}
  const trackingId = pathParts[pathParts.length - 1]

  // Validate tracking_id format (UUID)
  if (!trackingId || !isValidUUID(trackingId)) {
    // Return default pixel for invalid tracking_id (don't log)
    return new Response(PIXEL_BYTES, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': String(PIXEL_BYTES.length),
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Look up campaign_target by tracking_id
    const { data: target, error: targetError } = await supabase
      .from('campaign_targets')
      .select('id, campaign_id')
      .eq('tracking_id', trackingId)
      .single()

    if (targetError || !target) {
      // Invalid tracking_id - return pixel without logging
      return new Response(PIXEL_BYTES, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Content-Length': String(PIXEL_BYTES.length),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    // Log 'opened' event
    const { error: insertError } = await supabase
      .from('campaign_events')
      .insert({
        campaign_target_id: target.id,
        event_type: 'opened',
        ip_address: clientIp !== 'unknown' ? clientIp : null,
        user_agent: req.headers.get('user-agent') || null,
        metadata: {
          timestamp: new Date().toISOString(),
          campaign_id: target.campaign_id,
        },
      })

    if (insertError) {
      console.error('Failed to log open event:', insertError)
      // Still return pixel - don't fail the tracking request
    }

  } catch (err) {
    console.error('Tracking function error:', err)
    // Return pixel on error - tracking should not break email display
  }

  // Return 1x1 transparent GIF
  return new Response(PIXEL_BYTES, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL_BYTES.length),
      'X-RateLimit-Limit': String(rateLimit.limit),
      'X-RateLimit-Remaining': String(rateLimit.remaining),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
})
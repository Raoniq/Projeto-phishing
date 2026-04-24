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

function isValidHash(str: string): boolean {
  // SHA-256 hash is 64 hex characters
  const hashRegex = /^[0-9a-f]{64}$/i
  return hashRegex.test(str)
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

  // Parse URL to get parameters from path
  // Expected path: /track-attachment/{campaign_target_id}/{attachment_hash}
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)

  // Get campaign_target_id and attachment_hash from path
  const campaignTargetId = pathParts[pathParts.length - 2]
  const attachmentHash = pathParts[pathParts.length - 1]

  // Validate parameters
  if (!campaignTargetId || !isValidUUID(campaignTargetId) ||
      !attachmentHash || !isValidHash(attachmentHash)) {
    // Return default pixel for invalid parameters (don't log)
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

    // Extract attachment_name from query params if provided
    const attachmentName = url.searchParams.get('name') || 'unknown'

    // Check if tracking record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('attachment_tracking')
      .select('id, opened_count')
      .eq('campaign_target_id', campaignTargetId)
      .eq('attachment_hash', attachmentHash)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Ignore "no rows found" error, log other errors
      console.error('Failed to fetch attachment tracking:', fetchError)
    }

    const now = new Date().toISOString()

    if (existingRecord) {
      // Update existing record - increment opened_count
      const { error: updateError } = await supabase
        .from('attachment_tracking')
        .update({
          opened_at: now,
          opened_count: existingRecord.opened_count + 1,
          updated_at: now,
        })
        .eq('id', existingRecord.id)

      if (updateError) {
        console.error('Failed to update attachment tracking:', updateError)
      }
    } else {
      // Insert new tracking record
      const { error: insertError } = await supabase
        .from('attachment_tracking')
        .insert({
          campaign_target_id: campaignTargetId,
          attachment_name: attachmentName,
          attachment_hash: attachmentHash,
          opened_at: now,
          opened_count: 1,
        })

      if (insertError) {
        console.error('Failed to insert attachment tracking:', insertError)
      }
    }

    // Log campaign event for analytics
    const { error: eventError } = await supabase
      .from('campaign_events')
      .insert({
        campaign_target_id: campaignTargetId,
        event_type: 'attachment_opened',
        ip_address: clientIp !== 'unknown' ? clientIp : null,
        user_agent: req.headers.get('user-agent') || null,
        metadata: {
          timestamp: now,
          attachment_hash: attachmentHash,
          attachment_name: attachmentName,
        },
      })

    if (eventError) {
      console.error('Failed to log attachment open event:', eventError)
    }

  } catch (err) {
    console.error('Track attachment function error:', err)
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
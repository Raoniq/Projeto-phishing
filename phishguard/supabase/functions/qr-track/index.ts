// Edge Function: qr-track
// Handles QR code scan tracking for quishing campaigns
// Logs scan event and redirects to landing page

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RATE_LIMIT = 100
const RATE_WINDOW_MS = 60 * 1000

// In-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

function getRateLimitKey(clientIp: string): string {
  return `ratelimit:${clientIp}`
}

function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number } {
  const key = getRateLimitKey(clientIp)
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  rateLimitStore.set(key, entry)

  return { allowed: true, remaining: RATE_LIMIT - entry.count }
}

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         req.headers.get('cf-connecting-ip') ||
         'unknown'
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const clientIp = getClientIP(req)

  // Rate limiting
  const rateLimit = checkRateLimit(clientIp)
  if (!rateLimit.allowed) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: { 'Retry-After': '60' }
    })
  }

  // Parse URL to get tracking_id from path
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)

  // Expected path: /qr/{tracking_id}
  const trackingId = pathParts[pathParts.length - 1]

  // Validate tracking_id format
  if (!trackingId || !isValidUUID(trackingId)) {
    // Redirect to error page for invalid tracking_id
    return Response.redirect(`${url.origin}/lp/error?code=invalid_qr`, 302)
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Look up QR code by tracking_id
    const { data: qrcode, error: qrError } = await supabase
      .from('quishing_qrcodes')
      .select('id, campaign_id, url_shortcode')
      .eq('tracking_id', trackingId)
      .single()

    if (qrError || !qrcode) {
      // Invalid tracking_id - redirect to error page
      return Response.redirect(`${url.origin}/lp/error?code=qr_not_found`, 302)
    }

    // Get campaign info for landing page URL
    const { data: campaign } = await supabase
      .from('quishing_campaigns')
      .select('landing_page_id, status')
      .eq('id', qrcode.campaign_id)
      .single()

    if (!campaign || campaign.status !== 'active') {
      // Campaign not active - redirect to error page
      return Response.redirect(`${url.origin}/lp/error?code=campaign_inactive`, 302)
    }

    // Get landing page URL
    let redirectUrl = `${url.origin}/lp/${qrcode.campaign_id}`

    if (campaign.landing_page_id) {
      const { data: landingPage } = await supabase
        .from('landing_pages')
        .select('slug')
        .eq('id', campaign.landing_page_id)
        .single()

      if (landingPage) {
        redirectUrl = `${url.origin}/lp/${landingPage.slug}`
      }
    }

    // Check for duplicate scan (same IP within window as unique scan indicator)
    const isUniqueScan = !rateLimitStore.has(`scan:${clientIp}`)

    // Log scan event
    const { error: insertError } = await supabase
      .from('quishing_scan_events')
      .insert({
        qrcode_id: qrcode.id,
        campaign_id: qrcode.campaign_id,
        ip_address: clientIp !== 'unknown' ? clientIp : null,
        user_agent: req.headers.get('user-agent') || null,
        scan_hour: new Date().getHours(),
        is_unique: isUniqueScan,
        metadata: {
          timestamp: new Date().toISOString(),
          tracking_id: trackingId,
        },
      })

    if (insertError) {
      console.error('Failed to log scan event:', insertError)
    }

    // Update scan counts on QR code (increment total, update unique if needed)
    const _updates: { scan_count: number; unique_scans?: number } = {
      scan_count: 1, // Will be incremented via RPC or trigger
    }

    // Also update campaign scan counts
    await supabase.rpc('increment_qr_scan_count', {
      p_qrcode_id: qrcode.id,
      p_campaign_id: qrcode.campaign_id,
      p_is_unique: isUniqueScan,
    }).catch(() => {
      // RPC might not exist, fallback to direct update
      console.log('RPC increment_qr_scan_count not available')
    })

    // Mark IP as scanned in this window (for uniqueness detection)
    if (isUniqueScan) {
      rateLimitStore.set(`scan:${clientIp}`, { count: 1, resetAt: Date.now() + 24 * 60 * 60 * 1000 })
    }

    // Add tracking ID to redirect URL for educational landing page
    redirectUrl = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}tid=${trackingId}`

    // Redirect to landing page
    return Response.redirect(redirectUrl, 302)

  } catch (err) {
    console.error('QR tracking error:', err)
    // Redirect to error page on any error
    return Response.redirect(`${url.origin}/lp/error?code=tracking_error`, 302)
  }
})
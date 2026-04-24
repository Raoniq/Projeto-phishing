// Edge Function: submit-credentials
// Receives harvested credentials, hashes them, stores in harvested_credentials table
// Redirects to educational landing page after successful submission

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EDU_LANDING_BASE = "/lp/educational";
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20;
const CREDENTIAL_EXPIRY_DAYS = 30;

// In-memory rate limit store (resets on cold start - acceptable for edge functions)
// For production with multiple instances, use Supabase database rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Hash a string using SHA-256 and return hex digest
 */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Check rate limit for an IP address
 * Returns true if request is allowed, false if rate limited
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    // New window or expired record
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Validate UUID format
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Extract client info
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }

    // Parse request body
    let body: { tracking_id?: string; email?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { tracking_id, email, password } = body;

    // Validate required fields
    if (!tracking_id || !email || password === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: tracking_id, email, password" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate tracking_id format
    if (!isValidUUID(tracking_id)) {
      return new Response(JSON.stringify({ error: "Invalid tracking_id format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the campaign target by tracking_id
    // We need to verify the tracking_id exists and get campaign_id, target_id
    const { data: target, error: targetError } = await supabase
      .from("campaign_targets")
      .select("id, campaign_id, status")
      .eq("tracking_id", tracking_id)
      .single();

    if (targetError || !target) {
      // Don't reveal whether tracking_id exists for security
      return Response.redirect(
        `${EDU_LANDING_BASE}/${tracking_id}?error=invalid`,
        302
      );
    }

    // Check if target is still valid (not already compromised)
    // Status should be 'clicked' (they clicked through to credential form) or 'sent'
    const validStatuses = ["sent", "clicked", "opened"];
    if (!validStatuses.includes(target.status)) {
      // Don't process for already reported or failed targets
      return Response.redirect(
        `${EDU_LANDING_BASE}/${tracking_id}?error=expired`,
        302
      );
    }

    // Hash the credentials
    const attemptHash = await sha256Hex(`${email}:${password}`);
    const emailHash = await sha256Hex(email);
    const passwordLength = password.length;

    // Calculate expiry date (30 days from now)
    const expiresAt = new Date(
      Date.now() + CREDENTIAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    // Store the harvested credential
    const { error: insertError } = await supabase
      .from("harvested_credentials")
      .insert({
        campaign_id: target.campaign_id,
        target_id: target.id,
        attempt_hash: attemptHash,
        password_length: passwordLength,
        email_hash: emailHash,
        ip_address: clientIp !== "unknown" ? clientIp : null,
        user_agent: userAgent,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Failed to store harvested credentials:", insertError);
      // Still redirect to educational page - don't leak database errors
      return Response.redirect(
        `${EDU_LANDING_BASE}/${tracking_id}?error=storage`,
        302
      );
    }

    // Optionally update the campaign target status to indicate credentials were harvested
    // This helps track which targets have been compromised
    await supabase
      .from("campaign_targets")
      .update({ status: "clicked" }) // Could add a new status like "compromised"
      .eq("id", target.id)
      .eq("status", target.status) // Only update if still in expected state
      .is("clicked_at", null); // Only if not already clicked

    // Redirect to educational landing page
    return Response.redirect(`${EDU_LANDING_BASE}/${tracking_id}`, 302);
  } catch (error) {
    console.error("submit-credentials error:", error);
    // Don't leak error details to attacker
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
// Supabase Edge Function: simulate-mfa-push
// Simulates MFA push notification fatigue testing (mock implementation)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface MFASimulationRequest {
  campaign_id: string;
  target_user_id: string;
  target_email: string;
  simulation_type: "approve" | "reject" | "ignore" | "timeout";
}

interface MFASimulationResult {
  id: string;
  campaign_id: string;
  target_user_id: string;
  target_email: string;
  status: "sent" | "approved" | "rejected" | "ignored" | "timeout";
  sent_at: string;
  responded_at: string | null;
  response_time_ms: number | null;
  method: string;
  device_info: string | null;
}

interface SimulationSummary {
  total_sent: number;
  total_approved: number;
  total_rejected: number;
  total_ignored: number;
  total_timeout: number;
  avg_response_time_ms: number | null;
  duration_ms: number;
}

// Simulate random response time based on real-world MFA behavior
function simulateResponseTime(): number {
  // Most users approve within 30 seconds, but distribution varies
  const base = Math.random();
  if (base < 0.7) {
    // 70% approve quickly: 5-30 seconds
    return Math.floor(Math.random() * 25000) + 5000;
  } else if (base < 0.85) {
    // 15% take 30-60 seconds
    return Math.floor(Math.random() * 30000) + 30000;
  } else if (base < 0.95) {
    // 10% take 1-3 minutes (hesitating)
    return Math.floor(Math.random() * 120000) + 60000;
  } else {
    // 5% take very long or timeout
    return Math.floor(Math.random() * 90000) + 180000;
  }
}

// Mock MFA push notification sending
async function sendMockMFAPush(
  targetEmail: string,
  simulationType: string
): Promise<{ success: boolean; method: string; device_info: string }> {
  // Log what would be sent
  console.log(`[SIMULATE-MFA] Sending push to: ${targetEmail}`);
  console.log(`[SIMULATE-MFA] Type: ${simulationType}`);

  // Simulate network delay for push notification
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  // Mock response details
  const methods = ["push", "sms", "email", "totp"];
  const devices = [
    "iPhone 15 Pro",
    "Samsung Galaxy S24",
    "MacBook Pro",
    "Windows Desktop",
    "iPad Pro",
  ];

  return {
    success: true,
    method: methods[Math.floor(Math.random() * methods.length)],
    device_info: devices[Math.floor(Math.random() * devices.length)],
  };
}

// Simulate user response to MFA push
function simulateUserResponse(
  simulationType: string
): { status: MFASimulationResult["status"]; responseTime: number | null } {
  switch (simulationType) {
    case "approve": {
      const responseTime = simulateResponseTime();
      return { status: "approved", responseTime };
    }
    case "reject": {
      const responseTime = simulateResponseTime();
      return { status: "rejected", responseTime };
    }
    case "ignore": {
      // Ignore means no response within timeout period
      return { status: "ignored", responseTime: null };
    }
    case "timeout":
    default: {
      // Timeout after ~5 minutes
      return { status: "timeout", responseTime: null };
    }
  }
}

serve(async (req: Request) => {
  const startTime = Date.now();
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: MFASimulationRequest = await req.json();

    // Validate required fields
    if (!body.campaign_id || !body.target_user_id || !body.target_email) {
      return new Response(
        JSON.stringify({ error: "campaign_id, target_user_id, and target_email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const simulationType = body.simulation_type || "approve";

    console.log(`[SIMULATE-MFA] Processing request for user: ${body.target_email}`);
    console.log(`[SIMULATE-MFA] Campaign: ${body.campaign_id}, Type: ${simulationType}`);

    // Send mock MFA push notification
    const pushResult = await sendMockMFAPush(body.target_email, simulationType);

    if (!pushResult.success) {
      return new Response(
        JSON.stringify({ error: "Failed to send MFA push notification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simulate user response
    const sentAt = new Date().toISOString();
    const { status, responseTime } = simulateUserResponse(simulationType);

    // Calculate response time if responded
    let respondedAt: string | null = null;
    let responseTimeMs: number | null = null;

    if (responseTime !== null) {
      respondedAt = new Date(new Date(sentAt).getTime() + responseTime).toISOString();
      responseTimeMs = responseTime;
    }

    const result: MFASimulationResult = {
      id: crypto.randomUUID(),
      campaign_id: body.campaign_id,
      target_user_id: body.target_user_id,
      target_email: body.target_email,
      status,
      sent_at: sentAt,
      responded_at: respondedAt,
      response_time_ms: responseTimeMs,
      method: pushResult.method,
      device_info: pushResult.device_info,
    };

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    console.log(`[SIMULATE-MFA] Result: ${status}, Response time: ${responseTimeMs}ms`);

    return new Response(JSON.stringify({
      result,
      summary: {
        duration_ms: durationMs,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[SIMULATE-MFA] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
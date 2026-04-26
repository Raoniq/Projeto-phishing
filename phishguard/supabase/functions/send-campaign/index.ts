// Supabase Edge Function: send-campaign
// Sends phishing campaign emails with staggered delivery (mock implementation)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Rate limiting configuration
const EMAILS_PER_MINUTE = 100;
const DELAY_BETWEEN_EMAILS_MS = 60000 / EMAILS_PER_MINUTE; // 600ms per email

interface CampaignTarget {
  id: string;
  campaign_id: string;
  user_id: string;
  email: string;
  tracking_id: string;
  landed_url: string | null;
  status: string;
  sent_at: string | null;
}

interface Campaign {
  id: string;
  company_id: string;
  name: string;
  template_id: string | null;
  settings: Record<string, unknown>;
}

interface _EmailQueueItem {
  target_id: string;
  campaign_id: string;
  recipient_email: string;
  subject: string;
  body_html: string;
  body_text: string;
  tracking_id: string;
  scheduled_at: string;
  status: string;
}

interface SendResult {
  success: boolean;
  target_id: string;
  email: string;
  error?: string;
}

interface SendSummary {
  sent_count: number;
  failed_count: number;
  duration_ms: number;
  start_time: string;
  end_time: string;
}

// Mock email generation (replace with Zeptomail API in production)
function generatePersonalizedEmail(
  target: CampaignTarget,
  campaign: Campaign,
  companyName: string
): { subject: string; body_html: string; body_text: string } {
  // Template variables for personalization
  const _variables: Record<string, string> = {
    "{{.Email}}": target.email,
    "{{.TrackingID}}": target.tracking_id,
    "{{.CampaignName}}": campaign.name,
    "{{.CompanyName}}": companyName,
    "{{.LandedURL}}": target.landed_url || "https://example.com/landing",
  };

  // Default mock email content (will be replaced by actual template later)
  const subject = `Test Campaign: ${campaign.name}`;
  const body_html = `
    <html>
      <body>
        <h1>Hello,</h1>
        <p>This is a test phishing campaign email for testing purposes.</p>
        <p>Campaign: ${campaign.name}</p>
        <p>Tracking ID: ${target.tracking_id}</p>
        <p><a href="${target.landed_url || "https://example.com/landing"}">Click here</a></p>
      </body>
    </html>
  `;
  const body_text = `Test Campaign Email\n\nCampaign: ${campaign.name}\nTracking ID: ${target.tracking_id}`;

  return { subject, body_html, body_text };
}

// Mock email sending (replace with Zeptomail API in production)
async function sendEmail(
  target: CampaignTarget,
  campaign: Campaign,
  companyName: string
): Promise<SendResult> {
  const { subject, body_html: _body_html, body_text: _body_text } = generatePersonalizedEmail(target, campaign, companyName);

  // Mock: Log the email that would be sent
  console.log(`[SEND-EMAIL] To: ${target.email}`);
  console.log(`[SEND-EMAIL] Subject: ${subject}`);
  console.log(`[SEND-EMAIL] Tracking ID: ${target.tracking_id}`);
  console.log(`[SEND-EMAIL] Campaign: ${campaign.name}`);

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    success: true,
    target_id: target.id,
    email: target.email,
  };
}

// Staggered delay utility
async function staggeredDelay(index: number): Promise<void> {
  if (index > 0) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS));
  }
}

serve(async (req: Request) => {
  const startTime = new Date().toISOString();
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: "campaign_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SEND-CAMPAIGN] Starting campaign: ${campaign_id}`);

    // Get Supabase client from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Fetch campaign details
    const campaignResponse = await fetch(
      `${supabaseUrl}/rest/v1/campaigns?id=eq.${campaign_id}&select=*`,
      {
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "apikey": supabaseServiceKey,
          "Content-Type": "application/json",
        },
      }
    );

    const campaigns: Campaign[] = await campaignResponse.json();

    if (campaigns.length === 0) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const campaign = campaigns[0];

    // Fetch company name for personalization
    const companyResponse = await fetch(
      `${supabaseUrl}/rest/v1/companies?id=eq.${campaign.company_id}&select=name`,
      {
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "apikey": supabaseServiceKey,
          "Content-Type": "application/json",
        },
      }
    );

    const companies = await companyResponse.json();
    const companyName = companies.length > 0 ? companies[0].name : "Unknown Company";

    // Fetch pending targets for this campaign (limit to prevent timeout)
    const targetsResponse = await fetch(
      `${supabaseUrl}/rest/v1/campaign_targets?campaign_id=eq.${campaign_id}&status=eq.pending&select=*&limit=1000`,
      {
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "apikey": supabaseServiceKey,
          "Content-Type": "application/json",
        },
      }
    );

    const targets: CampaignTarget[] = await targetsResponse.json();

    if (targets.length === 0) {
      console.log(`[SEND-CAMPAIGN] No pending targets for campaign: ${campaign_id}`);
      return new Response(
        JSON.stringify({
          message: "No pending targets found",
          sent_count: 0,
          failed_count: 0,
          duration_ms: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SEND-CAMPAIGN] Found ${targets.length} pending targets`);

    let sentCount = 0;
    let failedCount = 0;

    // Process targets with staggered sending
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];

      try {
        // Send the email
        const result = await sendEmail(target, campaign, companyName);

        if (result.success) {
          // Update target status to 'sent'
          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/campaign_targets?id=eq.${target.id}`,
            {
              method: "PATCH",
              headers: {
                "Authorization": `Bearer ${supabaseServiceKey}`,
                "apikey": supabaseServiceKey,
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
              },
              body: JSON.stringify({
                status: "sent",
                sent_at: new Date().toISOString(),
              }),
            }
          );

          if (updateResponse.ok) {
            sentCount++;
            console.log(`[SEND-CAMPAIGN] Sent email to: ${target.email}`);
          } else {
            failedCount++;
            console.error(`[SEND-CAMPAIGN] Failed to update target ${target.id}: ${updateResponse.status}`);
          }
        } else {
          failedCount++;
          console.error(`[SEND-CAMPAIGN] Failed to send to ${target.email}: ${result.error}`);
        }
      } catch (error) {
        failedCount++;
        console.error(`[SEND-CAMPAIGN] Error processing target ${target.id}:`, error);
      }

      // Staggered delay between emails (skip last one to avoid unnecessary wait)
      if (i < targets.length - 1) {
        await staggeredDelay(i);
      }
    }

    const endTime = new Date().toISOString();
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();

    const summary: SendSummary = {
      sent_count: sentCount,
      failed_count: failedCount,
      duration_ms: durationMs,
      start_time: startTime,
      end_time: endTime,
    };

    console.log(`[SEND-CAMPAIGN] Completed. Sent: ${sentCount}, Failed: ${failedCount}, Duration: ${durationMs}ms`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[SEND-CAMPAIGN] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
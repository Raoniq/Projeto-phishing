// Edge Function: assign-training
// Automatically assigns training to users who fail phishing simulations
// Triggered after credentials are submitted in a phishing campaign

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const _TRAINING_ASSIGNMENT_REASON = "phishing_failure";

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
    // Parse request body
    let body: { tracking_id?: string; campaign_target_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { tracking_id, campaign_target_id } = body;

    // Validate required fields - need at least one identifier
    if (!tracking_id && !campaign_target_id) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: either tracking_id or campaign_target_id must be provided",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate tracking_id format if provided
    if (tracking_id && !isValidUUID(tracking_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid tracking_id format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate campaign_target_id format if provided
    if (campaign_target_id && !isValidUUID(campaign_target_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid campaign_target_id format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the campaign target
    let target;
    if (campaign_target_id) {
      const { data, error } = await supabase
        .from("campaign_targets")
        .select("id, user_id, campaign_id, failure_count")
        .eq("id", campaign_target_id)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Campaign target not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      target = data;
    } else {
      const { data, error } = await supabase
        .from("campaign_targets")
        .select("id, user_id, campaign_id, failure_count")
        .eq("tracking_id", tracking_id)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Campaign target not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      target = data;
    }

    // Increment failure_count
    const newFailureCount = (target.failure_count || 0) + 1;

    const { error: updateError } = await supabase
      .from("campaign_targets")
      .update({ failure_count: newFailureCount })
      .eq("id", target.id);

    if (updateError) {
      console.error("Failed to update failure_count:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update failure tracking" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call the database function to assign training based on failure count
    const { error: assignError } = await supabase.rpc(
      "assign_training_on_phishing_failure",
      {
        p_user_id: target.user_id,
        p_campaign_id: target.campaign_id,
        p_failure_count: newFailureCount,
      }
    );

    if (assignError) {
      console.error("Failed to assign training:", assignError);
      // Don't fail the whole request - training assignment can be retried
      return new Response(
        JSON.stringify({
          error: "Failed to assign training",
          details: assignError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Determine difficulty level for response
    let difficultyLevel: string;
    if (newFailureCount <= 1) {
      difficultyLevel = "beginner";
    } else if (newFailureCount <= 3) {
      difficultyLevel = "intermediate";
    } else {
      difficultyLevel = "advanced";
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Training assigned successfully",
        training_difficulty: difficultyLevel,
        failure_count: newFailureCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("assign-training error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
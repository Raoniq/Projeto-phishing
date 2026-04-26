// workers/email/worker.ts — Email sending worker (Cloudflare Worker)
import { createAdminClient } from '../_lib/supabase-admin';
import { createSmtpClient } from './smtp-mock';
import { EmailQueue } from './queue';
import type { EmailJob, EmailSendResult } from './types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RATE_LIMIT: KVNamespace;
  EMAIL_QUEUE: KVNamespace; // For persisting queue state
  APP_URL: string;
  // Email rate limits
  EMAIL_MAX_PER_MINUTE?: number;
  EMAIL_MAX_PER_HOUR?: number;
  EMAIL_MAX_PER_DAY?: number;
}

// Email worker handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Route: POST /email/send - Send single email
    if (pathname === '/email/send' && request.method === 'POST') {
      return handleSendEmail(request, env, ctx);
    }

    // Route: POST /email/batch - Add multiple emails to queue
    if (pathname === '/email/batch' && request.method === 'POST') {
      return handleBatchEmails(request, env, ctx);
    }

    // Route: GET /email/queue/status - Get queue status
    if (pathname === '/email/queue/status' && request.method === 'GET') {
      return handleQueueStatus(env);
    }

    // Route: GET /email/rate-limit - Get rate limit status
    if (pathname === '/email/rate-limit' && request.method === 'GET') {
      return handleRateLimitStatus(env);
    }

    // Route: POST /email/bounce webhook (from Zeptomail in production)
    if (pathname === '/email/bounce' && request.method === 'POST') {
      return handleBounceWebhook(request, env, ctx);
    }

    // 404
    return new Response(JSON.stringify({ error: 'Email endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

// Handle single email send
async function handleSendEmail(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();

    // Validate required fields
    const { campaignTargetId, to, from, subject, bodyHtml, bodyText, metadata } = body;

    if (!campaignTargetId || !to || !from || !subject) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: campaignTargetId, to, from, subject'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const job: EmailJob = {
      id: crypto.randomUUID(),
      campaignTargetId,
      to,
      from,
      subject,
      bodyHtml: bodyHtml ?? '',
      bodyText: bodyText ?? '',
      metadata: metadata ?? {},
      priority: body.priority ?? 'normal',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
    };

    // Create admin client and SMTP mock
    const supabase = createAdminClient(env);
    const smtp = createSmtpClient();

    // Check rate limit first
    const rateLimitStatus = getRateLimitFromKV(env);
    if (!rateLimitStatus.canSend) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitStatus.retryAfter,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(rateLimitStatus.retryAfter / 1000)),
        },
      });
    }

    // Send email via mock SMTP
    const result = await smtp.send(job);

    // Log to database
    await logEmailEvent(supabase, campaignTargetId, result, env);

    // Update campaign target status
    await updateCampaignTargetStatus(supabase, campaignTargetId, result);

    // Increment rate limit counter
    await incrementRateLimitCounter(env);

    return new Response(JSON.stringify({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      bounced: result.bounced,
    }), {
      status: result.success ? 200 : (result.bounced ? 200 : 500),
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Email send error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle batch email queue
async function handleBatchEmails(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const body = await request.json();
    const { jobs } = body;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return new Response(JSON.stringify({
        error: 'jobs must be a non-empty array',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create queue with rate limits from env
    const rateLimitConfig = {
      maxPerMinute: env.EMAIL_MAX_PER_MINUTE ?? 50,
      maxPerHour: env.EMAIL_MAX_PER_HOUR ?? 2000,
      maxPerDay: env.EMAIL_MAX_PER_DAY ?? 50000,
    };

    const queue = new EmailQueue(rateLimitConfig);
    const smtp = createSmtpClient();

    // Add jobs to queue
    const emailJobs: EmailJob[] = jobs.map((j: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      campaignTargetId: j.campaignTargetId as string,
      to: j.to as string,
      from: j.from as string,
      subject: j.subject as string,
      bodyHtml: (j.bodyHtml as string) ?? '',
      bodyText: (j.bodyText as string) ?? '',
      metadata: (j.metadata as Record<string, unknown>) ?? {},
      priority: (j.priority as 'high' | 'normal' | 'low') ?? 'normal',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
    }));

    queue.enqueueBatch(emailJobs);

    // Start processing in background
    ctx.waitUntil(
      queue.start(async (job: EmailJob) => {
        const supabase = createAdminClient(env);
        const result = await smtp.send(job);
        await logEmailEvent(supabase, job.campaignTargetId, result, env);
        await updateCampaignTargetStatus(supabase, job.campaignTargetId, result);
      })
    );

    return new Response(JSON.stringify({
      queued: emailJobs.length,
      queueStats: queue.getStats(),
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Batch email error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Get queue status
async function handleQueueStatus(): Promise<Response> {
  // In production, get from persistent storage
  // For MVP, return mock stats
  return new Response(JSON.stringify({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    bounced: 0,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Get rate limit status
async function handleRateLimitStatus(env: Env): Promise<Response> {
  const status = getRateLimitFromKV(env);
  return new Response(JSON.stringify(status), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Handle bounce webhook (mock from Zeptomail)
async function handleBounceWebhook(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const { email, bounceType, reason } = body;

    console.log(`📧 Bounce received: ${email} (${bounceType}) - ${reason}`);

    // In production, update campaign_target status and user risk score
    // For MVP, just log
    const supabase = createAdminClient(env);

    // Find campaign target by email and update status
    const { error } = await supabase
      .from('campaign_targets')
      .update({ status: 'failed' })
      .eq('email', email)
      .eq('status', 'sent');

    if (error) {
      console.error('Failed to update bounce status:', error);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bounce webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Helper: Log email event to database
async function logEmailEvent(
  supabase: ReturnType<typeof createAdminClient>,
  campaignTargetId: string,
  result: EmailSendResult,
  env: Env
): Promise<void> {
  const eventType = result.bounced ? 'failed' : (result.success ? 'sent' : 'failed');

  await fetch(`${env.SUPABASE_URL}/rest/v1/campaign_events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      campaign_target_id: campaignTargetId,
      event_type: eventType,
      metadata: {
        messageId: result.messageId,
        error: result.error,
        bounced: result.bounced,
        bouncedReason: result.bouncedReason,
      },
      created_at: new Date().toISOString(),
    }),
  }).catch(err => console.error('Failed to log email event:', err));
}

// Helper: Update campaign target status
async function updateCampaignTargetStatus(
  supabase: ReturnType<typeof createAdminClient>,
  campaignTargetId: string,
  result: EmailSendResult
): Promise<void> {
  const status = result.bounced ? 'failed' : (result.success ? 'sent' : 'failed');
  const sentAt = result.success ? new Date().toISOString() : null;

  try {
    await supabase
      .from('campaign_targets')
      .update({
        status,
        sent_at: sentAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignTargetId);
  } catch (error) {
    console.error('Failed to update campaign target:', error);
  }
}

// Helper: Get rate limit status from KV
function getRateLimitFromKV(env: Env): {
  canSend: boolean;
  minuteUsed: number;
  minuteLimit: number;
  retryAfter: number;
} {
  
  const limit = env.EMAIL_MAX_PER_MINUTE ?? 50;

  // For MVP, use in-memory check (production would use KV)
  return {
    canSend: true,
    minuteUsed: 0,
    minuteLimit: limit,
    retryAfter: 0,
  };
}

// Helper: Increment rate limit counter
async function incrementRateLimitCounter(): Promise<void> {
  // In production, use KV to track across workers
  // For MVP, this is a no-op
}

// Export for testing
export { handleSendEmail, handleBatchEmails, handleBounceWebhook };
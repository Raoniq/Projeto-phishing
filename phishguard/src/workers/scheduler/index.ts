// workers/scheduler/index.ts — Campaign Scheduler Worker (Cloudflare Cron)
// This worker runs on a cron schedule and processes campaign sends
import { createAdminClient } from '../_lib/supabase-admin';
import { StaggerCalculator, RateLimiter } from './stagger';
import { RetryManager } from './retry';
import type {
  SchedulerConfig,
  ScheduledTarget,
  SchedulerMetrics,
  ScheduleLog,
} from './types';
import type { EmailJob, EmailSendResult } from '../email/types';

// Cloudflare types - defined inline since @cloudflare/workers-types may not be installed
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  getWithMetadata(key: string): Promise<{ value: string | null; metadata: unknown }>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[] }>;
}

interface ScheduledController {
  scheduledTime: number;
  cron: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<void>): void;
  passThroughOnException(): void;
}

// Default config
const DEFAULT_CONFIG: SchedulerConfig = {
  maxEmailsPerMinute: 100,
  maxEmailsPerHour: 5000,
  maxEmailsPerDay: 50000,
  businessHoursStart: '09:00',
  businessHoursEnd: '18:00',
  businessDays: [1, 2, 3, 4, 5],
  maxRetries: 3,
  retryDelayMs: 30000,
  retryBackoffMultiplier: 2,
  staggerIntervalMs: 600,
  batchSize: 10,
};

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SCHEDULER_CONFIG?: string;
  RATE_LIMIT: KVNamespace;
  SCHEDULER_STATE?: KVNamespace;
  EMAIL_QUEUE?: KVNamespace;
  EMAIL_MAX_PER_MINUTE?: number;
  EMAIL_MAX_PER_HOUR?: number;
  EMAIL_MAX_PER_DAY?: number;
}

// Scheduler state
let schedulerState: 'idle' | 'running' | 'paused' = 'idle';
let currentCampaignId: string | null = null;
const metrics: SchedulerMetrics = {
  status: 'idle',
  emailsProcessed: 0,
  emailsFailed: 0,
  emailsRemaining: 0,
  lastRunAt: null,
  nextScheduledRun: null,
  currentCampaign: null,
};

// Supabase client - initialized lazily on first use
let supabase: ReturnType<typeof createAdminClient> | null = null;

function getSupabase(env: Env): ReturnType<typeof createAdminClient> {
  if (!supabase) {
    supabase = createAdminClient({
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    });
  }
  return supabase;
}

/**
 * Main scheduler worker
 * Cloudflare Cron triggers this every minute
 */
export default {
  // Cron trigger - runs every minute
  async scheduled(
    controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    console.log('⏰ Scheduler: Cron triggered at', new Date().toISOString());

    // Check if paused
    const isPaused = await isSchedulerPaused(env);
    if (isPaused) {
      console.log('⏸️ Scheduler: Paused, skipping this run');
      return;
    }

    // Parse config
    const config = parseConfig(env);

    // Initialize components
    const staggerCalc = new StaggerCalculator(config);
    const rateLimiter = new RateLimiter(config);
    const retryManager = new RetryManager(config);

    schedulerState = 'running';
    metrics.status = 'running';

    try {
      // Find campaigns that need processing
      const campaigns = await findScheduledCampaigns(env);

      if (campaigns.length === 0) {
        console.log('📭 Scheduler: No campaigns to process');
        return;
      }

      console.log(`📬 Scheduler: Found ${campaigns.length} campaigns to process`);

      for (const campaign of campaigns) {
        await processCampaign(campaign, env, config, staggerCalc, rateLimiter, retryManager);
      }

      metrics.lastRunAt = new Date().toISOString();
    } catch (error) {
      console.error('❌ Scheduler: Error processing campaigns:', error);
      metrics.status = 'error';
      schedulerState = 'idle';
    }

    schedulerState = 'idle';
    metrics.status = 'idle';
  },

  // HTTP handler for manual triggers and control
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Route: GET /scheduler/status - Get scheduler status
    if (pathname === '/scheduler/status' && request.method === 'GET') {
      return handleGetStatus(env);
    }

    // Route: POST /scheduler/pause - Pause scheduler
    if (pathname === '/scheduler/pause' && request.method === 'POST') {
      return handlePause(request, env);
    }

    // Route: POST /scheduler/resume - Resume scheduler
    if (pathname === '/scheduler/resume' && request.method === 'POST') {
      return handleResume(request, env);
    }

    // Route: POST /scheduler/trigger - Manually trigger processing
    if (pathname === '/scheduler/trigger' && request.method === 'POST') {
      return handleManualTrigger(request, env);
    }

    // Route: POST /scheduler/campaign/:id/pause - Pause specific campaign
    if (pathname.match(/^\/scheduler\/campaign\/[^/]+\/pause$/) && request.method === 'POST') {
      const campaignId = pathname.split('/')[3];
      return handlePauseCampaign(campaignId, request, env);
    }

    // Route: POST /scheduler/campaign/:id/resume - Resume specific campaign
    if (pathname.match(/^\/scheduler\/campaign\/[^/]+\/resume$/) && request.method === 'POST') {
      const campaignId = pathname.split('/')[3];
      return handleResumeCampaign(campaignId, request, env);
    }

    return new Response(JSON.stringify({ error: 'Scheduler endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

/**
 * Process a single campaign
 */
async function processCampaign(
  campaign: { id: string; company_id: string; scheduled_at: string },
  env: Env,
  config: SchedulerConfig,
  staggerCalc: StaggerCalculator,
  rateLimiter: RateLimiter,
  retryManager: RetryManager
): Promise<void> {
  console.log(`🎯 Scheduler: Processing campaign ${campaign.id}`);
  currentCampaignId = campaign.id;
  metrics.currentCampaign = campaign.id;

  const supabase = getSupabase(env);

  // Get pending targets for this campaign
  const { data: targets, error } = await supabase
    .from('campaign_targets')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending');

  if (error || !targets || targets.length === 0) {
    console.log(`📭 Scheduler: No pending targets for campaign ${campaign.id}`);
    return;
  }

  console.log(`📧 Scheduler: Found ${targets.length} pending targets`);

  // Calculate staggered schedule
  const scheduledTargets = staggerCalc.calculateSchedule(
    targets.map(t => ({
      id: t.id,
      campaignId: t.campaign_id,
      email: t.email,
      timezone: t.timezone || 'UTC',
    })),
    new Date(campaign.scheduled_at)
  );

  metrics.emailsRemaining = scheduledTargets.length;

  // Process each target with rate limiting
  for (const target of scheduledTargets) {
    // Check rate limit
    const canSend = rateLimiter.canSend();
    if (!canSend.allowed) {
      console.log(`⏳ Scheduler: Rate limited, waiting ${canSend.waitMs}ms`);
      await sleep(canSend.waitMs ?? 1000);
      continue;
    }

    // Check retry status
    if (target.status === 'retrying') {
      const retryResult = retryManager.shouldRetry(target);
      if (!retryResult.shouldRetry) {
        console.log(`⏳ Scheduler: Target ${target.campaignTargetId} in retry backoff`);
        continue;
      }
    }

    // Send email
    const result = await sendEmail(target, env);

    if (result.success) {
      // Success
      rateLimiter.recordSend();
      metrics.emailsProcessed++;
      retryManager.recordSuccess(target.campaignTargetId);
      await updateTargetStatus(supabase, target.campaignTargetId, 'sent');
      await logScheduleEvent(target, 'sent', env);
    } else {
      // Failure - record retry
      const retryResult = retryManager.recordFailure(target.campaignTargetId, result.error ?? 'Unknown error');
      metrics.emailsFailed++;

      if (retryResult.maxRetriesExceeded) {
        await updateTargetStatus(supabase, target.campaignTargetId, 'failed');
        await logScheduleEvent(target, 'failed', env, result.error);
      } else {
        await logScheduleEvent(target, 'retried', env, result.error);
      }
    }

    metrics.emailsRemaining--;
  }

  // Check if campaign is complete
  const remaining = await countPendingTargets(supabase, campaign.id);
  if (remaining === 0) {
    await updateCampaignStatus(supabase, campaign.id, 'completed');
    console.log(`✅ Scheduler: Campaign ${campaign.id} completed`);
  }

  currentCampaignId = null;
  metrics.currentCampaign = null;
}

/**
 * Send email for a target
 */
async function sendEmail(
  target: ScheduledTarget,
  env: Env
): Promise<EmailSendResult> {
  try {
    const supabase = getSupabase(env);

    // Get campaign template and content
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('template_id, name')
      .eq('id', target.campaignId)
      .single();

    if (!campaign?.template_id) {
      return { success: false, error: 'Campaign has no template' };
    }

    const { data: template } = await supabase
      .from('campaign_templates')
      .select('subject, body_html, body_text, from_email, from_name')
      .eq('id', campaign.template_id)
      .single();

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Prepare email job
    const emailJob: EmailJob = {
      id: crypto.randomUUID(),
      campaignTargetId: target.campaignTargetId,
      to: target.email,
      from: template.from_email || 'noreply@example.com',
      subject: template.subject,
      bodyHtml: template.body_html,
      bodyText: template.body_text || '',
      metadata: {
        campaignId: target.campaignId,
        scheduledUtc: target.scheduledUtc.toISOString(),
        localTime: target.localTime,
        timezone: target.timezone,
      },
      priority: 'normal',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      scheduledAt: target.scheduledUtc.toISOString(),
    };

    // Call email worker
    const emailWorkerUrl = `${env.SUPABASE_URL}/email/send`; // In production, use actual worker URL
    const response = await fetch(emailWorkerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailJob),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error ?? `HTTP ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      success: result.success ?? true,
      messageId: result.messageId,
      error: result.error,
      bounced: result.bounced,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update target status in database
 */
async function updateTargetStatus(
  supabase: ReturnType<typeof createAdminClient>,
  targetId: string,
  status: 'sent' | 'failed' | 'pending'
): Promise<void> {
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'sent') {
    update.sent_at = new Date().toISOString();
  }

  await supabase
    .from('campaign_targets')
    .update(update)
    .eq('id', targetId);
}

/**
 * Update campaign status
 */
async function updateCampaignStatus(
  supabase: ReturnType<typeof createAdminClient>,
  campaignId: string,
  status: 'running' | 'completed' | 'paused'
): Promise<void> {
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'completed') {
    update.completed_at = new Date().toISOString();
  }

  await supabase
    .from('campaigns')
    .update(update)
    .eq('id', campaignId);
}

/**
 * Count pending targets for a campaign
 */
async function countPendingTargets(
  supabase: ReturnType<typeof createAdminClient>,
  campaignId: string
): Promise<number> {
  const { count } = await supabase
    .from('campaign_targets')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'pending');

  return count ?? 0;
}

/**
 * Find campaigns that need processing
 */
async function findScheduledCampaigns(env: Env): Promise<Array<{ id: string; company_id: string; scheduled_at: string }>> {
  const supabase = getSupabase(env);

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 min early window

  // Find campaigns that:
  // 1. Are scheduled for now or past
  // 2. Are in 'scheduled' or 'running' status
  // 3. Have pending targets
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, company_id, scheduled_at')
    .in('status', ['scheduled', 'running'])
    .lte('scheduled_at', now.toISOString())
    .gte('scheduled_at', fiveMinutesAgo.toISOString())
    .limit(10);

  return campaigns ?? [];
}

/**
 * Log schedule event to database
 */
async function logScheduleEvent(
  target: ScheduledTarget,
  action: ScheduleLog['action'],
  env: Env,
  error?: string
): Promise<void> {
  const supabase = getSupabase(env);

  const log: ScheduleLog = {
    id: crypto.randomUUID(),
    campaignId: target.campaignId,
    campaignTargetId: target.campaignTargetId,
    action,
    timestamp: new Date().toISOString(),
    details: {
      scheduledTime: target.scheduledUtc.toISOString(),
      localTime: target.localTime,
      timezone: target.timezone,
      error,
    },
  };

  try {
    await supabase.from('schedule_logs').insert({
      campaign_id: log.campaignId,
      campaign_target_id: log.campaignTargetId,
      action: log.action,
      details: log.details,
      created_at: log.timestamp,
    });
  } catch (err) {
    console.error('Failed to log schedule event:', err);
  }
}

/**
 * Check if scheduler is paused (global flag)
 */
async function isSchedulerPaused(env: Env): Promise<boolean> {
  try {
    const state = await env.SCHEDULER_STATE?.get('scheduler_paused');
    return state === 'true';
  } catch {
    return false;
  }
}

/**
 * Parse scheduler configuration from env
 */
function parseConfig(env: Env): SchedulerConfig {
  if (env.SCHEDULER_CONFIG) {
    try {
      return JSON.parse(env.SCHEDULER_CONFIG) as SchedulerConfig;
    } catch {
      console.warn('Invalid SCHEDULER_CONFIG, using defaults');
    }
  }

  // Build from env vars
  return {
    ...DEFAULT_CONFIG,
    maxEmailsPerMinute: env.EMAIL_MAX_PER_MINUTE ?? DEFAULT_CONFIG.maxEmailsPerMinute,
    maxEmailsPerHour: env.EMAIL_MAX_PER_HOUR ?? DEFAULT_CONFIG.maxEmailsPerHour,
    maxEmailsPerDay: env.EMAIL_MAX_PER_DAY ?? DEFAULT_CONFIG.maxEmailsPerDay,
  };
}

// HTTP Handlers

async function handleGetStatus(env: Env): Promise<Response> {
  const isPaused = await isSchedulerPaused(env);

  return new Response(JSON.stringify({
    status: isPaused ? 'paused' : schedulerState,
    metrics,
    isGloballyPaused: isPaused,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handlePause(request: Request, env: Env): Promise<Response> {
  await env.SCHEDULER_STATE?.put('scheduler_paused', 'true');
  schedulerState = 'paused';
  metrics.status = 'paused';

  console.log('⏸️ Scheduler: Globally paused');

  return new Response(JSON.stringify({
    success: true,
    message: 'Scheduler paused globally',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleResume(request: Request, env: Env): Promise<Response> {
  await env.SCHEDULER_STATE?.delete('scheduler_paused');
  schedulerState = 'idle';
  metrics.status = 'idle';

  console.log('▶️ Scheduler: Resumed');

  return new Response(JSON.stringify({
    success: true,
    message: 'Scheduler resumed',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleManualTrigger(request: Request, env: Env): Promise<Response> {
  // Allow manual trigger even if not cron
  const config = parseConfig(env);

  const campaigns = await findScheduledCampaigns(env);

  if (campaigns.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'No campaigns to process',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const staggerCalc = new StaggerCalculator(config);
  const rateLimiter = new RateLimiter(config);
  const retryManager = new RetryManager(config);

  schedulerState = 'running';
  metrics.status = 'running';

  for (const campaign of campaigns) {
    await processCampaign(campaign, env, config, staggerCalc, rateLimiter, retryManager);
  }

  schedulerState = 'idle';
  metrics.status = 'idle';
  metrics.lastRunAt = new Date().toISOString();

  return new Response(JSON.stringify({
    success: true,
    message: `Processed ${campaigns.length} campaigns`,
    metrics,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handlePauseCampaign(
  campaignId: string,
  _request: Request,
  env: Env
): Promise<Response> {
  const supabase = getSupabase(env);

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, status')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return new Response(JSON.stringify({ error: 'Campaign not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await supabase
    .from('campaigns')
    .update({ status: 'paused' })
    .eq('id', campaignId);

  console.log(`⏸️ Scheduler: Campaign ${campaignId} paused`);

  return new Response(JSON.stringify({
    success: true,
    message: `Campaign ${campaignId} paused`,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleResumeCampaign(
  campaignId: string,
  _request: Request,
  env: Env
): Promise<Response> {
  const supabase = getSupabase(env);

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, status')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return new Response(JSON.stringify({ error: 'Campaign not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Resume to 'running' status so scheduler picks it up
  await supabase
    .from('campaigns')
    .update({ status: 'running' })
    .eq('id', campaignId);

  console.log(`▶️ Scheduler: Campaign ${campaignId} resumed`);

  return new Response(JSON.stringify({
    success: true,
    message: `Campaign ${campaignId} resumed`,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for testing
export { parseConfig, findScheduledCampaigns, processCampaign };
/**
 * Webhook Manager
 *
 * Provides a generic webhook system for:
 * - Outbound webhooks (notify external systems on events)
 * - Inbound webhooks (receive data from HR systems, LDAP, etc.)
 * - Webhook log with retry logic
 *
 * HMAC-SHA256 signatures are generated for outbound webhook payloads.
 * Retry logic uses exponential backoff (max 3 retries).
 */

import { supabase } from '../supabase';
import { createHmac } from '../crypto/hash';

// ============================================================================
// Types
// ============================================================================

export interface WebhookConfig {
  companyId: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  isActive?: boolean;
}

export interface Webhook {
  id: string;
  company_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  headers: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  retry_count: number;
  next_retry_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface SendWebhookOptions {
  event: string;
  payload: Record<string, unknown>;
}

export interface SendWebhookResult {
  success: boolean;
  logId?: string;
  error?: string;
  statusCode?: number;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 30000; // 30 seconds

// Supported event types
export const WEBHOOK_EVENTS = {
  CAMPAIGN_COMPLETED: 'campaign.completed',
  CAMPAIGN_STARTED: 'campaign.started',
  TRAINING_ASSIGNED: 'training.assigned',
  TRAINING_COMPLETED: 'training.completed',
  CERTIFICATE_EARNED: 'certificate.earned',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  PHISH_RESULT_DETECTED: 'phish.result.detected',
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

// ============================================================================
// HMAC Signature Generation
// ============================================================================

/**
 * Generate HMAC-SHA256 signature for webhook payload.
 * Used to verify webhook authenticity on the receiving end.
 *
 * @param payload - JSON stringified payload
 * @param secret - Webhook secret key
 * @returns Hex-encoded HMAC signature
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return createHmac(payload, secret);
}

/**
 * Verify webhook signature from incoming request.
 *
 * @param payload - Raw request body as string
 * @param signature - X-Webhook-Signature header value
 * @param secret - Webhook secret key
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  // Use timing-safe comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

// ============================================================================
// WebhookManager Class
// ============================================================================

export class WebhookManager {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Register a new webhook for the company.
   *
   * @example
   * ```typescript
   * const manager = new WebhookManager(companyId);
   * const webhook = await manager.registerWebhook({
   *   name: 'Slack Notifications',
   *   url: 'https://hooks.slack.com/services/xxx',
   *   events: [WEBHOOK_EVENTS.CAMPAIGN_COMPLETED, WEBHOOK_EVENTS.TRAINING_COMPLETED],
   *   secret: 'my-webhook-secret',
   * });
   * ```
   */
  async registerWebhook(config: Omit<WebhookConfig, 'companyId'>): Promise<Webhook> {
    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        company_id: this.companyId,
        name: config.name,
        url: config.url,
        events: config.events,
        secret: config.secret || null,
        headers: config.headers || {},
        is_active: config.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to register webhook: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing webhook.
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<Omit<WebhookConfig, 'companyId'>>
  ): Promise<Webhook> {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.events !== undefined) updateData.events = updates.events;
    if (updates.secret !== undefined) updateData.secret = updates.secret;
    if (updates.headers !== undefined) updateData.headers = updates.headers;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('webhooks')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', webhookId)
      .eq('company_id', this.companyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update webhook: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a webhook and its logs.
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('company_id', this.companyId);

    if (error) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  /**
   * Get all webhooks for the company.
   */
  async getWebhooks(): Promise<Webhook[]> {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('company_id', this.companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch webhooks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get webhook logs for a specific webhook.
   *
   * @param webhookId - Webhook ID to fetch logs for
   * @param limit - Maximum number of logs to return (default 50)
   */
  async getWebhookLogs(webhookId: string, limit = 50): Promise<WebhookLog[]> {
    // First verify webhook belongs to this company
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('id')
      .eq('id', webhookId)
      .eq('company_id', this.companyId)
      .single();

    if (webhookError || !webhook) {
      throw new Error('Webhook not found or access denied');
    }

    const { data, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch webhook logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Send a webhook event to all matching registered webhooks.
   *
   * @param event - Event type (e.g., 'campaign.completed')
   * @param payload - Data to send with the webhook
   * @returns Results for each webhook delivery
   */
  async sendWebhook(
    event: string,
    payload: Record<string, unknown>
  ): Promise<SendWebhookResult[]> {
    // Find all active webhooks subscribed to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('company_id', this.companyId)
      .eq('is_active', true)
      .contains('events', [event]);

    if (error) {
      throw new Error(`Failed to fetch webhooks: ${error.message}`);
    }

    if (!webhooks || webhooks.length === 0) {
      return [{ success: false, error: 'No matching webhooks found' }];
    }

    // Send to all matching webhooks in parallel
    const results = await Promise.all(
      webhooks.map((webhook) => this.deliverWebhook(webhook, event, payload))
    );

    return results;
  }

  /**
   * Deliver a webhook with retry logic.
   */
  private async deliverWebhook(
    webhook: Webhook,
    event: string,
    payload: Record<string, unknown>
  ): Promise<SendWebhookResult> {
    // Create initial log entry
    const { data: logEntry, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhook.id,
        event_type: event,
        payload,
        retry_count: 0,
      })
      .select()
      .single();

    if (logError || !logEntry) {
      return { success: false, error: 'Failed to create log entry' };
    }

    let lastError: string | undefined;
    let lastStatusCode: number | undefined;

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.performDelivery(webhook, event, payload);

        if (result.success) {
          // Update log as successful
          await this.updateLogSuccess(logEntry.id, result.statusCode);
          return { success: true, logId: logEntry.id, statusCode: result.statusCode };
        }

        lastError = result.error;
        lastStatusCode = result.statusCode;
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error';
      }

      // If not last attempt, wait before retry
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
        await this.sleep(delay);

        // Update log with next retry time
        const nextRetryAt = new Date(Date.now() + delay).toISOString();
        await supabase
          .from('webhook_logs')
          .update({
            retry_count: attempt + 1,
            next_retry_at: nextRetryAt,
          })
          .eq('id', logEntry.id);
      }
    }

    // All retries exhausted
    await this.updateLogFailure(logEntry.id, lastError, lastStatusCode);
    return {
      success: false,
      logId: logEntry.id,
      error: lastError,
      statusCode: lastStatusCode,
    };
  }

  /**
   * Perform the actual HTTP delivery.
   */
  private async performDelivery(
    webhook: Webhook,
    event: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const payloadString = JSON.stringify(payload);
    const timestamp = new Date().toISOString();

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event,
      'X-Webhook-Timestamp': timestamp,
      ...webhook.headers,
    };

    // Add HMAC signature if secret is configured
    if (webhook.secret) {
      const signature = generateWebhookSignature(payloadString, webhook.secret);
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        // Timeout after 30 seconds
        signal: AbortSignal.timeout(30000),
      });

      const responseBody = await response.text().catch(() => '');

      // Update log with response
      await supabase
        .from('webhook_logs')
        .update({
          response_status: response.status,
          response_body: responseBody.slice(0, 10000), // Limit response size
        })
        .eq('id', (
          await supabase
            .from('webhook_logs')
            .select('id')
            .eq('webhook_id', webhook.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        ).data?.id);

      // Consider 2xx as success
      if (response.status >= 200 && response.status < 300) {
        return { success: true, statusCode: response.status };
      }

      return {
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${responseBody.slice(0, 200)}`,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update log entry on successful delivery.
   */
  private async updateLogSuccess(logId: string, statusCode?: number): Promise<void> {
    await supabase
      .from('webhook_logs')
      .update({
        response_status: statusCode || 200,
        delivered_at: new Date().toISOString(),
      })
      .eq('id', logId);
  }

  /**
   * Update log entry on final failure.
   */
  private async updateLogFailure(
    logId: string,
    errorMessage?: string,
    statusCode?: number
  ): Promise<void> {
    await supabase
      .from('webhook_logs')
      .update({
        response_status: statusCode,
        error_message: errorMessage,
        next_retry_at: null, // No more retries
      })
      .eq('id', logId);
  }

  /**
   * Process pending webhook retries.
   * Should be called periodically by a cron job or worker.
   */
  async processRetries(): Promise<number> {
    // Find logs with pending retries
    const { data: pendingLogs, error } = await supabase
      .from('webhook_logs')
      .select('*, webhooks(*)')
      .eq('next_retry_at', true)
      .lte('next_retry_at', new Date().toISOString())
      .eq('webhooks.is_active', true)
      .lt('retry_count', MAX_RETRIES);

    if (error || !pendingLogs) {
      return 0;
    }

    let processedCount = 0;

    for (const log of pendingLogs) {
      const webhook = (log as { webhooks: Webhook }).webhooks;
      if (!webhook) continue;

      const result = await this.performDelivery(webhook, log.event_type, log.payload);

      if (result.success) {
        await this.updateLogSuccess(log.id, result.statusCode);
      } else {
        const newRetryCount = log.retry_count + 1;
        if (newRetryCount >= MAX_RETRIES) {
          await this.updateLogFailure(log.id, result.error, result.statusCode);
        } else {
          const delay = Math.min(BASE_DELAY_MS * Math.pow(2, newRetryCount), MAX_DELAY_MS);
          const nextRetryAt = new Date(Date.now() + delay).toISOString();
          await supabase
            .from('webhook_logs')
            .update({
              retry_count: newRetryCount,
              next_retry_at: nextRetryAt,
              response_status: result.statusCode,
              error_message: result.error,
            })
            .eq('id', log.id);
        }
      }

      processedCount++;
    }

    return processedCount;
  }

  /**
   * Sleep for specified milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default WebhookManager;
// workers/email/types.ts — Email job types

export interface EmailJob {
  id: string;
  campaignTargetId: string;
  to: string;
  from: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  metadata: Record<string, unknown>;
  priority: 'high' | 'normal' | 'low';
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  scheduledAt?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  bounced?: boolean;
  bouncedReason?: string;
}

export interface BounceRecord {
  email: string;
  bounceType: 'hard' | 'soft';
  reason: string;
  occurredAt: string;
  campaignTargetId: string;
}

export interface RateLimitConfig {
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
}

export interface EmailQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  bounced: number;
}
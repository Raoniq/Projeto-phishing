// workers/scheduler/types.ts — Scheduler types
// KVNamespace type for Cloudflare Workers KV binding
type KVNamespace = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: (options?: { prefix?: string }) => Promise<{ keys: { name: string }[] }>;
};

// Scheduler state
export type SchedulerStatus = 'idle' | 'running' | 'paused' | 'error';

export interface SchedulerConfig {
  // Rate limiting
  maxEmailsPerMinute: number;      // Default 100 for staggered sending
  maxEmailsPerHour: number;         // Default 5000
  maxEmailsPerDay: number;         // Default 50000

  // Business hours (configurable)
  businessHoursStart: string;       // "09:00" in 24h format
  businessHoursEnd: string;        // "18:00" in 24h format
  businessDays: number[];          // [0,1,2,3,4,5,6] - 0 = Sunday

  // Retry config
  maxRetries: number;              // Default 3
  retryDelayMs: number;            // Default 30000 (30s)
  retryBackoffMultiplier: number;  // Default 2 (exponential)

  // Stagger config
  staggerIntervalMs: number;        // Interval between emails (600ms for 100/min)
  batchSize: number;               // Emails per batch
}

// Schedule entry for a target
export interface ScheduledTarget {
  campaignTargetId: string;
  campaignId: string;
  email: string;
  scheduledUtc: Date;              // UTC time to send
  localTime: string;               // Original local time (for logging)
  timezone: string;                // Target's timezone
  retryCount: number;
  status: 'scheduled' | 'processing' | 'sent' | 'failed' | 'retrying';
}

// Campaign schedule info
export interface CampaignSchedule {
  campaignId: string;
  companyId: string;
  scheduledUtc: Date;
  targetCount: number;
  status: 'pending' | 'processing' | 'completed' | 'paused' | 'cancelled';
}

// Scheduler metrics
export interface SchedulerMetrics {
  status: SchedulerStatus;
  emailsProcessed: number;
  emailsFailed: number;
  emailsRemaining: number;
  lastRunAt: string | null;
  nextScheduledRun: string | null;
  currentCampaign: string | null;
}

// Default configuration
export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  maxEmailsPerMinute: 100,
  maxEmailsPerHour: 5000,
  maxEmailsPerDay: 50000,
  businessHoursStart: '09:00',
  businessHoursEnd: '18:00',
  businessDays: [1, 2, 3, 4, 5], // Monday to Friday
  maxRetries: 3,
  retryDelayMs: 30000,
  retryBackoffMultiplier: 2,
  staggerIntervalMs: 600, // 100 emails/min = 600ms between each
  batchSize: 10,
};

// Environment interface for scheduler
export interface SchedulerEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SCHEDULER_CONFIG?: string;       // JSON string of SchedulerConfig
  RATE_LIMIT: KVNamespace;
  SCHEDULER_STATE?: KVNamespace;   // For persisting scheduler state
  EMAIL_QUEUE: KVNamespace;
  EMAIL_MAX_PER_MINUTE?: number;
  EMAIL_MAX_PER_HOUR?: number;
  EMAIL_MAX_PER_DAY?: number;
}

// Schedule log entry for audit
export interface ScheduleLog {
  id: string;
  campaignId: string;
  campaignTargetId: string;
  action: 'scheduled' | 'sent' | 'failed' | 'retried' | 'skipped_business_hours' | 'paused' | 'resumed';
  timestamp: string;
  details: {
    scheduledTime?: string;
    localTime?: string;
    timezone?: string;
    error?: string;
    retryCount?: number;
  };
}
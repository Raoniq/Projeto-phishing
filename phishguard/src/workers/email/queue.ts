// workers/email/queue.ts — Email queue with rate limiting and batch processing
import type { EmailJob, EmailQueueStats, RateLimitConfig } from './types';

// Default rate limits (configurable via env)
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxPerMinute: 50,    // 50 emails per minute
  maxPerHour: 2000,     // 2000 emails per hour
  maxPerDay: 50000,    // 50k emails per day
};

// Queue configuration
const QUEUE_BATCH_SIZE = 10;        // Process 10 emails per batch
const QUEUE_PROCESS_INTERVAL_MS = 2000; // Check queue every 2 seconds
const QUEUE_MAX_RETRY = 3;         // Retry failed emails 3 times // Wait 30 seconds before retry

interface QueueState {
  pending: EmailJob[];
  processing: EmailJob[];
  completed: EmailJob[];
  failed: EmailJob[];
  bounced: EmailJob[];
}

interface RateLimitState {
  minuteCount: number;
  minuteResetAt: number;
  hourCount: number;
  hourResetAt: number;
  dayCount: number;
  dayResetAt: number;
}

/**
 * EmailQueue - In-memory queue with rate limiting
 * 
 * For production with multiple workers, use:
 * - Cloudflare Queue (Durable Objects)
 * - Or external queue like Redis/Bull
 */
export class EmailQueue {
  private queue: QueueState = {
    pending: [],
    processing: [],
    completed: [],
    failed: [],
    bounced: [],
  };

  private rateLimit: RateLimitState = {
    minuteCount: 0,
    minuteResetAt: 0,
    hourCount: 0,
    hourResetAt: 0,
    dayCount: 0,
    dayResetAt: 0,
  };

  private rateLimitConfig: RateLimitConfig;
  private isProcessing: boolean = false;
  private processTimer: ReturnType<typeof setInterval> | null = null;
  private onProcessCallback: ((job: EmailJob) => Promise<void>) | null = null;

  constructor(rateLimitConfig: RateLimitConfig = DEFAULT_RATE_LIMIT) {
    this.rateLimitConfig = rateLimitConfig;
    this.initRateLimitCounters();
  }

  private initRateLimitCounters(): void {
    const now = Date.now();
    const minuteMs = 60000;
    const hourMs = 3600000;
    const dayMs = 86400000;

    this.rateLimit = {
      minuteCount: 0,
      minuteResetAt: now + minuteMs,
      hourCount: 0,
      hourResetAt: now + hourMs,
      dayCount: 0,
      dayResetAt: now + dayMs,
    };
  }

  /**
   * Check if we can send (rate limit check)
   */
  private canSend(): { allowed: boolean; reason?: string } {
    const now = Date.now();

    // Reset counters if window expired
    if (now >= this.rateLimit.minuteResetAt) {
      this.rateLimit.minuteCount = 0;
      this.rateLimit.minuteResetAt = now + 60000;
    }
    if (now >= this.rateLimit.hourResetAt) {
      this.rateLimit.hourCount = 0;
      this.rateLimit.hourResetAt = now + 3600000;
    }
    if (now >= this.rateLimit.dayResetAt) {
      this.rateLimit.dayCount = 0;
      this.rateLimit.dayResetAt = now + 86400000;
    }

    // Check minute limit
    if (this.rateLimit.minuteCount >= this.rateLimitConfig.maxPerMinute) {
      return { allowed: false, reason: 'Rate limit: minute exceeded' };
    }

    // Check hour limit
    if (this.rateLimit.hourCount >= this.rateLimitConfig.maxPerHour) {
      return { allowed: false, reason: 'Rate limit: hour exceeded' };
    }

    // Check day limit
    if (this.rateLimit.dayCount >= this.rateLimitConfig.maxPerDay) {
      return { allowed: false, reason: 'Rate limit: day exceeded' };
    }

    return { allowed: true };
  }

  /**
   * Record a send (increment counters)
   */
  private recordSend(): void {
    this.rateLimit.minuteCount++;
    this.rateLimit.hourCount++;
    this.rateLimit.dayCount++;
  }

  /**
   * Add job to queue
   */
  enqueue(job: EmailJob): void {
    // Add with retry info
    const jobWithRetry: EmailJob = {
      ...job,
      retryCount: job.retryCount ?? 0,
      maxRetries: job.maxRetries ?? QUEUE_MAX_RETRY,
    };

    this.queue.pending.push(jobWithRetry);

    console.log(`📬 EmailQueue: Added job ${job.id} to queue (pending: ${this.queue.pending.length})`);
  }

  /**
   * Add multiple jobs to queue
   */
  enqueueBatch(jobs: EmailJob[]): void {
    jobs.forEach(job => this.enqueue(job));
  }

  /**
   * Get next batch of jobs that can be processed
   */
  private getNextBatch(maxSize: number = QUEUE_BATCH_SIZE): EmailJob[] {
    // Check rate limit before processing
    const canProceed = this.canSend();
    if (!canProceed.allowed) {
      console.log(`⏳ EmailQueue: Rate limited - ${canProceed.reason}`);
      return [];
    }

    // Get jobs up to batch size, respecting rate limit
    const batch: EmailJob[] = [];
    for (const job of this.queue.pending) {
      if (batch.length >= maxSize) break;
      if (this.rateLimit.minuteCount + batch.length >= this.rateLimitConfig.maxPerMinute) break;
      batch.push(job);
    }

    return batch;
  }

  /**
   * Process a single email job
   */
  async processJob(job: EmailJob): Promise<void> {
    // Move to processing
    this.queue.pending = this.queue.pending.filter(j => j.id !== job.id);
    this.queue.processing.push(job);

    console.log(`🔄 EmailQueue: Processing job ${job.id} (${job.to})`);

    // Call the processor callback
    if (this.onProcessCallback) {
      try {
        await this.onProcessCallback(job);
        this.recordSend();

        // Move to completed
        this.queue.processing = this.queue.processing.filter(j => j.id !== job.id);
        this.queue.completed.push(job);

        console.log(`✅ EmailQueue: Completed job ${job.id}`);
      } catch {
        // Handle failure
        this.queue.processing = this.queue.processing.filter(j => j.id !== job.id);

        if (job.retryCount < job.maxRetries) {
          // Retry later
          const retryJob: EmailJob = {
            ...job,
            retryCount: job.retryCount + 1,
          };
          this.queue.pending.push(retryJob);
          console.log(`🔁 EmailQueue: Retrying job ${job.id} (attempt ${retryJob.retryCount}/${job.maxRetries})`);
        } else {
          // Move to failed
          this.queue.failed.push(job);
          console.log(`❌ EmailQueue: Failed job ${job.id} after ${job.maxRetries} retries`);
        }
      }
    }
  }

  /**
   * Mark job as bounced
   */
  markBounced(jobId: string, reason: string): void {
    const job = this.queue.processing.find(j => j.id === jobId);
    if (job) {
      this.queue.processing = this.queue.processing.filter(j => j.id !== jobId);
      this.queue.bounced.push(job);
      console.log(`📧 EmailQueue: Bounced job ${jobId} - ${reason}`);
    }
  }

  /**
   * Start queue processing loop
   */
  start(processor: (job: EmailJob) => Promise<void>): void {
    if (this.isProcessing) {
      console.log('⚠️ EmailQueue: Already running');
      return;
    }

    this.isProcessing = true;
    this.onProcessCallback = processor;

    console.log('🚀 EmailQueue: Started processing');

    this.processTimer = setInterval(async () => {
      if (!this.isProcessing) return;

      const batch = this.getNextBatch();
      for (const job of batch) {
        await this.processJob(job);
        // Small delay between emails to respect rate limit
        await new Promise(resolve => setTimeout(resolve, 1000 / this.rateLimitConfig.maxPerMinute));
      }
    }, QUEUE_PROCESS_INTERVAL_MS);
  }

  /**
   * Stop queue processing
   */
  stop(): void {
    this.isProcessing = false;
    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = null;
    }
    console.log('🛑 EmailQueue: Stopped');
  }

  /**
   * Get queue statistics
   */
  getStats(): EmailQueueStats {
    return {
      pending: this.queue.pending.length,
      processing: this.queue.processing.length,
      completed: this.queue.completed.length,
      failed: this.queue.failed.length,
      bounced: this.queue.bounced.length,
    };
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): {
    minute: { used: number; max: number; resetIn: number };
    hour: { used: number; max: number; resetIn: number };
    day: { used: number; max: number; resetIn: number };
    canSend: boolean;
  } {
    const now = Date.now();
    return {
      minute: {
        used: this.rateLimit.minuteCount,
        max: this.rateLimitConfig.maxPerMinute,
        resetIn: Math.max(0, this.rateLimit.minuteResetAt - now),
      },
      hour: {
        used: this.rateLimit.hourCount,
        max: this.rateLimitConfig.maxPerHour,
        resetIn: Math.max(0, this.rateLimit.hourResetAt - now),
      },
      day: {
        used: this.rateLimit.dayCount,
        max: this.rateLimitConfig.maxPerDay,
        resetIn: Math.max(0, this.rateLimit.dayResetAt - now),
      },
      canSend: this.canSend().allowed,
    };
  }

  /**
   * Clear all queues (for testing)
   */
  clear(): void {
    this.queue = {
      pending: [],
      processing: [],
      completed: [],
      failed: [],
      bounced: [],
    };
    console.log('🗑️ EmailQueue: Cleared');
  }
}

// Singleton instance
export const emailQueue = new EmailQueue();

/**
 * Create a new email queue with custom rate limits
 */
export function createEmailQueue(rateLimitConfig?: RateLimitConfig): EmailQueue {
  return new EmailQueue(rateLimitConfig);
}
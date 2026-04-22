// workers/scheduler/retry.ts — Retry logic with exponential backoff
import type { ScheduledTarget, SchedulerConfig } from './types';

export interface RetryResult {
  shouldRetry: boolean;
  nextRetryAt: Date | null;
  maxRetriesExceeded: boolean;
  error?: string;
}

export interface RetryState {
  campaignTargetId: string;
  retryCount: number;
  lastAttempt: Date;
  lastError?: string;
  nextRetryAt?: Date;
}

/**
 * RetryManager - Handles retry logic with exponential backoff
 *
 * Features:
 * - Configurable max retries (default 3)
 * - Exponential backoff with configurable multiplier
 * - Records retry state for audit
 */
export class RetryManager {
  private config: SchedulerConfig;
  private retryStates: Map<string, RetryState> = new Map();

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  /**
   * Check if a target should be retried
   */
  shouldRetry(target: ScheduledTarget): RetryResult {
    const state = this.retryStates.get(target.campaignTargetId);
    const currentRetryCount = state?.retryCount ?? target.retryCount;

    // Check if max retries exceeded
    if (currentRetryCount >= this.config.maxRetries) {
      return {
        shouldRetry: false,
        nextRetryAt: null,
        maxRetriesExceeded: true,
        error: `Max retries (${this.config.maxRetries}) exceeded`,
      };
    }

    // Check if we're in a backoff period
    if (state?.nextRetryAt && new Date() < state.nextRetryAt) {
      return {
        shouldRetry: false,
        nextRetryAt: state.nextRetryAt,
        maxRetriesExceeded: false,
        error: `In backoff period until ${state.nextRetryAt.toISOString()}`,
      };
    }

    // Can retry
    const delayMs = this.calculateBackoffDelay(currentRetryCount);
    const nextRetryAt = new Date(Date.now() + delayMs);

    return {
      shouldRetry: true,
      nextRetryAt,
      maxRetriesExceeded: false,
    };
  }

  /**
   * Record a failed attempt
   */
  recordFailure(
    campaignTargetId: string,
    error: string
  ): RetryResult {
    const existingState = this.retryStates.get(campaignTargetId);
    const retryCount = (existingState?.retryCount ?? 0) + 1;

    const delayMs = this.calculateBackoffDelay(retryCount);
    const nextRetryAt = new Date(Date.now() + delayMs);

    const state: RetryState = {
      campaignTargetId,
      retryCount,
      lastAttempt: new Date(),
      lastError: error,
      nextRetryAt,
    };

    this.retryStates.set(campaignTargetId, state);

    return {
      shouldRetry: retryCount < this.config.maxRetries,
      nextRetryAt,
      maxRetriesExceeded: retryCount >= this.config.maxRetries,
      error,
    };
  }

  /**
   * Record a successful send (clears retry state)
   */
  recordSuccess(campaignTargetId: string): void {
    this.retryStates.delete(campaignTargetId);
  }

  /**
   * Get retry state for a target
   */
  getState(campaignTargetId: string): RetryState | null {
    return this.retryStates.get(campaignTargetId) ?? null;
  }

  /**
   * Get all targets that are ready for retry
   */
  getReadyForRetry(targets: ScheduledTarget[]): ScheduledTarget[] {
    return targets.filter(target => {
      if (target.status !== 'retrying' && target.status !== 'scheduled') {
        return false;
      }

      const state = this.retryStates.get(target.campaignTargetId);
      if (!state?.nextRetryAt) {
        return true; // No retry scheduled, can try now
      }

      return new Date() >= state.nextRetryAt;
    });
  }

  /**
   * Clear retry state (manual intervention)
   */
  clearRetry(campaignTargetId: string): void {
    this.retryStates.delete(campaignTargetId);
  }

  /**
   * Clear all retry states (for campaign pause/cancel)
   */
  clearAll(campaignId?: string): void {
    if (!campaignId) {
      this.retryStates.clear();
      return;
    }
    // Only clear for specific campaign - not implemented here
    // Would need target -> campaign mapping
  }

  /**
   * Get retry statistics
   */
  getStats(): {
    totalInRetry: number;
    byRetryCount: Map<number, number>;
    oldestRetry: Date | null;
  } {
    const byRetryCount = new Map<number, number>();
    let oldestRetry: Date | null = null;

    for (const state of this.retryStates.values()) {
      const count = byRetryCount.get(state.retryCount) ?? 0;
      byRetryCount.set(state.retryCount, count + 1);

      if (!oldestRetry || (state.nextRetryAt && state.nextRetryAt < oldestRetry)) {
        oldestRetry = state.nextRetryAt ?? null;
      }
    }

    return {
      totalInRetry: this.retryStates.size,
      byRetryCount,
      oldestRetry,
    };
  }

  /**
   * Calculate backoff delay with exponential increase
   */
  private calculateBackoffDelay(retryCount: number): number {
    // Base delay * (multiplier ^ retryCount)
    // e.g., 30000ms * (2 ^ 1) = 60000ms, * (2 ^ 2) = 120000ms
    const delay = this.config.retryDelayMs * Math.pow(this.config.retryBackoffMultiplier, retryCount);
    // Cap at 5 minutes
    return Math.min(delay, 300000);
  }

  /**
   * Check if a target has exceeded max retries
   */
  hasExceededMaxRetries(target: ScheduledTarget): boolean {
    const state = this.retryStates.get(target.campaignTargetId);
    const currentRetryCount = state?.retryCount ?? target.retryCount;
    return currentRetryCount >= this.config.maxRetries;
  }

  /**
   * Get remaining retries for a target
   */
  getRemainingRetries(target: ScheduledTarget): number {
    const state = this.retryStates.get(target.campaignTargetId);
    const currentRetryCount = state?.retryCount ?? target.retryCount;
    return Math.max(0, this.config.maxRetries - currentRetryCount);
  }
}

/**
 * RetryPolicy - Defines retry behavior
 */
export enum RetryPolicy {
  // Retry immediately, up to max retries
  IMMEDIATE = 'immediate',

  // Wait between retries (exponential backoff)
  EXPONENTIAL = 'exponential',

  // Fixed delay between retries
  FIXED = 'fixed',

  // No retries
  NONE = 'none',
}

/**
 * Create a retry manager with default config
 */
export function createRetryManager(config: SchedulerConfig): RetryManager {
  return new RetryManager(config);
}
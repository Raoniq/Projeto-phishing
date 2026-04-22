// workers/scheduler/stagger.ts — Staggered sending logic (anti-detection)
import type { SchedulerConfig, ScheduledTarget } from './types';
import { isWithinBusinessHours, getNextBusinessWindow } from './timezone';

interface StaggerStats {
  totalProcessed: number;
  totalSent: number;
  totalSkipped: number;
  totalDelayed: number;
  avgLatencyMs: number;
}

/**
 * StaggerCalculator - Calculates staggered send times for a batch of targets
 *
 * Key concepts:
 * - Anti-detection: Spread sends to avoid burst patterns
 * - Rate limiting: 100 emails/min default (configurable)
 * - Business hours: Respect local business hours of each target
 */
export class StaggerCalculator {
  private config: SchedulerConfig;
  private sendTimes: Map<string, Date> = new Map();

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  /**
   * Calculate staggered schedule for a list of targets
   * Returns targets with their scheduled UTC times
   */
  calculateSchedule(
    targets: Array<{
      id: string;
      campaignId: string;
      email: string;
      timezone: string;
      localScheduledTime?: string; // Optional local time preference
    }>,
    baseTime: Date
  ): ScheduledTarget[] {
    const scheduled: ScheduledTarget[] = [];
    const intervalMs = this.config.staggerIntervalMs; // e.g., 600ms for 100/min

    // Sort targets by timezone (group by similar timezones for efficiency)
    const sortedTargets = [...targets].sort((a, b) => {
      // Prioritize targets in earlier timezones (earlier local times)
      const aOffset = this.getTimezoneOffset(a.timezone);
      const bOffset = this.getTimezoneOffset(b.timezone);
      return aOffset - bOffset;
    });

    let currentOffset = 0;

    for (const target of sortedTargets) {
      // Check if within business hours for this target's timezone
      const targetBaseTime = new Date(baseTime.getTime() + currentOffset);

      if (!isWithinBusinessHours(targetBaseTime, target.timezone, this.config)) {
        // Find next business window
        const nextWindow = getNextBusinessWindow(baseTime, target.timezone, this.config);
        if (nextWindow) {
          // Add to scheduled with next business window
          scheduled.push({
            campaignTargetId: target.id,
            campaignId: target.campaignId,
            email: target.email,
            scheduledUtc: nextWindow,
            localTime: this.formatLocalTime(nextWindow, target.timezone),
            timezone: target.timezone,
            retryCount: 0,
            status: 'scheduled',
          });
        } else {
          // No business window found, schedule anyway but flag
          scheduled.push({
            campaignTargetId: target.id,
            campaignId: target.campaignId,
            email: target.email,
            scheduledUtc: targetBaseTime,
            localTime: this.formatLocalTime(targetBaseTime, target.timezone),
            timezone: target.timezone,
            retryCount: 0,
            status: 'scheduled',
          });
        }
      } else {
        // Within business hours, add with stagger
        const scheduledTime = new Date(baseTime.getTime() + currentOffset);
        scheduled.push({
          campaignTargetId: target.id,
          campaignId: target.campaignId,
          email: target.email,
          scheduledUtc: scheduledTime,
          localTime: this.formatLocalTime(scheduledTime, target.timezone),
          timezone: target.timezone,
          retryCount: 0,
          status: 'scheduled',
        });

        // Add stagger interval
        currentOffset += intervalMs;
      }
    }

    return scheduled;
  }

  /**
   * Get targets that are due to be sent (based on current time)
   */
  getDueTargets(scheduled: ScheduledTarget[], currentTime: Date = new Date()): ScheduledTarget[] {
    return scheduled.filter(target => {
      if (target.status !== 'scheduled') return false;
      return target.scheduledUtc <= currentTime;
    });
  }

  /**
   * Get targets that are still pending (not yet due)
   */
  getPendingTargets(scheduled: ScheduledTarget[], currentTime: Date = new Date()): ScheduledTarget[] {
    return scheduled.filter(target => {
      if (target.status !== 'scheduled') return false;
      return target.scheduledUtc > currentTime;
    });
  }

  /**
   * Calculate estimated completion time for a batch
   */
  estimateCompletionTime(targetCount: number): {
    minTime: Date;
    maxTime: Date;
    avgEmailsPerMinute: number;
  } {
    const intervalMs = this.config.staggerIntervalMs;
    const emailsPerMinute = 60000 / intervalMs;

    const minTime = new Date(Date.now() + intervalMs * targetCount);
    const maxTime = new Date(Date.now() + intervalMs * targetCount * 1.5); // 50% buffer

    return {
      minTime,
      maxTime,
      avgEmailsPerMinute: emailsPerMinute,
    };
  }

  /**
   * Calculate stagger statistics
   */
  calculateStats(scheduled: ScheduledTarget[]): StaggerStats {
    const sent = scheduled.filter(t => t.status === 'sent');
    const skipped = scheduled.filter(t =>
      t.status === 'scheduled' || t.status === 'retrying'
    );
    const delayed = scheduled.filter(t =>
      !isWithinBusinessHours(t.scheduledUtc, t.timezone, this.config)
    );

    return {
      totalProcessed: sent.length,
      totalSent: sent.length,
      totalSkipped: skipped.length,
      totalDelayed: delayed.length,
      avgLatencyMs: this.config.staggerIntervalMs,
    };
  }

  /**
   * Sort targets by priority (for queue processing)
   */
  sortByPriority(
    targets: ScheduledTarget[],
    priorities: Map<string, number>
  ): ScheduledTarget[] {
    return [...targets].sort((a, b) => {
      const pA = priorities.get(a.campaignTargetId) ?? 50;
      const pB = priorities.get(b.campaignTargetId) ?? 50;
      return pB - pA; // Higher priority first
    });
  }

  private getTimezoneOffset(timezone: string): number {
    // Simplified offset lookup
    const offsets: Record<string, number> = {
      'America/Sao_Paulo': -180,
      'America/New_York': -300,
      'America/Chicago': -360,
      'America/Denver': -420,
      'America/Los_Angeles': -480,
      'Europe/London': 0,
      'Europe/Paris': 60,
      'Europe/Berlin': 60,
      'Asia/Tokyo': 540,
      'Asia/Shanghai': 480,
      'Asia/Singapore': 480,
      'Asia/Seoul': 540,
      'Asia/Kolkata': 330,
      'Asia/Dubai': 240,
      'Asia/Bangkok': 420,
      'Australia/Sydney': 600,
      'Pacific/Auckland': 720,
      'UTC': 0,
    };
    return offsets[timezone] ?? 0;
  }

  private formatLocalTime(utcTime: Date, timezone: string): string {
    const offset = this.getTimezoneOffset(timezone);
    const localTime = new Date(utcTime.getTime() + (offset * 60 * 1000));
    const hours = localTime.getUTCHours().toString().padStart(2, '0');
    const minutes = localTime.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

/**
 * RateLimiter - Tracks and enforces rate limits
 */
export class RateLimiter {
  private config: SchedulerConfig;
  private minuteCount: number = 0;
  private minuteResetAt: number = 0;
  private hourCount: number = 0;
  private hourResetAt: number = 0;
  private dayCount: number = 0;
  private dayResetAt: number = 0;

  constructor(config: SchedulerConfig) {
    this.config = config;
    this.resetCounters();
  }

  private resetCounters(): void {
    const now = Date.now();
    const minuteMs = 60000;
    const hourMs = 3600000;
    const dayMs = 86400000;

    this.minuteCount = 0;
    this.minuteResetAt = now + minuteMs;
    this.hourCount = 0;
    this.hourResetAt = now + hourMs;
    this.dayCount = 0;
    this.dayResetAt = now + dayMs;
  }

  /**
   * Check if we can send (rate limit check)
   */
  canSend(): { allowed: boolean; reason?: string; waitMs?: number } {
    const now = Date.now();

    // Reset counters if window expired
    if (now >= this.minuteResetAt) {
      this.minuteCount = 0;
      this.minuteResetAt = now + 60000;
    }
    if (now >= this.hourResetAt) {
      this.hourCount = 0;
      this.hourResetAt = now + 3600000;
    }
    if (now >= this.dayResetAt) {
      this.dayCount = 0;
      this.dayResetAt = now + 86400000;
    }

    // Check limits
    if (this.minuteCount >= this.config.maxEmailsPerMinute) {
      return {
        allowed: false,
        reason: 'Minute limit exceeded',
        waitMs: this.minuteResetAt - now
      };
    }

    if (this.hourCount >= this.config.maxEmailsPerHour) {
      return {
        allowed: false,
        reason: 'Hour limit exceeded',
        waitMs: this.hourResetAt - now
      };
    }

    if (this.dayCount >= this.config.maxEmailsPerDay) {
      return {
        allowed: false,
        reason: 'Day limit exceeded',
        waitMs: this.dayResetAt - now
      };
    }

    return { allowed: true };
  }

  /**
   * Record a send (increment counters)
   */
  recordSend(): void {
    this.minuteCount++;
    this.hourCount++;
    this.dayCount++;
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    minute: { used: number; max: number; resetInMs: number };
    hour: { used: number; max: number; resetInMs: number };
    day: { used: number; max: number; resetInMs: number };
    canSend: boolean;
  } {
    const now = Date.now();
    return {
      minute: {
        used: this.minuteCount,
        max: this.config.maxEmailsPerMinute,
        resetInMs: Math.max(0, this.minuteResetAt - now),
      },
      hour: {
        used: this.hourCount,
        max: this.config.maxEmailsPerHour,
        resetInMs: Math.max(0, this.hourResetAt - now),
      },
      day: {
        used: this.dayCount,
        max: this.config.maxEmailsPerDay,
        resetInMs: Math.max(0, this.dayResetAt - now),
      },
      canSend: this.canSend().allowed,
    };
  }
}

// Export singleton instances
export function createStaggerCalculator(config: SchedulerConfig): StaggerCalculator {
  return new StaggerCalculator(config);
}

export function createRateLimiter(config: SchedulerConfig): RateLimiter {
  return new RateLimiter(config);
}
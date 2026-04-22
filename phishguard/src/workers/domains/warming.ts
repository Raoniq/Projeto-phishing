// src/workers/domains/warming.ts
// Domain warming schedule management
import { createAdminClient } from '../_lib/supabase-admin';
import type { DomainWarmingSchedule } from './types';
import { WARMING_DURATION, WARMING_VOLUME_SCHEDULE } from './types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export type WarmingPhase = 'cold' | 'warmup' | 'active' | 'rotating';

/**
 * Initialize warming schedule for a newly added domain
 */
export async function initializeWarmingSchedule(
  domainId: string,
  env: Env
): Promise<DomainWarmingSchedule> {
  const supabase = createAdminClient(env);

  const now = new Date();
  const warmupEnd = new Date(now);
  warmupEnd.setDate(warmupEnd.getDate() + WARMING_DURATION.WARMUP_END);

  const activeEnd = new Date(now);
  activeEnd.setDate(activeEnd.getDate() + WARMING_DURATION.ACTIVE_END);

  const schedule: DomainWarmingSchedule = {
    domainId,
    startedAt: now.toISOString(),
    phase: 'cold',
    dailyVolume: 0,
    targetVolume: 500, // Target 500 emails/day after warming
    nextWarmingStep: getNextWarmingStep(now, WARMING_VOLUME_SCHEDULE[0]),
    expectedActiveDate: activeEnd.toISOString(),
  };

  // Update domain with warming schedule
  await supabase
    .from('isca_domains')
    .update({
      warming_schedule: schedule,
      health: 'warming',
      updated_at: now.toISOString(),
    })
    .eq('id', domainId);

  return schedule;
}

/**
 * Progress warming for a domain based on elapsed time
 */
export async function progressWarming(
  domainId: string,
  env: Env
): Promise<{
  updated: boolean;
  newPhase?: WarmingPhase;
  suggestedVolume?: number;
}> {
  const supabase = createAdminClient(env);

  const { data: domain, error } = await supabase
    .from('isca_domains')
    .select('*')
    .eq('id', domainId)
    .single();

  if (error || !domain || !domain.warming_schedule) {
    return { updated: false };
  }

  const schedule = domain.warming_schedule as DomainWarmingSchedule;
  const startedAt = new Date(schedule.startedAt);
  const daysSinceStart = Math.floor(
    (Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const previousPhase = schedule.phase;
  let newPhase = schedule.phase;
  let newVolume = schedule.dailyVolume;

  // Determine new phase based on days elapsed
  if (daysSinceStart >= WARMING_DURATION.ACTIVE_END) {
    newPhase = 'rotating';
    newVolume = schedule.targetVolume;
  } else if (daysSinceStart >= WARMING_DURATION.WARMUP_END) {
    newPhase = 'active';
    newVolume = 200;
  } else if (daysSinceStart >= 3) {
    newPhase = 'warmup';
    // Find appropriate volume for this day
    const volumeEntry = WARMING_VOLUME_SCHEDULE.reduce((prev, curr) =>
      daysSinceStart >= curr.day ? curr : prev
    );
    newVolume = volumeEntry.volume;
  }

  // Check if phase changed
  if (newPhase !== previousPhase) {
    await supabase
      .from('isca_domains')
      .update({
        warming_schedule: {
          ...schedule,
          phase: newPhase,
          dailyVolume: newVolume,
          nextWarmingStep: getNextWarmingStep(new Date(), { day: daysSinceStart, volume: newVolume }),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', domainId);

    return {
      updated: true,
      newPhase,
      suggestedVolume: newVolume,
    };
  }

  return { updated: false };
}

/**
 * Get recommended volume for a domain based on warming phase
 */
export function getRecommendedVolume(phase: WarmingPhase, dayOfWarming: number): number {
  if (phase === 'cold') return 0;
  if (phase === 'rotating') return 500;
  if (phase === 'active') return 200;

  // warmup phase - use schedule
  const entry = WARMING_VOLUME_SCHEDULE.reduce((prev, curr) =>
    dayOfWarming >= curr.day ? curr : prev
  );
  return entry.volume;
}

/**
 * Calculate days in current warming phase
 */
export function getDaysInPhase(schedule: DomainWarmingSchedule): number {
  const startedAt = new Date(schedule.startedAt);
  return Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get next warming step description
 */
function getNextWarmingStep(
  currentDate: Date,
  currentEntry: { day: number; volume: number }
): string {
  // Find next entry in schedule
  const nextEntry = WARMING_VOLUME_SCHEDULE.find(e => e.day > currentEntry.day);
  if (!nextEntry) {
    return `Domínio atingirá volume máximo de ${currentEntry.volume} emails/dia`;
  }

  const daysUntilNext = nextEntry.day - currentEntry.day;
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + daysUntilNext);

  return `Aumentar para ${nextEntry.volume} emails/dia em ${daysUntilNext} dias (${nextDate.toLocaleDateString('pt-BR')})`;
}

/**
 * Bulk initialize warming for multiple domains
 */
export async function bulkInitializeWarming(
  domainIds: string[],
  env: Env
): Promise<{
  initialized: number;
  failed: string[];
}> {
  const failed: string[] = [];

  for (const domainId of domainIds) {
    try {
      await initializeWarmingSchedule(domainId, env);
    } catch (error) {
      console.error(`Failed to initialize warming for domain ${domainId}:`, error);
      failed.push(domainId);
    }
  }

  return {
    initialized: domainIds.length - failed.length,
    failed,
  };
}

/**
 * Get warming status summary for a company
 */
export async function getWarmingSummary(
  companyId: string,
  env: Env
): Promise<{
  cold: number;
  warmup: number;
  active: number;
  rotating: number;
  readyForUse: number;
}> {
  const supabase = createAdminClient(env);

  const { data: domains } = await supabase
    .from('isca_domains')
    .select('warming_schedule')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (!domains || domains.length === 0) {
    return { cold: 0, warmup: 0, active: 0, rotating: 0, readyForUse: 0 };
  }

  const counts = { cold: 0, warmup: 0, active: 0, rotating: 0, readyForUse: 0 };

  for (const domain of domains) {
    if (!domain.warming_schedule) {
      counts.cold++;
    } else {
      const schedule = domain.warming_schedule as DomainWarmingSchedule;
      counts[schedule.phase as keyof typeof counts]++;
      if (schedule.phase === 'active' || schedule.phase === 'rotating') {
        counts.readyForUse++;
      }
    }
  }

  return counts;
}
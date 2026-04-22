// workers/scheduler/timezone.ts — Timezone utilities for scheduled sends
import type { SchedulerConfig } from './types';

/**
 * Common timezone mappings for IANA timezones
 * Maps our simplified timezone names to IANA format
 */
export const TIMEZONE_MAP: Record<string, string> = {
  // Americas
  'America/Sao_Paulo': 'America/Sao_Paulo',
  'America/New_York': 'America/New_York',
  'America/Chicago': 'America/Chicago',
  'America/Denver': 'America/Denver',
  'America/Los_Angeles': 'America/Los_Angeles',
  'America/Mexico_City': 'America/Mexico_City',
  'America/Bogota': 'America/Bogota',
  'America/Lima': 'America/Lima',
  'America/Santiago': 'America/Santiago',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',

  // Europe
  'Europe/London': 'Europe/London',
  'Europe/Paris': 'Europe/Paris',
  'Europe/Berlin': 'Europe/Berlin',
  'Europe/Madrid': 'Europe/Madrid',
  'Europe/Rome': 'Europe/Rome',
  'Europe/Amsterdam': 'Europe/Amsterdam',
  'Europe/Brussels': 'Europe/Brussels',
  'Europe/Vienna': 'Europe/Vienna',
  'Europe/Warsaw': 'Europe/Warsaw',
  'Europe/Prague': 'Europe/Prague',
  'Europe/Stockholm': 'Europe/Stockholm',
  'Europe/Oslo': 'Europe/Oslo',
  'Europe/Helsinki': 'Europe/Helsinki',
  'Europe/Moscow': 'Europe/Moscow',

  // Asia
  'Asia/Tokyo': 'Asia/Tokyo',
  'Asia/Shanghai': 'Asia/Shanghai',
  'Asia/Hong_Kong': 'Asia/Hong_Kong',
  'Asia/Singapore': 'Asia/Singapore',
  'Asia/Seoul': 'Asia/Seoul',
  'Asia/Mumbai': 'Asia/Kolkata',
  'Asia/Dubai': 'Asia/Dubai',
  'Asia/Bangkok': 'Asia/Bangkok',
  'Asia/Jakarta': 'Asia/Jakarta',

  // Pacific
  'Pacific/Sydney': 'Australia/Sydney',
  'Pacific/Melbourne': 'Australia/Melbourne',
  'Pacific/Auckland': 'Pacific/Auckland',

  // UTC
  'UTC': 'UTC',
};

/**
 * Parse timezone string to IANA format
 */
export function normalizeTimezone(tz: string): string {
  // If already in IANA format, return as-is
  if (TIMEZONE_MAP[tz]) {
    return TIMEZONE_MAP[tz];
  }
  // Try exact match
  if (tz in TIMEZONE_MAP) {
    return tz;
  }
  // Return as-is (might be valid IANA)
  return tz;
}

/**
 * Get current time in a specific timezone
 */
export function getCurrentTimeInTimezone(_timezone: string): Date {
  // normalized timezone deferred
  // Use Intl.DateTimeFormat to get current time in timezone
  // Cloudflare Workers doesn't support full TZ database, so we calculate offset manually
  const offsetMinutes = getTimezoneOffset(normalized);
  const now = Date.now();
  const localNow = now + (offsetMinutes * 60 * 1000);
  return new Date(localNow);
}

/**
 * Get timezone offset in minutes from UTC
 * This is a simplified implementation for common timezones
 */
export function getTimezoneOffset(timezone: string): number {
  // Use a lookup table for common timezones
  const offsets: Record<string, number> = {
    'America/Sao_Paulo': -180,  // UTC-3
    'America/New_York': -300,     // UTC-5
    'America/Chicago': -360,       // UTC-6
    'America/Denver': -420,       // UTC-7
    'America/Los_Angeles': -480,   // UTC-8
    'America/Mexico_City': -360,   // UTC-6
    'America/Bogota': -300,        // UTC-5
    'America/Lima': -300,          // UTC-5
    'America/Santiago': -180,      // UTC-3
    'America/Argentina/Buenos_Aires': -180, // UTC-3
    'Europe/London': 0,            // UTC+0
    'Europe/Paris': 60,            // UTC+1
    'Europe/Berlin': 60,           // UTC+1
    'Europe/Madrid': 60,           // UTC+1
    'Europe/Rome': 60,             // UTC+1
    'Europe/Amsterdam': 60,        // UTC+1
    'Europe/Brussels': 60,         // UTC+1
    'Europe/Vienna': 60,           // UTC+1
    'Europe/Warsaw': 60,           // UTC+1
    'Europe/Prague': 60,           // UTC+1
    'Europe/Stockholm': 60,        // UTC+1
    'Europe/Oslo': 60,            // UTC+1
    'Europe/Helsinki': 120,        // UTC+2
    'Europe/Moscow': 180,          // UTC+3
    'Asia/Tokyo': 540,            // UTC+9
    'Asia/Shanghai': 480,         // UTC+8
    'Asia/Hong_Kong': 480,        // UTC+8
    'Asia/Singapore': 480,         // UTC+8
    'Asia/Seoul': 540,            // UTC+9
    'Asia/Kolkata': 330,          // UTC+5:30
    'Asia/Dubai': 240,            // UTC+4
    'Asia/Bangkok': 420,           // UTC+7
    'Asia/Jakarta': 420,           // UTC+7
    'Australia/Sydney': 600,      // UTC+10
    'Australia/Melbourne': 600,   // UTC+10
    'Pacific/Auckland': 720,      // UTC+12
    'UTC': 0,
  };

  return offsets[timezone] ?? 0;
}

/**
 * Convert a local time to UTC
 */
export function localToUtc(localTime: string, _timezone: string): Date {
  // normalized timezone deferred
  const offsetMinutes = getTimezoneOffset(normalized);

  // Parse local time (format: "YYYY-MM-DDTHH:mm" or "HH:mm")
  const now = new Date();
  let localDate: Date;

  if (localTime.includes('T')) {
    localDate = new Date(localTime);
  } else {
    // Just time, use today
    const [hours, minutes] = localTime.split(':').map(Number);
    localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  }

  // Convert to UTC by subtracting offset
  const utcTime = localDate.getTime() - (offsetMinutes * 60 * 1000);
  return new Date(utcTime);
}

/**
 * Convert UTC time to local time in a timezone
 */
export function utcToLocal(utcTime: Date, _timezone: string): { time: string; offset: number } {
  // normalized timezone deferred
  const offsetMinutes = getTimezoneOffset(normalized);
  const localTime = utcTime.getTime() + (offsetMinutes * 60 * 1000);
  const date = new Date(localTime);

  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  return {
    time: `${hours}:${minutes}`,
    offset: offsetMinutes,
  };
}

/**
 * Check if a given time is within business hours
 */
export function isWithinBusinessHours(
  utcTime: Date,
  timezone: string,
  config: SchedulerConfig
): boolean {
  const { time, offset } = utcToLocal(utcTime, timezone);

  // Check day of week
  const localDate = new Date(utcTime.getTime() + (offset * 60 * 1000));
  const dayOfWeek = localDate.getUTCDay();

  if (!config.businessDays.includes(dayOfWeek)) {
    return false;
  }

  // Check time
  const [startHour, startMin] = config.businessHoursStart.split(':').map(Number);
  const [endHour, endMin] = config.businessHoursEnd.split(':').map(Number);
  const [currentHour, currentMin] = time.split(':').map(Number);

  const currentMinutes = currentHour * 60 + currentMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Get next business hours window start time
 * Returns the next available time within business hours, or null if none today
 */
export function getNextBusinessWindow(
  fromTime: Date,
  timezone: string,
  config: SchedulerConfig
): Date | null {
  // normalized timezone deferred
  let checkTime = new Date(fromTime);

  // Try up to 7 days
  for (let day = 0; day < 7; day++) {
    const { time, offset } = utcToLocal(checkTime, timezone);
    const localDate = new Date(checkTime.getTime() + (offset * 60 * 1000));
    const dayOfWeek = localDate.getUTCDay();

    if (config.businessDays.includes(dayOfWeek)) {
      const [startHour, startMin] = config.businessHoursStart.split(':').map(Number);
      const [currentHour, currentMin] = time.split(':').map(Number);
      const currentMinutes = currentHour * 60 + currentMin;
      const startMinutes = startHour * 60 + startMin;

      if (currentMinutes < startMinutes) {
        // Before business hours, return start of business hours
        const windowStart = new Date(checkTime.getTime());
        const [hours, mins] = config.businessHoursStart.split(':').map(Number);
        windowStart.setUTCHours(hours, mins, 0, 0);
        return windowStart;
      }

      const [endHour, endMin] = config.businessHoursEnd.split(':').map(Number);
      const endMinutes = endHour * 60 + endMin;

      if (currentMinutes <= endMinutes) {
        // Within business hours
        return new Date(checkTime.getTime());
      }
    }

    // Move to next day (midnight UTC)
    checkTime = new Date(checkTime.getTime() + 24 * 60 * 60 * 1000);
    checkTime.setUTCHours(0, 0, 0, 0);
  }

  return null; // No business window found in 7 days
}

/**
 * Format a date for logging
 */
export function formatLogTime(utcTime: Date, timezone: string): string {
  const { time, offset } = utcToLocal(utcTime, timezone);
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMins = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';

  return `${time} (${sign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')})`;
}
/**
 * Gamification System Types
 *
 * Armor Points, Streaks, Leaderboards, and Report Rewards
 */

import type { RealtimeChannel } from '@supabase/supabase-js'

// =============================================================================
// ARMOR POINTS
// =============================================================================

export interface ArmorPoints {
  total: number
  rank: number
  department_rank: number
  streak_count: number
  streak_multiplier: number
  last_activity_at: string | null
}

export interface PointsTransaction {
  id: string
  user_id: string
  amount: number
  type: PointsTransactionType
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

export type PointsTransactionType =
  | 'report_phishing'
  | 'training_complete'
  | 'quiz_passed'
  | 'streak_bonus'
  | 'department_contribution'
  | 'manual_adjustment'

// =============================================================================
// STREAK SYSTEM
// =============================================================================

export interface StreakData {
  current_streak: number
  longest_streak: number
  streak_multiplier: number
  last_activity_date: string | null
  streak_start_date: string | null
}

export const STREAK_MULTIPLIERS: Record<number, number> = {
  3: 1.1,   // 3 days = 1.1x
  5: 1.25,  // 5 days = 1.25x
  7: 1.5,   // 1 week = 1.5x
  14: 1.75, // 2 weeks = 1.75x
  30: 2.0,  // 1 month = 2x
}

export function calculateStreakMultiplier(streakDays: number): number {
  const multipliers = Object.entries(STREAK_MULTIPLIERS)
    .map(([days, multiplier]) => ({ days: parseInt(days), multiplier }))
    .sort((a, b) => b.days - a.days)

  for (const { days, multiplier } of multipliers) {
    if (streakDays >= days) return multiplier
  }
  return 1.0
}

// =============================================================================
// LEADERBOARD
// =============================================================================

export interface LeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  user_avatar: string | null
  department: string
  department_id: string
  points: number
  streak_count: number
  streak_multiplier: number
  is_current_user?: boolean
}

export interface DepartmentLeaderboardEntry {
  rank: number
  department_id: string
  department_name: string
  total_points: number
  member_count: number
  avg_points_per_member: number
  top_contributor_id: string | null
  top_contributor_name: string | null
  trend: 'up' | 'down' | 'stable'
  previous_rank?: number
}

export interface LeaderboardFilters {
  scope: 'global' | 'department'
  department_id?: string
  time_range: 'week' | 'month' | 'quarter' | 'all'
  limit: number
}

// =============================================================================
// REPORT REWARDS (ANTI-ABUSE)
// =============================================================================

export const REPORT_REWARDS = {
  BASE_POINTS: 50,
  MAX_REPORTS_PER_DAY: 5,
  MAX_POINTS_PER_DAY: 250,
  REPORT_WINDOW_HOURS: 24,
  MIN_TIME_BETWEEN_REPORTS_MINUTES: 5,
} as const

export interface ReportRewardResult {
  awarded: boolean
  points_earned: number
  reason?: string
  remaining_daily_reports: number
  remaining_daily_points: number
}

// =============================================================================
// REALTIME CHANNELS
// =============================================================================

export interface GamificationChannel {
  channel: RealtimeChannel
  unsubsribe: () => void
}

export type LeaderboardEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface LeaderboardEvent {
  type: LeaderboardEventType
  new: LeaderboardEntry | null
  old: LeaderboardEntry | null
}

export interface DepartmentEvent {
  type: LeaderboardEventType
  new: DepartmentLeaderboardEntry | null
  old: DepartmentLeaderboardEntry | null
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface LiveLeaderboardProps {
  tenantId: string
  scope?: 'global' | 'department'
  departmentId?: string
  limit?: number
  showStreaks?: boolean
  onEntryClick?: (userId: string) => void
}

export interface ArmorPointsBadgeProps {
  points: number
  size?: 'sm' | 'md' | 'lg'
  showRank?: boolean
  className?: string
}

export interface StreakIndicatorProps {
  streak: number
  multiplier: number
  compact?: boolean
  className?: string
}

export interface DepartmentCompetitionProps {
  tenantId: string
  myDepartmentId?: string
  maxDepartments?: number
}

// =============================================================================
// UTILITIES
// =============================================================================

export function formatPoints(points: number): string {
  if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`
  if (points >= 1000) return `${(points / 1000).toFixed(1)}K`
  return points.toLocaleString()
}

export function getRankSuffix(rank: number): string {
  const lastDigit = rank % 10
  const lastTwoDigits = rank % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return 'º'
  switch (lastDigit) {
    case 1: return 'º'
    case 2: return 'º'
    case 3: return 'º'
    default: return 'º'
  }
}

export function getMultiplierLabel(multiplier: number): string {
  if (multiplier >= 2) return `${multiplier.toFixed(1)}x`
  return `${multiplier.toFixed(2)}x`
}
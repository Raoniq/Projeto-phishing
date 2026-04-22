/**
 * Gamification Utilities
 *
 * Points calculations, streak logic, report reward validation
 */

import { supabase } from '@/lib/supabase'
import type {
  ArmorPoints,
  PointsTransaction,
  ReportRewardResult,
  StreakData,
} from './types'
import {
  REPORT_REWARDS,
  calculateStreakMultiplier,
} from './types'

// =============================================================================
// POINTS OPERATIONS
// =============================================================================

/**
 * Award points for a specific action.
 * Also creates a transaction record for audit.
 */
export async function awardPoints(
  userId: string,
  amount: number,
  type: PointsTransaction['type'],
  description: string,
  metadata: Record<string, unknown> = {}
): Promise<{ success: boolean; new_balance: number; transaction_id: string }> {
  // Use RPC to ensure atomic operation with transaction logging
  const { data, error } = await supabase.rpc('award_gamification_points', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
    p_metadata: metadata,
  })

  if (error) {
    console.error('Failed to award points:', error)
    return { success: false, new_balance: 0, transaction_id: '' }
  }

  return {
    success: true,
    new_balance: data.new_balance,
    transaction_id: data.transaction_id,
  }
}

// =============================================================================
// REPORT REWARD VALIDATION (ANTI-ABUSE)
// =============================================================================

/**
 * Check if user can claim report reward and calculate amount.
 * Implements anti-abuse rules:
 * - Max reports per day
 * - Max points per day
 * - Minimum time between reports
 */
export async function validateReportReward(
  userId: string
): Promise<ReportRewardResult> {
  const now = new Date()
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // Get user's recent report transactions
  const { data: recentReports, error } = await supabase
    .from('points_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'report_phishing')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch recent reports:', error)
    return {
      awarded: false,
      points_earned: 0,
      reason: 'Erro ao verificar histórico',
      remaining_daily_reports: 0,
      remaining_daily_points: 0,
    }
  }

  // Count today's reports
  const todayReports = recentReports?.filter(
    (r) => r.created_at >= todayStart
  ) ?? []

  // Check max reports per day
  if (todayReports.length >= REPORT_REWARDS.MAX_REPORTS_PER_DAY) {
    return {
      awarded: false,
      points_earned: 0,
      reason: `Limite de ${REPORT_REWARDS.MAX_REPORTS_PER_DAY} relatórios por dia atingido`,
      remaining_daily_reports: 0,
      remaining_daily_points: REPORT_REWARDS.MAX_POINTS_PER_DAY,
    }
  }

  // Check max points per day
  const todayPoints = todayReports.reduce((sum, r) => sum + r.amount, 0)
  if (todayPoints >= REPORT_REWARDS.MAX_POINTS_PER_DAY) {
    return {
      awarded: false,
      points_earned: 0,
      reason: 'Limite de pontos diários atingido',
      remaining_daily_reports: 0,
      remaining_daily_points: 0,
    }
  }

  // Check minimum time between reports (anti-spam)
  const lastReport = recentReports?.[0]
  if (lastReport) {
    const lastReportTime = new Date(lastReport.created_at)
    const minutesSinceLastReport = (Date.now() - lastReportTime.getTime()) / 60000
    if (minutesSinceLastReport < REPORT_REWARDS.MIN_TIME_BETWEEN_REPORTS_MINUTES) {
      return {
        awarded: false,
        points_earned: 0,
        reason: `Aguarde ${REPORT_REWARDS.MIN_TIME_BETWEEN_REPORTS_MINUTES} minutos entre relatórios`,
        remaining_daily_reports: REPORT_REWARDS.MAX_REPORTS_PER_DAY - todayReports.length,
        remaining_daily_points: REPORT_REWARDS.MAX_POINTS_PER_DAY - todayPoints,
      }
    }
  }

  // All checks passed - calculate points with streak multiplier
  const streakData = await getStreakData(userId)
  const multiplier = streakData.streak_multiplier
  const finalPoints = Math.round(REPORT_REWARDS.BASE_POINTS * multiplier)

  return {
    awarded: true,
    points_earned: finalPoints,
    remaining_daily_reports: REPORT_REWARDS.MAX_REPORTS_PER_DAY - todayReports.length - 1,
    remaining_daily_points: REPORT_REWARDS.MAX_POINTS_PER_DAY - todayPoints - finalPoints,
  }
}

/**
 * Process a phishing report and award points if valid.
 * This is the main entry point for report reward logic.
 */
export async function processPhishingReport(
  userId: string,
  reportMetadata: Record<string, unknown> = {}
): Promise<ReportRewardResult> {
  // First validate
  const validation = await validateReportReward(userId)
  if (!validation.awarded) return validation

  // Award points
  const result = await awardPoints(
    userId,
    validation.points_earned,
    'report_phishing',
    `Relatório de phishing ${validation.points_earned > REPORT_REWARDS.BASE_POINTS ? '(com bônus de streak)' : ''}`,
    { ...reportMetadata, base_points: REPORT_REWARDS.BASE_POINTS }
  )

  if (!result.success) {
    return {
      awarded: false,
      points_earned: 0,
      reason: 'Erro ao processar relatório',
      remaining_daily_reports: validation.remaining_daily_reports,
      remaining_daily_points: validation.remaining_daily_points,
    }
  }

  // Update streak (fire and forget)
  updateStreak(userId).catch(console.error)

  return validation
}

// =============================================================================
// STREAK MANAGEMENT
// =============================================================================

/**
 * Get current streak data for a user.
 */
export async function getStreakData(userId: string): Promise<StreakData> {
  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return {
      current_streak: 0,
      longest_streak: 0,
      streak_multiplier: 1.0,
      last_activity_date: null,
      streak_start_date: null,
    }
  }

  const streakDays = calculateStreakDays(data.last_activity_date)
  const multiplier = calculateStreakMultiplier(streakDays)

  return {
    current_streak: streakDays,
    longest_streak: data.longest_streak ?? 0,
    streak_multiplier: multiplier,
    last_activity_date: data.last_activity_date,
    streak_start_date: data.streak_start_date,
  }
}

/**
 * Update user's streak after activity.
 */
export async function updateStreak(userId: string): Promise<StreakData> {
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    // Create new streak record
    await supabase.from('user_streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      streak_start_date: today,
    })
  } else {
    const lastDate = existing.last_activity_date
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (lastDate === today) {
      // Already activity today, no change
      return await getStreakData(userId)
    } else if (lastDate === yesterday) {
      // Consecutive day - increment streak
      const newStreak = existing.current_streak + 1
      await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, existing.longest_streak ?? 0),
          last_activity_date: today,
        })
        .eq('user_id', userId)
    } else {
      // Streak broken - reset
      await supabase
        .from('user_streaks')
        .update({
          current_streak: 1,
          last_activity_date: today,
          streak_start_date: today,
        })
        .eq('user_id', userId)
    }
  }

  return await getStreakData(userId)
}

/**
 * Calculate streak days from last activity date.
 */
function calculateStreakDays(lastActivityDate: string | null): number {
  if (!lastActivityDate) return 0

  const last = new Date(lastActivityDate)
  const now = new Date()
  const diffTime = now.getTime() - last.getTime()
  const diffDays = Math.floor(diffTime / 86400000)

  // If more than 1 day gap, streak is 0
  if (diffDays > 1) return 0

  return diffDays === 0 ? 1 : diffDays + 1
}

// =============================================================================
// ARMOR POINTS FETCH
// =============================================================================

/**
 * Get full armor points data for a user.
 */
export async function getArmorPoints(userId: string): Promise<ArmorPoints> {
  const [streakData, rankData] = await Promise.all([
    getStreakData(userId),
    getUserRank(userId),
  ])

  return {
    total: rankData.total_points,
    rank: rankData.global_rank,
    department_rank: rankData.department_rank,
    streak_count: streakData.current_streak,
    streak_multiplier: streakData.streak_multiplier,
    last_activity_at: streakData.last_activity_date,
  }
}

/**
 * Get user's ranking data.
 */
async function getUserRank(userId: string): Promise<{
  total_points: number
  global_rank: number
  department_rank: number
}> {
  const { data: user } = await supabase
    .from('users')
    .select('department_id')
    .eq('id', userId)
    .single()

  if (!user) return { total_points: 0, global_rank: 0, department_rank: 0 }

  // Get global rank and total via RPC or direct query
  const { data: rankedUsers } = await supabase
    .from('user_armor_points')
    .select('user_id, total_points')
    .order('total_points', { ascending: false })

  if (!rankedUsers) return { total_points: 0, global_rank: 0, department_rank: 0 }

  const userIndex = rankedUsers.findIndex((u) => u.user_id === userId)
  const total_points = rankedUsers[userIndex]?.total_points ?? 0

  return {
    total_points,
    global_rank: userIndex + 1,
    department_rank: userIndex + 1, // Would need dept filter
  }
}
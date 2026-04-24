/**
 * Risk Scoring Engine
 *
 * Calculates employee risk scores based on:
 * - Department risk weight
 * - Role risk multiplier
 * - Phishing failure rate
 * - Time since last training
 * - Training completion rate
 */

import type { Employee, RiskScoringParams, RiskScoreResult, RiskTier, RiskBreakdown } from './types'

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Maximum days since training before reaching max risk score for that factor
 */
const TRAINING_MAX_DAYS = 180

/**
 * Risk tier thresholds
 */
export const RISK_TIERS: Record<RiskTier, { min: number; max: number }> = {
  critical: { min: 90, max: 100 },
  high: { min: 70, max: 89 },
  medium: { min: 40, max: 69 },
  low: { min: 0, max: 39 },
}

/**
 * Weights for each risk factor (must sum to 1.0)
 */
const WEIGHTS = {
  department_risk_weight: 0.3,
  role_risk_multiplier: 0.25,
  phishing_failure_rate: 0.3,
  time_since_last_training: 0.1,
  training_completion_rate: 0.1,
} as const

// =============================================================================
// RISK TIER DETERMINATION
// =============================================================================

export function getRiskTier(score: number): RiskTier {
  if (score >= 90) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

// =============================================================================
// NORMALIZATION HELPERS
// =============================================================================

/**
 * Normalize time since last training to 0-100 risk scale
 * 0 days = 0 risk, 180+ days = 100 risk
 */
export function normalizeTimeSinceTraining(days: number): number {
  return Math.min(100, (days / TRAINING_MAX_DAYS) * 100)
}

/**
 * Invert training completion rate to risk contribution
 * 100% completion = 0 risk, 0% completion = 100 risk
 */
export function invertTrainingCompletionRate(completionRate: number): number {
  return 100 - completionRate
}

// =============================================================================
// SCORE CALCULATION
// =============================================================================

/**
 * Calculate the weighted risk score from normalized inputs
 */
export function calculateWeightedScore(params: RiskScoringParams): number {
  const { department_risk_weight, role_risk_multiplier, phishing_failure_rate, time_since_last_training, training_completion_rate } = params

  // Normalize time since training to risk scale (0-100)
  const normalizedTimeRisk = normalizeTimeSinceTraining(time_since_last_training)

  // Invert training completion to risk (lower completion = higher risk)
  const invertedCompletionRisk = invertTrainingCompletionRate(training_completion_rate)

  // Calculate weighted sum
  const score =
    (department_risk_weight * WEIGHTS.department_risk_weight) +
    (role_risk_multiplier * WEIGHTS.role_risk_multiplier) +
    (phishing_failure_rate * WEIGHTS.phishing_failure_rate) +
    (normalizedTimeRisk * WEIGHTS.time_since_last_training) +
    (invertedCompletionRisk * WEIGHTS.training_completion_rate)

  // Round to 2 decimal places
  return Math.round(score * 100) / 100
}

/**
 * Generate detailed breakdown of risk score calculation
 */
export function generateBreakdown(params: RiskScoringParams): RiskBreakdown {
  const { department_risk_weight, role_risk_multiplier, phishing_failure_rate, time_since_last_training, training_completion_rate } = params

  const normalizedTimeRisk = normalizeTimeSinceTraining(time_since_last_training)
  const invertedCompletionRisk = invertTrainingCompletionRate(training_completion_rate)

  return {
    department_risk_weight: {
      value: department_risk_weight,
      weight: WEIGHTS.department_risk_weight,
      contribution: Math.round(department_risk_weight * WEIGHTS.department_risk_weight * 100) / 100,
    },
    role_risk_multiplier: {
      value: role_risk_multiplier,
      weight: WEIGHTS.role_risk_multiplier,
      contribution: Math.round(role_risk_multiplier * WEIGHTS.role_risk_multiplier * 100) / 100,
    },
    phishing_failure_rate: {
      value: phishing_failure_rate,
      weight: WEIGHTS.phishing_failure_rate,
      contribution: Math.round(phishing_failure_rate * WEIGHTS.phishing_failure_rate * 100) / 100,
    },
    time_since_last_training: {
      value: time_since_last_training,
      normalized_value: Math.round(normalizedTimeRisk * 100) / 100,
      weight: WEIGHTS.time_since_last_training,
      contribution: Math.round(normalizedTimeRisk * WEIGHTS.time_since_last_training * 100) / 100,
    },
    training_completion_rate: {
      value: training_completion_rate,
      inverted_value: invertedCompletionRisk,
      weight: WEIGHTS.training_completion_rate,
      contribution: Math.round(invertedCompletionRisk * WEIGHTS.training_completion_rate * 100) / 100,
    },
  }
}

// =============================================================================
// MAIN EXPORTED FUNCTION
// =============================================================================

/**
 * Calculate the risk score for an employee
 *
 * @param employee - Employee data (used for context, not calculation)
 * @param params - Risk scoring parameters
 * @returns Risk score result with tier and detailed breakdown
 */
export function calculateRiskScore(
  employee: Employee,
  params: RiskScoringParams
): RiskScoreResult {
  const score = calculateWeightedScore(params)
  const tier = getRiskTier(score)
  const breakdown = generateBreakdown(params)

  return {
    employee_id: employee.id,
    employee_email: employee.email,
    employee_name: employee.name,
    score,
    tier,
    breakdown,
    calculated_at: new Date().toISOString(),
  }
}

// =============================================================================
// TYPE EXPORTS (re-exported from types.ts for convenience)
// =============================================================================

export type { Employee, RiskScoringParams, RiskScoreResult, RiskTier, RiskBreakdown } from './types'

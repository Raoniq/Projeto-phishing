/**
 * Risk Scoring Types
 *
 * Type definitions for the employee risk scoring engine
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export type RiskTier = 'critical' | 'high' | 'medium' | 'low'

/**
 * Basic employee information for risk scoring context
 */
export interface Employee {
  id: string
  email: string
  name: string
  department_id?: string
  role_id?: string
}

/**
 * Parameters for calculating risk score
 * All numeric values should be on a 0-100 scale unless noted
 */
export interface RiskScoringParams {
  /**
   * Department risk weight (0-100)
   * Based on department's exposure to phishing attacks
   * Higher = more risky department
   */
  department_risk_weight: number

  /**
   * Role risk multiplier (0-100)
   * Based on role's access to sensitive data/systems
   * Higher = riskier role
   */
  role_risk_multiplier: number

  /**
   * Phishing failure rate (0-100)
   * Percentage of phishing simulations the employee has failed
   * Higher = more failures = riskier
   */
  phishing_failure_rate: number

  /**
   * Time since last training (in days)
   * How many days since employee completed security training
   * Higher = less recent training = riskier
   */
  time_since_last_training: number

  /**
   * Training completion rate (0-100)
   * Percentage of required training completed
   * Higher = more complete = less risky (will be inverted in calculation)
   */
  training_completion_rate: number
}

// =============================================================================
// BREAKDOWN TYPES
// =============================================================================

export interface RiskFactorContribution {
  value: number
  weight: number
  contribution: number
}

export interface RiskFactorContributionWithNormalization extends RiskFactorContribution {
  normalized_value: number
}

export interface RiskFactorContributionWithInversion extends RiskFactorContribution {
  inverted_value: number
}

export interface RiskBreakdown {
  department_risk_weight: RiskFactorContribution
  role_risk_multiplier: RiskFactorContribution
  phishing_failure_rate: RiskFactorContribution
  time_since_last_training: RiskFactorContributionWithNormalization
  training_completion_rate: RiskFactorContributionWithInversion
}

// =============================================================================
// RESULT TYPE
// =============================================================================

export interface RiskScoreResult {
  employee_id: string
  employee_email: string
  employee_name: string
  score: number
  tier: RiskTier
  breakdown: RiskBreakdown
  calculated_at: string
}

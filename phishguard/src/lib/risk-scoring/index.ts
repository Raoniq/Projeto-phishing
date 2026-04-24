/**
 * Risk Scoring Module
 *
 * Export all risk scoring functionality
 */

export { calculateRiskScore, getRiskTier, calculateWeightedScore, generateBreakdown } from './calculateRiskScore'
export type {
  Employee,
  RiskScoringParams,
  RiskScoreResult,
  RiskTier,
  RiskBreakdown,
} from './types'

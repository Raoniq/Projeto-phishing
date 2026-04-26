import { describe, it, expect } from 'vitest'
import {
  getRiskTier,
  normalizeTimeSinceTraining,
  invertTrainingCompletionRate,
  calculateWeightedScore,
  RISK_TIERS,
} from './calculateRiskScore'

describe('Risk Scoring Engine', () => {
  describe('getRiskTier', () => {
    it('returns critical for score >= 90', () => {
      expect(getRiskTier(90)).toBe('critical')
      expect(getRiskTier(95)).toBe('critical')
      expect(getRiskTier(100)).toBe('critical')
    })

    it('returns high for score >= 70 and < 90', () => {
      expect(getRiskTier(70)).toBe('high')
      expect(getRiskTier(80)).toBe('high')
      expect(getRiskTier(89)).toBe('high')
    })

    it('returns medium for score >= 40 and < 70', () => {
      expect(getRiskTier(40)).toBe('medium')
      expect(getRiskTier(55)).toBe('medium')
      expect(getRiskTier(69)).toBe('medium')
    })

    it('returns low for score < 40', () => {
      expect(getRiskTier(0)).toBe('low')
      expect(getRiskTier(20)).toBe('low')
      expect(getRiskTier(39)).toBe('low')
    })
  })

  describe('normalizeTimeSinceTraining', () => {
    it('returns 0 for 0 days', () => {
      expect(normalizeTimeSinceTraining(0)).toBe(0)
    })

    it('returns 100 for 180+ days', () => {
      expect(normalizeTimeSinceTraining(180)).toBe(100)
      expect(normalizeTimeSinceTraining(200)).toBe(100)
    })

    it('scales linearly between 0 and 180 days', () => {
      expect(normalizeTimeSinceTraining(90)).toBe(50)
      expect(normalizeTimeSinceTraining(45)).toBe(25)
    })
  })

  describe('invertTrainingCompletionRate', () => {
    it('inverts completion rate to risk', () => {
      expect(invertTrainingCompletionRate(100)).toBe(0)
      expect(invertTrainingCompletionRate(0)).toBe(100)
      expect(invertTrainingCompletionRate(50)).toBe(50)
    })
  })

  describe('calculateWeightedScore', () => {
    it('calculates weighted score correctly', () => {
      const params = {
        department_risk_weight: 50,
        role_risk_multiplier: 60,
        phishing_failure_rate: 70,
        time_since_last_training: 90,
        training_completion_rate: 80,
      }
      const score = calculateWeightedScore(params)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('returns a number rounded to 2 decimal places', () => {
      const params = {
        department_risk_weight: 33,
        role_risk_multiplier: 44,
        phishing_failure_rate: 55,
        time_since_last_training: 10,
        training_completion_rate: 20,
      }
      const score = calculateWeightedScore(params)
      // Check it has at most 2 decimal places
      expect(score.toString()).toMatch(/^\d+\.?\d{0,2}$/)
    })
  })

  describe('RISK_TIERS', () => {
    it('has correct thresholds for all tiers', () => {
      expect(RISK_TIERS.critical).toEqual({ min: 90, max: 100 })
      expect(RISK_TIERS.high).toEqual({ min: 70, max: 89 })
      expect(RISK_TIERS.medium).toEqual({ min: 40, max: 69 })
      expect(RISK_TIERS.low).toEqual({ min: 0, max: 39 })
    })

    it('tiers are contiguous (no gaps)', () => {
      expect(RISK_TIERS.low.max + 1).toBe(RISK_TIERS.medium.min)
      expect(RISK_TIERS.medium.max + 1).toBe(RISK_TIERS.high.min)
      expect(RISK_TIERS.high.max + 1).toBe(RISK_TIERS.critical.min)
    })
  })
})
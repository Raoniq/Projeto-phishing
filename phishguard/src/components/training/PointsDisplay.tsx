/* eslint-disable react-refresh/only-export-components */
/**
 * PointsDisplay Component
 *
 * Shows current points, level progress bar, and next level threshold.
 * Forensic Noir theme with amber/gold accents.
 */

import { motion } from 'motion/react'
import { Shield, Star, TrendingUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPoints } from '@/lib/gamification/types'

// Level thresholds for levels 1-10
export const LEVEL_THRESHOLDS = [
  0,      // Level 1 starts at 0
  100,    // Level 2: 100 pts
  300,    // Level 3: 300 pts
  600,    // Level 4: 600 pts
  1000,   // Level 5: 1000 pts
  1500,   // Level 6: 1500 pts
  2200,   // Level 7: 2200 pts
  3000,   // Level 8: 3000 pts
  4000,   // Level 9: 4000 pts
  5500,   // Level 10: 5500 pts
]

export interface PointsDisplayProps {
  points: number
  level?: number
  showLevelProgress?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  className?: string
}

export function getLevelFromPoints(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getNextLevelThreshold(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  return LEVEL_THRESHOLDS[level]
}

export function getPointsToNextLevel(points: number): number {
  const level = getLevelFromPoints(points)
  const nextThreshold = getNextLevelThreshold(level)
  return Math.max(0, nextThreshold - points)
}

export function getLevelProgress(points: number): number {
  const level = getLevelFromPoints(points)
  if (level >= LEVEL_THRESHOLDS.length) return 100
  
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level]
  const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  return Math.min(100, Math.max(0, progress))
}

const sizeClasses = {
  sm: {
    container: 'p-3',
    icon: 16,
    points: 'text-lg',
    level: 'text-xs',
    bar: 'h-1.5',
  },
  md: {
    container: 'p-4',
    icon: 20,
    points: 'text-2xl',
    level: 'text-sm',
    bar: 'h-2',
  },
  lg: {
    container: 'p-6',
    icon: 24,
    points: 'text-3xl',
    level: 'text-base',
    bar: 'h-2.5',
  },
  xl: {
    container: 'p-8',
    icon: 32,
    points: 'text-4xl',
    level: 'text-lg',
    bar: 'h-3',
  },
}

export function PointsDisplay({
  points,
  level,
  showLevelProgress = true,
  size = 'md',
  animated = true,
  className,
}: PointsDisplayProps) {
  const computedLevel = level ?? getLevelFromPoints(points)
  const progress = getLevelProgress(points)
  const nextThreshold = getNextLevelThreshold(computedLevel)
  const pointsToNext = getPointsToNextLevel(points)
  const classes = sizeClasses[size]

  const isMaxLevel = computedLevel >= LEVEL_THRESHOLDS.length

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)]',
        classes.container,
        className
      )}
    >
      {/* Main Points Display */}
      <div className="flex items-center gap-3">
        {/* Shield Icon with Glow */}
        <div className="relative">
          <div className={cn(
            'flex items-center justify-center rounded-xl',
            'bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-amber-400)]',
            'shadow-lg shadow-[var(--color-accent)]/30'
          )}>
            <Shield
              className="text-white"
              style={{ width: classes.icon, height: classes.icon }}
            />
          </div>
          {animated && (
            <div className="absolute inset-0 rounded-xl bg-[var(--color-accent)] opacity-30 blur-md animate-pulse" />
          )}
        </div>

        {/* Points & Level */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <motion.span
              animate={animated ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={cn(
                'font-display font-bold tabular-nums text-[var(--color-fg-primary)]',
                classes.points
              )}
            >
              {formatPoints(points)}
            </motion.span>
            <span className="text-xs text-[var(--color-fg-tertiary)]">pts</span>
          </div>
          
          {/* Level Badge */}
          <div className={cn(
            'mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5',
            'bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30'
          )}>
            <Star className="h-3 w-3 text-[var(--color-accent)]" />
            <span className={cn(
              'font-mono font-semibold text-[var(--color-accent)]',
              classes.level
            )}>
              Nível {computedLevel}
            </span>
          </div>
        </div>

        {/* Points to Next Level (compact) */}
        {!isMaxLevel && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-[var(--color-fg-tertiary)]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs">próximo</span>
            </div>
            <p className={cn(
              'font-mono font-semibold text-[var(--color-accent)]',
              classes.level
            )}>
              {formatPoints(nextThreshold)} pts
            </p>
          </div>
        )}

        {/* Max Level Indicator */}
        {isMaxLevel && (
          <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-warning)] px-3 py-1">
            <Zap className="h-4 w-4 text-white" />
            <span className="font-mono text-xs font-bold text-white">MÁXIMO</span>
          </div>
        )}
      </div>

      {/* Level Progress Bar */}
      {showLevelProgress && !isMaxLevel && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-[var(--color-fg-tertiary)]">
              Progresso para nível {computedLevel + 1}
            </span>
            <span className="font-mono text-xs text-[var(--color-fg-secondary)]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className={cn(
            'overflow-hidden rounded-full bg-[var(--color-surface-3)]',
            classes.bar
          )}>
            <motion.div
              initial={animated ? { width: 0 } : false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-amber-400)] shadow-lg shadow-[var(--color-accent)]/30"
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="font-mono text-xs text-[var(--color-fg-tertiary)]">
              {formatPoints(points)} pts
            </span>
            <span className="font-mono text-xs text-[var(--color-fg-tertiary)]">
              {formatPoints(pointsToNext)} pts para subir
            </span>
          </div>
        </div>
      )}

      {/* Max Level Celebration */}
      {showLevelProgress && isMaxLevel && (
        <div className="mt-4 rounded-lg bg-gradient-to-r from-[var(--color-accent-subtle)] to-[var(--color-warning-subtle)] p-3 text-center">
          <p className="text-sm font-medium text-[var(--color-accent)]">
            Você alcançou o nível máximo!
          </p>
          <p className="text-xs text-[var(--color-fg-tertiary)] mt-1">
            Continue mantendo sua sequência para ganhar pontos extras.
          </p>
        </div>
      )}
    </motion.div>
  )
}

// =============================================================================
// MINI POINTS BADGE (compact version for headers)
// =============================================================================

interface MiniPointsBadgeProps {
  points: number
  level?: number
  className?: string
}

export function MiniPointsBadge({ points, level, className }: MiniPointsBadgeProps) {
  const computedLevel = level ?? getLevelFromPoints(points)

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1',
        'bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30',
        className
      )}
    >
      <Shield className="h-3.5 w-3.5 text-[var(--color-accent)]" />
      <span className="font-mono text-sm font-semibold text-[var(--color-fg-primary)]">
        {formatPoints(points)}
      </span>
      <span className="font-mono text-xs text-[var(--color-fg-tertiary)]">
        LV{computedLevel}
      </span>
    </motion.div>
  )
}
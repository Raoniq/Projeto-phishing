/**
 * ArmorPointsBadge Component
 *
 * Displays armor points with optional rank.
 * Motivating visual design with shield icon.
 */

import { motion } from 'motion/react'
import { Shield, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPoints, getRankSuffix } from '@/lib/gamification/types'

type ArmorPointsBadgeProps = {
  points: number
  rank?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showIcon?: boolean
  showRank?: boolean
  showLabel?: boolean
  animated?: boolean
  className?: string
}

const sizeClasses = {
  sm: {
    badge: 'h-7 px-2 text-xs',
    icon: 14,
    points: 'text-sm',
    rank: 'text-[10px]',
  },
  md: {
    badge: 'h-9 px-3 text-sm',
    icon: 16,
    points: 'text-base',
    rank: 'text-xs',
  },
  lg: {
    badge: 'h-11 px-4 text-base',
    icon: 20,
    points: 'text-lg',
    rank: 'text-sm',
  },
  xl: {
    badge: 'h-14 px-5 text-lg',
    icon: 24,
    points: 'text-2xl',
    rank: 'text-base',
  },
}

export function ArmorPointsBadge({
  points,
  rank,
  size = 'md',
  showIcon = true,
  showRank = false,
  showLabel = false,
  animated = false,
  className,
}: ArmorPointsBadgeProps) {
  const classes = sizeClasses[size]

  const badgeContent = (
    <>
      {showIcon && (
        <Shield
          className="text-[var(--color-accent)] shrink-0"
          style={{ width: classes.icon, height: classes.icon }}
        />
      )}
      <span className={cn('font-mono font-bold tabular-nums text-[var(--color-fg-primary)]', classes.points)}>
        {formatPoints(points)}
      </span>
      {showLabel && (
        <span className="text-[var(--color-fg-tertiary)]">pts</span>
      )}
      {showRank && rank && (
        <span className={cn(
          'ml-1.5 rounded bg-[var(--color-surface-3)] px-1.5 py-0.5 font-mono text-[var(--color-fg-secondary)]',
          classes.rank
        )}>
          #{rank}{getRankSuffix(rank)}
        </span>
      )}
    </>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.3 }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent-subtle)] bg-[var(--color-accent-subtle)]',
          classes.badge,
          className
        )}
      >
        {badgeContent}
      </motion.div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent-subtle)] bg-[var(--color-accent-subtle)]',
        classes.badge,
        className
      )}
    >
      {badgeContent}
    </div>
  )
}

// =============================================================================
// ARMOR POINTS DISPLAY (extended version with breakdown)
// =============================================================================

interface ArmorPointsDisplayProps {
  points: number
  rank: number
  departmentRank: number
  streakCount: number
  multiplier: number
  className?: string
}

export function ArmorPointsDisplay({
  points,
  rank,
  departmentRank,
  streakCount,
  multiplier,
  className,
}: ArmorPointsDisplayProps) {
  return (
    <div className={cn('rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
            <Shield className="h-6 w-6 text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-fg-tertiary)]">Armor Points</p>
            <p className="font-display text-3xl font-bold tabular-nums text-[var(--color-fg-primary)]">
              {formatPoints(points)}
            </p>
          </div>
        </div>

        {streakCount > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-[var(--color-warning-subtle)] px-3 py-1.5">
            <Star className="h-4 w-4 text-[var(--color-warning)]" />
            <span className="font-mono text-sm font-medium text-[var(--color-warning)]">
              {streakCount}d
            </span>
            <span className="font-mono text-sm text-[var(--color-fg-tertiary)]">
              ×{multiplier.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-4 border-t border-[var(--color-surface-3)] pt-4">
        <div className="text-center">
          <p className="font-mono text-2xl font-medium text-[var(--color-fg-primary)]">#{rank}</p>
          <p className="text-xs text-[var(--color-fg-tertiary)]">Global</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-2xl font-medium text-[var(--color-fg-primary)]">#{departmentRank}</p>
          <p className="text-xs text-[var(--color-fg-tertiary)]">Dept.</p>
        </div>
        <div className="flex-1 text-center">
          <p className="font-mono text-2xl font-medium text-[var(--color-accent)]">
            +{Math.round(50 * multiplier)}
          </p>
          <p className="text-xs text-[var(--color-fg-tertiary)]">por relatório</p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MINI BADGE (for headers/nav)
// =============================================================================

interface MiniArmorBadgeProps {
  points: number
  className?: string
}

export function MiniArmorBadge({ points, className }: MiniArmorBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1',
        'bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]',
        className
      )}
    >
      <Shield className="h-3.5 w-3.5 text-[var(--color-accent)]" />
      <span className="font-mono text-xs font-medium text-[var(--color-fg-primary)]">
        {formatPoints(points)}
      </span>
    </div>
  )
}
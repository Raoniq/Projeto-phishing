/**
 * StreakIndicator Component
 *
 * Displays current streak with multiplier.
 * Motivating fire/heat visual metaphor.
 */

import { motion } from 'motion/react'
import { Flame, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMultiplierLabel, STREAK_MULTIPLIERS } from '@/lib/gamification/types'

type StreakIndicatorProps = {
  streak: number
  multiplier: number
  variant?: 'flame' | 'star' | 'badge'
  compact?: boolean
  animated?: boolean
  className?: string
}

export function StreakIndicator({
  streak,
  multiplier,
  variant = 'flame',
  compact = false,
  animated = true,
  className,
}: StreakIndicatorProps) {
  // No streak - don't show
  if (streak <= 0) return null

  const nextMilestone = Object.entries(STREAK_MULTIPLIERS)
    .map(([days]) => parseInt(days))
    .sort((a, b) => a - b)
    .find((days) => days > streak)

  if (compact) {
    return (
      <div className={cn('inline-flex items-center gap-1', className)}>
        <Flame className="h-3.5 w-3.5 text-[var(--color-warning)]" />
        <span className="font-mono text-xs font-medium text-[var(--color-fg-primary)]">
          {streak}
        </span>
        {multiplier > 1 && (
          <span className="font-mono text-xs text-[var(--color-warning)]">
            ×{getMultiplierLabel(multiplier)}
          </span>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={animated ? { scale: 0.9, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'relative rounded-lg border',
        variant === 'flame' && 'border-[var(--color-warning)] bg-[var(--color-warning-subtle)]',
        variant === 'star' && 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]',
        variant === 'badge' && 'border-[var(--color-surface-3)] bg-[var(--color-surface-2)]',
        compact ? 'px-2 py-1' : 'px-4 py-3',
        className
      )}
    >
      {/* Glow effect for high streaks */}
      {streak >= 7 && (
        <div className="absolute inset-0 rounded-lg bg-[var(--color-warning)] opacity-10 blur-md -z-10" />
      )}

      <div className="flex items-center gap-3">
        {/* Icon */}
        <motion.div
          animate={animated && streak >= 3 ? {
            scale: [1, 1.1, 1],
            filter: [
              'drop-shadow(0 0 0px var(--color-warning))',
              'drop-shadow(0 0 8px var(--color-warning))',
              'drop-shadow(0 0 0px var(--color-warning))',
            ],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            'flex items-center justify-center rounded-full',
            variant === 'flame' && 'bg-[var(--color-warning)] text-[var(--color-on-warning)]',
            variant === 'star' && 'bg-[var(--color-accent)] text-[var(--color-on-accent)]',
            variant === 'badge' && 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]',
            compact ? 'h-6 w-6' : 'h-10 w-10'
          )}
        >
          {variant === 'flame' && <Flame className={compact ? 'h-4 w-4' : 'h-5 w-5'} />}
          {variant === 'star' && <Star className={compact ? 'h-4 w-4' : 'h-5 w-5'} />}
          {variant === 'badge' && <Zap className={compact ? 'h-4 w-4' : 'h-5 w-5'} />}
        </motion.div>

        {/* Content */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <motion.span
              animate={animated ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5 }}
              className="font-display text-2xl font-bold tabular-nums text-[var(--color-fg-primary)]"
            >
              {streak}
            </motion.span>
            <span className="text-sm text-[var(--color-fg-tertiary)]">
              {streak === 1 ? 'dia' : 'dias'}
            </span>
          </div>

          {/* Multiplier badge */}
          {multiplier > 1 && (
            <motion.div
              initial={animated ? { x: -5, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              className={cn(
                'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5',
                streak >= 7 ? 'bg-[var(--color-warning)] text-[var(--color-on-warning)]' : 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]'
              )}
            >
              <Star className="h-3 w-3" />
              <span className="font-mono text-xs font-bold">
                ×{getMultiplierLabel(multiplier)}
              </span>
            </motion.div>
          )}
        </div>

        {/* Milestone indicator */}
        {nextMilestone && (
          <div className="ml-auto text-right">
            <p className="text-xs text-[var(--color-fg-tertiary)]">Próximo bônus</p>
            <p className="font-mono text-sm font-medium text-[var(--color-warning)]">
              {nextMilestone - streak}d
            </p>
          </div>
        )}
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-fg-tertiary)] mb-1">
            <span>{streak} dias</span>
            <span>{nextMilestone} dias</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(streak / nextMilestone) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                streak >= 7 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-accent)]'
              )}
            />
          </div>
        </div>
      )}

      {/* Streak fire animation for high streaks */}
      {streak >= 14 && (
        <div className="absolute -top-1 -right-1">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Star className="h-4 w-4 text-[var(--color-warning)]" />
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

// =============================================================================
// MINI STREAK BADGE
// =============================================================================

interface MiniStreakBadgeProps {
  streak: number
  multiplier: number
  className?: string
}

export function MiniStreakBadge({ streak, multiplier, className }: MiniStreakBadgeProps) {
  if (streak <= 0) return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1',
        'bg-[var(--color-warning-subtle)] border border-[var(--color-warning)]',
        className
      )}
    >
      <Flame className="h-3 w-3 text-[var(--color-warning)]" />
      <span className="font-mono text-xs font-medium text-[var(--color-fg-primary)]">
        {streak}d
      </span>
      {multiplier > 1 && (
        <span className="font-mono text-xs text-[var(--color-warning)]">
          ×{multiplier.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// =============================================================================
// MULTIPLIER BADGE (shows current multiplier)
// =============================================================================

interface MultiplierBadgeProps {
  multiplier: number
  className?: string
}

export function MultiplierBadge({ multiplier, className }: MultiplierBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
        'bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-accent)] text-white',
        className
      )}
    >
      <Zap className="h-3 w-3" />
      <span className="font-mono text-xs font-bold">
        ×{multiplier.toFixed(2)}
      </span>
    </motion.div>
  )
}

// =============================================================================
// STREAK CALENDAR (visual streak history)
// =============================================================================

interface StreakCalendarProps {
  streakDays: number
  lastActivityDate: string | null
  className?: string
}

export function StreakCalendar({ streakDays, lastActivityDate, className }: StreakCalendarProps) {
  // Generate last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (13 - i))
    return date.toISOString().split('T')[0]
  })

  const today = new Date().toISOString().split('T')[0]
  const hasActivity = (date: string) => {
    if (!lastActivityDate) return false
    // For simplicity, show activity for streak days
    const daysAgo = Math.floor((new Date(today).getTime() - new Date(date).getTime()) / 86400000)
    return daysAgo < streakDays && daysAgo >= 0
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {days.map((date, i) => (
        <motion.div
          key={date}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.02 }}
          className={cn(
            'h-6 w-6 rounded-full flex items-center justify-center text-xs',
            hasActivity(date)
              ? 'bg-[var(--color-warning)] text-[var(--color-on-warning)]'
              : 'bg-[var(--color-surface-3)] text-[var(--color-fg-tertiary)]',
            date === today && 'ring-1 ring-[var(--color-accent)]'
          )}
        >
          {new Date(date).getDate()}
        </motion.div>
      ))}
    </div>
  )
}
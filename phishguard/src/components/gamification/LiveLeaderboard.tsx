/**
 * LiveLeaderboard Component
 *
 * Real-time leaderboard with Supabase Realtime.
 * Shows Top 10 only - no negative ranking.
 * Motivating, game-like UX with Forensic Noir aesthetics.
 */

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Trophy, Medal, Shield, TrendingUp, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLiveLeaderboard, useUserArmorPoints } from '@/lib/gamification/hooks'
import { formatPoints, getMultiplierLabel, type LeaderboardEntry } from '@/lib/gamification/types'

type LiveLeaderboardProps = {
  tenantId: string
  currentUserId?: string
  scope?: 'global' | 'department'
  departmentId?: string
  limit?: number
  showStreaks?: boolean
  compact?: boolean
  className?: string
}

export function LiveLeaderboard({
  tenantId,
  currentUserId,
  scope = 'global',
  departmentId,
  limit = 10,
  showStreaks = true,
  compact = false,
  className,
}: LiveLeaderboardProps) {
  const { entries, loading, error, isConnected } = useLiveLeaderboard({
    tenantId,
    scope,
    departmentId,
    limit,
    showStreaks,
  })

  const { points: userPoints } = useUserArmorPoints(currentUserId ?? null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const prevPointsRef = useRef<Map<string, number>>(new Map())

  // Highlight entries when points change
  useEffect(() => {
    entries.forEach((entry) => {
      const prevPoints = prevPointsRef.current.get(entry.user_id)
      if (prevPoints !== undefined && entry.points > prevPoints) {
        setHighlightedId(entry.user_id)
        setTimeout(() => setHighlightedId(null), 2000)
      }
      prevPointsRef.current.set(entry.user_id, entry.points)
    })
  }, [entries])

  if (loading && entries.length === 0) {
    return <LiveLeaderboardSkeleton compact={compact} />
  }

  if (error) {
    return (
      <div className={cn('rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-4', className)}>
        <p className="text-sm text-[var(--color-danger)]">Erro ao carregar ranking</p>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] overflow-hidden', className)}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--color-surface-3)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[var(--color-warning)]" />
          <h3 className="font-display text-base text-[var(--color-fg-primary)]">
            {scope === 'department' ? 'Ranking do Departamento' : 'Top Jogadores'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
              <Wifi className="h-3 w-3" />
              <span>Live</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-fg-tertiary)]">
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </span>
          )}
        </div>
      </header>

      {/* Entries */}
      <div className={compact ? 'p-2' : 'p-4'}>
        <AnimatePresence mode="popLayout">
          {entries.length === 0 ? (
            <EmptyState compact={compact} />
          ) : (
            <ol className={cn(compact ? 'space-y-1' : 'space-y-2')}>
              {entries.map((entry, index) => (
                <motion.li
                  key={entry.user_id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={cn(
                    'relative rounded-md transition-all duration-300',
                    compact ? 'px-3 py-2' : 'px-4 py-3',
                    highlightedId === entry.user_id && 'bg-[var(--color-accent-subtle)] ring-1 ring-[var(--color-accent)]',
                    entry.is_current_user && 'bg-[var(--color-accent-subtle)]',
                  )}
                >
                  <LeaderboardEntryRow
                    entry={entry}
                    index={index}
                    compact={compact}
                    showStreak={showStreaks}
                    userPoints={userPoints}
                  />
                </motion.li>
              ))}
            </ol>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {entries.length > 0 && (
        <footer className="border-t border-[var(--color-surface-3)] px-4 py-2">
          <p className="text-center text-xs text-[var(--color-fg-tertiary)]">
            Sua posição: <span className="font-mono text-[var(--color-fg-secondary)]">#{entries.findIndex(e => e.is_current_user) + 1 || '–'}</span>
            {userPoints > 0 && (
              <span className="ml-2 font-mono text-[var(--color-accent)]">{formatPoints(userPoints)} pts</span>
            )}
          </p>
        </footer>
      )}
    </div>
  )
}

// =============================================================================
// LEADERBOARD ENTRY ROW
// =============================================================================

interface LeaderboardEntryRowProps {
  entry: LeaderboardEntry
  index: number
  compact: boolean
  showStreak: boolean
  userPoints: number
}

function LeaderboardEntryRow({ entry, index, compact, showStreak }: LeaderboardEntryRowProps) {
  const rankIcon = getRankIcon(index, compact ? 16 : 20)
  const rankColor = getRankColor(index)

  return (
    <div className="flex items-center gap-3">
      {/* Rank */}
      <div className={cn('flex items-center justify-center shrink-0', rankColor)}>
        {rankIcon}
      </div>

      {/* User Avatar */}
      <div className="relative shrink-0">
        {entry.user_avatar ? (
          <img
            src={entry.user_avatar}
            alt={entry.user_name}
            className={cn(
              'rounded-full object-cover',
              compact ? 'h-7 w-7' : 'h-9 w-9'
            )}
          />
        ) : (
          <div
            className={cn(
              'flex items-center justify-center rounded-full bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]',
              compact ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
            )}
          >
            {entry.user_name.charAt(0).toUpperCase()}
          </div>
        )}
        {entry.is_current_user && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--color-accent)]" />
          </span>
        )}
      </div>

      {/* Name & Department */}
      <div className="min-w-0 flex-1">
        <p className={cn(
          'truncate font-medium text-[var(--color-fg-primary)]',
          compact ? 'text-sm' : 'text-base'
        )}>
          {entry.user_name}
          {entry.is_current_user && (
            <span className="ml-1.5 text-xs text-[var(--color-accent)]">(você)</span>
          )}
        </p>
        {!compact && (
          <p className="truncate text-xs text-[var(--color-fg-tertiary)]">{entry.department}</p>
        )}
      </div>

      {/* Points */}
      <div className="text-right">
        <p className={cn(
          'font-mono font-medium text-[var(--color-fg-primary)]',
          compact ? 'text-sm' : 'text-lg'
        )}>
          {formatPoints(entry.points)}
        </p>
        {showStreak && entry.streak_count > 0 && !compact && (
          <div className="flex items-center justify-end gap-1 text-xs text-[var(--color-warning)]">
            <TrendingUp className="h-3 w-3" />
            <span>{entry.streak_count}d ×{getMultiplierLabel(entry.streak_multiplier)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// RANK ICONS & COLORS
// =============================================================================

function getRankIcon(index: number, size: number) {
  if (index === 0) {
    return <Trophy className={`h-${size/4} w-${size/4}`} style={{ width: size, height: size }} />
  }
  if (index === 1) {
    return <Medal className={`h-${size/4} w-${size/4}`} style={{ width: size, height: size }} />
  }
  if (index === 2) {
    return <Shield className={`h-${size/4} w-${size/4}`} style={{ width: size, height: size }} />
  }
  return (
    <span className="font-mono text-sm text-[var(--color-fg-tertiary)]">
      {index + 1}
    </span>
  )
}

function getRankColor(index: number): string {
  switch (index) {
    case 0: return 'text-[var(--color-warning)]'
    case 1: return 'text-[var(--color-fg-secondary)]'
    case 2: return 'text-[var(--color-accent)]'
    default: return 'text-[var(--color-fg-tertiary)]'
  }
}

// =============================================================================
// SKELETON
// =============================================================================

function LiveLeaderboardSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--color-surface-3)] px-4 py-3">
        <div className="h-5 w-5 rounded bg-[var(--color-surface-3)]" />
        <div className="h-4 w-32 rounded bg-[var(--color-surface-3)]" />
      </div>
      <div className={compact ? 'p-2 space-y-1' : 'p-4 space-y-2'}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn(
            'flex items-center gap-3 rounded-md bg-[var(--color-surface-2)]',
            compact ? 'px-3 py-2' : 'px-4 py-3'
          )}>
            <div className="h-5 w-5 rounded bg-[var(--color-surface-3)]" />
            <div className="h-7 w-7 rounded-full bg-[var(--color-surface-3)]" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-24 rounded bg-[var(--color-surface-3)]" />
              <div className="h-3 w-16 rounded bg-[var(--color-surface-3)]" />
            </div>
            <div className="h-5 w-12 rounded bg-[var(--color-surface-3)]" />
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({ compact }: { compact: boolean }) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center rounded-md bg-[var(--color-surface-2)] py-8',
      compact && 'py-4'
    )}>
      <Trophy className="h-8 w-8 text-[var(--color-surface-3)] mb-2" />
      <p className="text-sm text-[var(--color-fg-tertiary)]">Nenhum jogador ainda</p>
      <p className="text-xs text-[var(--color-fg-quaternary)]">Seja o primeiro a pontuar!</p>
    </div>
  )
}
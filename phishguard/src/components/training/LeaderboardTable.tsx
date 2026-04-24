/**
 * LeaderboardTable Component
 *
 * Displays rankings within organization with rank, name, points, trend.
 * Forensic Noir theme with amber/gold accents.
 * Simplified version for training dashboard integration.
 */

import { motion } from 'motion/react'
import { Trophy, Medal, Shield, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPoints } from '@/lib/gamification/types'

// Leaderboard entry for training UI
export interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  userAvatar?: string | null
  department?: string
  points: number
  trend?: 'up' | 'down' | 'stable' | number // number = position change
  isCurrentUser?: boolean
}

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  showDepartment?: boolean
  showTrend?: boolean
  showAvatars?: boolean
  limit?: number
  title?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Rank icon and color helpers
function getRankIcon(rank: number, size: number) {
  if (rank === 1) return <Trophy style={{ width: size, height: size }} className="text-[var(--color-warning)]" />
  if (rank === 2) return <Medal style={{ width: size, height: size }} className="text-[var(--color-fg-secondary)]" />
  if (rank === 3) return <Shield style={{ width: size, height: size }} className="text-[var(--color-accent)]" />
  return <span className="font-mono text-sm font-medium text-[var(--color-fg-tertiary)]">{rank}º</span>
}

function getRankCellClass(rank: number): string {
  if (rank === 1) return 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30'
  if (rank === 2) return 'bg-[var(--color-surface-3)]/50 border-[var(--color-surface-3)]'
  if (rank === 3) return 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30'
  return 'bg-[var(--color-surface-2)] border-[var(--color-surface-3)]'
}

function TrendIndicator({ trend }: { trend?: 'up' | 'down' | 'stable' | number }) {
  if (!trend) return null

  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-success)]/20 px-1.5 py-0.5">
        <ChevronUp className="h-3 w-3 text-[var(--color-success)]" />
        <span className="font-mono text-[10px] text-[var(--color-success)]">+1</span>
      </span>
    )
  }

  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-danger)]/20 px-1.5 py-0.5">
        <ChevronDown className="h-3 w-3 text-[var(--color-danger)]" />
        <span className="font-mono text-[10px] text-[var(--color-danger)]">-1</span>
      </span>
    )
  }

  if (trend === 'stable') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-surface-3)] px-1.5 py-0.5">
        <Minus className="h-3 w-3 text-[var(--color-fg-tertiary)]" />
      </span>
    )
  }

  // Numeric trend (position change)
  if (typeof trend === 'number') {
    if (trend > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-success)]/20 px-1.5 py-0.5">
          <TrendingUp className="h-3 w-3 text-[var(--color-success)]" />
          <span className="font-mono text-[10px] text-[var(--color-success)]">+{trend}</span>
        </span>
      )
    }
    if (trend < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-danger)]/20 px-1.5 py-0.5">
          <TrendingDown className="h-3 w-3 text-[var(--color-danger)]" />
          <span className="font-mono text-[10px] text-[var(--color-danger)]">{trend}</span>
        </span>
      )
    }
  }

  return null
}

// Avatar placeholder
function UserAvatar({ name, avatar, size = 32 }: { name: string; avatar?: string | null; size?: number }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)] font-medium"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// Table row component
function LeaderboardRow({
  entry,
  showDepartment,
  showTrend,
  showAvatar,
  isCurrentUser,
}: {
  entry: LeaderboardEntry
  showDepartment: boolean
  showTrend: boolean
  showAvatar: boolean
  isCurrentUser: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-all',
        isCurrentUser
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
          : 'border-[var(--color-surface-3)] bg-[var(--color-surface-1)]',
        'hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-2)]'
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg border',
          getRankCellClass(entry.rank)
        )}
      >
        {getRankIcon(entry.rank, 20)}
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {showAvatar && <UserAvatar name={entry.userName} avatar={entry.userAvatar} size={32} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">
            {entry.userName}
            {isCurrentUser && (
              <span className="ml-1.5 text-xs text-[var(--color-accent)]">(você)</span>
            )}
          </p>
          {showDepartment && entry.department && (
            <p className="truncate text-xs text-[var(--color-fg-tertiary)]">{entry.department}</p>
          )}
        </div>
      </div>

      {/* Points */}
      <div className="text-right">
        <p className="font-mono text-lg font-semibold text-[var(--color-fg-primary)]">
          {formatPoints(entry.points)}
        </p>
        <p className="text-[10px] text-[var(--color-fg-tertiary)]">pts</p>
      </div>

      {/* Trend */}
      {showTrend && entry.trend && (
        <div className="ml-2">
          <TrendIndicator trend={entry.trend} />
        </div>
      )}
    </motion.div>
  )
}

// Skeleton loader
function LeaderboardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-3">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-surface-3)]" />
          <div className="flex items-center gap-2 flex-1">
            <div className="h-8 w-8 rounded-full bg-[var(--color-surface-3)]" />
            <div className="space-y-1.5">
              <div className="h-4 w-24 rounded bg-[var(--color-surface-3)]" />
              <div className="h-3 w-16 rounded bg-[var(--color-surface-3)]" />
            </div>
          </div>
          <div className="h-6 w-16 rounded bg-[var(--color-surface-3)]" />
        </div>
      ))}
    </div>
  )
}

export function LeaderboardTable({
  entries,
  currentUserId,
  showDepartment = true,
  showTrend = true,
  showAvatars = true,
  limit,
  title = 'Ranking',
  size = 'md',
  className,
}: LeaderboardTableProps) {
  const displayEntries = limit ? entries.slice(0, limit) : entries

  // Find current user's position
  const currentUserEntry = entries.find((e) => e.userId === currentUserId)
  const currentUserRank = currentUserEntry?.rank

  if (entries.length === 0) {
    return (
      <div className={cn(
        'rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-6 text-center',
        className
      )}>
        <Trophy className="mx-auto h-10 w-10 text-[var(--color-surface-3)] mb-3" />
        <p className="text-sm text-[var(--color-fg-tertiary)]">Nenhum jogador no ranking ainda</p>
        <p className="mt-1 text-xs text-[var(--color-fg-quaternary)]">Seja o primeiro a pontuar!</p>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-surface-3)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[var(--color-warning)]" />
          <h3 className="font-display text-base font-semibold text-[var(--color-fg-primary)]">
            {title}
          </h3>
        </div>
        {currentUserRank && (
          <span className="rounded-full bg-[var(--color-accent-subtle)] px-2.5 py-1 font-mono text-xs text-[var(--color-accent)]">
            Sua posição: #{currentUserRank}
          </span>
        )}
      </div>

      {/* Entries */}
      <div className={size === 'sm' ? 'p-2 space-y-1' : 'p-4 space-y-2'}>
        {displayEntries.map((entry, index) => (
          <LeaderboardRow
            key={entry.userId}
            entry={entry}
            showDepartment={showDepartment}
            showTrend={showTrend}
            showAvatar={showAvatars}
            isCurrentUser={entry.userId === currentUserId}
          />
        ))}
      </div>

      {/* Footer */}
      {limit && entries.length > limit && (
        <div className="border-t border-[var(--color-surface-3)] px-4 py-2 text-center">
          <p className="text-xs text-[var(--color-fg-tertiary)]">
            +{entries.length - limit} jogadores não mostrados
          </p>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COMPACT LEADERBOARD (sidebar widget)
// =============================================================================

interface CompactLeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  limit?: number
  className?: string
}

export function CompactLeaderboard({
  entries,
  currentUserId,
  limit = 5,
  className,
}: CompactLeaderboardProps) {
  const topEntries = entries.slice(0, limit)

  return (
    <div className={cn(
      'rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-3',
      className
    )}>
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-[var(--color-warning)]" />
        <span className="text-xs font-semibold text-[var(--color-fg-secondary)]">TOP {limit}</span>
      </div>
      <div className="space-y-1.5">
        {topEntries.map((entry) => (
          <div
            key={entry.userId}
            className={cn(
              'flex items-center gap-2 rounded px-2 py-1.5',
              entry.userId === currentUserId && 'bg-[var(--color-accent-subtle)]'
            )}
          >
            <span className="w-5 text-center font-mono text-xs text-[var(--color-fg-tertiary)]">
              #{entry.rank}
            </span>
            <span className="flex-1 truncate text-xs text-[var(--color-fg-primary)]">
              {entry.userName}
            </span>
            <span className="font-mono text-xs text-[var(--color-accent)]">
              {formatPoints(entry.points)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mock data for testing
export const MOCK_LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', userName: 'Maria Silva', points: 2450, department: 'Engenharia', trend: 'up' },
  { rank: 2, userId: 'u2', userName: 'João Santos', points: 2180, department: 'Marketing', trend: 2 },
  { rank: 3, userId: 'u3', userName: 'Ana Costa', points: 1950, department: 'Vendas', trend: 'down' },
  { rank: 4, userId: 'u4', userName: 'Pedro Oliveira', points: 1820, department: 'RH', trend: 'stable' },
  { rank: 5, userId: 'u5', userName: 'Carla Mendes', points: 1650, department: 'Financeiro', trend: 1 },
  { rank: 6, userId: 'u6', userName: 'Rafael Lima', points: 1490, department: 'TI', trend: 'up' },
  { rank: 7, userId: 'u7', userName: 'Lucia Ferreira', points: 1320, department: 'Marketing', trend: 'down' },
  { rank: 8, userId: 'u8', userName: 'Bruno Almeida', points: 1180, department: 'Engenharia', trend: 3 },
  { rank: 9, userId: 'u9', userName: 'Fernanda Rocha', points: 950, department: 'Vendas', trend: 'stable' },
  { rank: 10, userId: 'u10', userName: 'Carlos Souza', points: 820, department: 'RH', trend: 'up' },
]
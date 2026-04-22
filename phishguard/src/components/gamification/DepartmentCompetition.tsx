/**
 * DepartmentCompetition Component
 *
 * Department vs Department competition display.
 * Shows top departments competing to be the most secure.
 * Motivating cooperative competition, not individual punishment.
 */

import { motion } from 'motion/react'
import { Users, TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDepartmentCompetition } from '@/lib/gamification/hooks'
import { formatPoints, type DepartmentLeaderboardEntry } from '@/lib/gamification/types'

type DepartmentCompetitionProps = {
  tenantId: string
  myDepartmentId?: string
  maxDepartments?: number
  compact?: boolean
  className?: string
}

export function DepartmentCompetition({
  tenantId,
  myDepartmentId,
  maxDepartments = 6,
  compact = false,
  className,
}: DepartmentCompetitionProps) {
  const { departments, loading, myDepartment } = useDepartmentCompetition(tenantId, myDepartmentId)

  if (loading && departments.length === 0) {
    return <DepartmentCompetitionSkeleton compact={compact} />
  }

  const displayDepartments = departments.slice(0, maxDepartments)
  const maxPoints = Math.max(...departments.map((d) => d.total_points), 1)

  return (
    <div className={cn('rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] overflow-hidden', className)}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--color-surface-3)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--color-accent)]" />
          <h3 className="font-display text-base text-[var(--color-fg-primary)]">
            {compact ? 'Departamentos' : 'Competição por Departamento'}
          </h3>
        </div>
        <span className="rounded bg-[var(--color-surface-2)] px-2 py-0.5 text-xs text-[var(--color-fg-tertiary)]">
          {departments.length} departamentos
        </span>
      </header>

      {/* Competition */}
      <div className={compact ? 'p-3' : 'p-4'}>
        {/* VS Header */}
        {!compact && displayDepartments.length >= 2 && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex-1 rounded-full bg-[var(--color-surface-2)] p-2 text-center">
              <p className="text-sm font-medium text-[var(--color-fg-secondary)]">
                {displayDepartments[0].department_name}
              </p>
              <p className="font-mono text-lg font-bold text-[var(--color-fg-primary)]">
                {formatPoints(displayDepartments[0].total_points)}
              </p>
            </div>
            <span className="text-lg font-bold text-[var(--color-warning)]">VS</span>
            <div className="flex-1 rounded-full bg-[var(--color-surface-2)] p-2 text-center">
              <p className="text-sm font-medium text-[var(--color-fg-secondary)]">
                {displayDepartments[1].department_name}
              </p>
              <p className="font-mono text-lg font-bold text-[var(--color-fg-primary)]">
                {formatPoints(displayDepartments[1].total_points)}
              </p>
            </div>
          </div>
        )}

        {/* Department List */}
        <div className={cn('space-y-2', compact && 'space-y-1')}>
          {displayDepartments.map((dept, index) => (
            <motion.div
              key={dept.department_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'relative rounded-md transition-all',
                compact ? 'p-2' : 'p-3',
                dept.department_id === myDepartmentId && 'bg-[var(--color-accent-subtle)] ring-1 ring-[var(--color-accent)]'
              )}
            >
              <DepartmentBar
                department={dept}
                index={index}
                maxPoints={maxPoints}
                isMyDepartment={dept.department_id === myDepartmentId}
                compact={compact}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {myDepartment && (
        <footer className="border-t border-[var(--color-surface-3)] px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-fg-tertiary)]">Seu departamento</span>
            <span className="flex items-center gap-1 text-xs">
              <span className="font-mono font-medium text-[var(--color-fg-primary)]">
                #{myDepartment.rank}º
              </span>
              <span className="text-[var(--color-fg-tertiary)]">
                · {formatPoints(myDepartment.total_points)} pts
              </span>
            </span>
          </div>
        </footer>
      )}
    </div>
  )
}

// =============================================================================
// DEPARTMENT BAR
// =============================================================================

interface DepartmentBarProps {
  department: DepartmentLeaderboardEntry
  index: number
  maxPoints: number
  isMyDepartment: boolean
  compact: boolean
}

function DepartmentBar({ department, index, maxPoints, isMyDepartment, compact }: DepartmentBarProps) {
  const percentage = (department.total_points / maxPoints) * 100
  const TrendIcon = department.trend === 'up' ? TrendingUp : department.trend === 'down' ? TrendingDown : Minus

  return (
    <div className="flex items-center gap-3">
      {/* Rank */}
      <div className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
        index === 0 && 'bg-[var(--color-warning)] text-[var(--color-on-warning)]',
        index === 1 && 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]',
        index === 2 && 'bg-[var(--color-surface-3)] text-[var(--color-accent)]',
        index > 2 && 'bg-[var(--color-surface-3)] text-[var(--color-fg-tertiary)]'
      )}>
        {index === 0 ? (
          <Trophy className="h-3.5 w-3.5" />
        ) : (
          <span className="font-mono text-xs">{index + 1}</span>
        )}
      </div>

      {/* Bar */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className={cn(
            'truncate text-sm font-medium text-[var(--color-fg-primary)]',
            isMyDepartment && 'text-[var(--color-accent)]'
          )}>
            {department.department_name}
            {isMyDepartment && (
              <span className="ml-1.5 text-xs text-[var(--color-accent)]">(você)</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-[var(--color-fg-primary)]">
              {formatPoints(department.total_points)}
            </span>
            <TrendIcon className={cn(
              'h-3.5 w-3.5',
              department.trend === 'up' && 'text-[var(--color-success)]',
              department.trend === 'down' && 'text-[var(--color-danger)]',
              department.trend === 'stable' && 'text-[var(--color-fg-tertiary)]'
            )} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              index === 0 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-accent)]'
            )}
          />
        </div>

        {!compact && (
          <div className="mt-1 flex items-center justify-between text-xs text-[var(--color-fg-tertiary)]">
            <span>{department.member_count} membros</span>
            <span>~{formatPoints(department.avg_points_per_member)} pts/membro</span>
            {department.top_contributor_name && (
              <span className="truncate">Top: {department.top_contributor_name}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

function DepartmentCompetitionSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--color-surface-3)] px-4 py-3">
        <div className="h-5 w-5 rounded bg-[var(--color-surface-3)]" />
        <div className="h-4 w-40 rounded bg-[var(--color-surface-3)]" />
      </div>
      <div className={compact ? 'p-3 space-y-2' : 'p-4 space-y-3'}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-[var(--color-surface-3)]" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-full rounded bg-[var(--color-surface-3)]" />
              <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-3)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// VS MODE COMPONENT (side-by-side comparison)
// =============================================================================

interface DepartmentVsProps {
  departmentA: DepartmentLeaderboardEntry
  departmentB: DepartmentLeaderboardEntry
  className?: string
}

export function DepartmentVs({ departmentA, departmentB, className }: DepartmentVsProps) {
  const pointsA = departmentA.total_points
  const pointsB = departmentB.total_points

  return (
    <div className={cn('flex items-stretch rounded-lg border border-[var(--color-surface-3)] overflow-hidden', className)}>
      {/* Department A */}
      <div className="flex-1 bg-[var(--color-surface-1)] p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
            <span className="font-mono text-sm font-bold text-[var(--color-fg-primary)]">
              {departmentA.department_name.charAt(0)}
            </span>
          </div>
          <span className="font-medium text-[var(--color-fg-primary)]">{departmentA.department_name}</span>
        </div>
        <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
          {formatPoints(pointsA)}
        </p>
        <p className="text-xs text-[var(--color-fg-tertiary)]">
          {departmentA.member_count} membros
        </p>
      </div>

      {/* VS Badge */}
      <div className="relative flex items-center justify-center bg-[var(--color-surface-2)] px-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-px bg-[var(--color-surface-3)]" />
        </div>
        <div className="relative z-10 rounded-full bg-[var(--color-warning)] px-4 py-1">
          <span className="font-display text-sm font-bold text-[var(--color-on-warning)]">VS</span>
        </div>
      </div>

      {/* Department B */}
      <div className="flex-1 bg-[var(--color-surface-2)] p-4 text-right">
        <div className="mb-2 flex items-center justify-end gap-2">
          <span className="font-medium text-[var(--color-fg-primary)]">{departmentB.department_name}</span>
          <div className="h-8 w-8 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center">
            <span className="font-mono text-sm font-bold text-[var(--color-fg-secondary)]">
              {departmentB.department_name.charAt(0)}
            </span>
          </div>
        </div>
        <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
          {formatPoints(pointsB)}
        </p>
        <p className="text-xs text-[var(--color-fg-tertiary)]">
          {departmentB.member_count} membros
        </p>
      </div>
    </div>
  )
}
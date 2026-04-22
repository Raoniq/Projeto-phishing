/**
 * ReportRewardToast Component
 *
 * Shows feedback when user earns points for reporting phishing.
 * Animated celebration with points earned.
 */

import { motion, AnimatePresence } from 'motion/react'
import { Shield, CheckCircle, Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPoints } from '@/lib/gamification/types'

type ReportRewardToastProps = {
  show: boolean
  pointsEarned: number
  streakMultiplier?: number
  onClose: () => void
  className?: string
}

// Pre-compute confetti particles at module load to avoid impure function calls during render
const CONFETTI_PARTICLES = Array.from({ length: 8 }, (_, idx) => ({
  x: (Math.random() - 0.5) * 200,
  y: (Math.random() - 0.5) * 200,
  idx,
}))

export function ReportRewardToast({
  show,
  pointsEarned,
  streakMultiplier = 1,
  onClose,
  className,
}: ReportRewardToastProps) {
  const hasBonus = streakMultiplier > 1

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={cn(
            'fixed bottom-6 right-6 z-50 max-w-sm',
            'rounded-xl border bg-[var(--color-surface-1)] p-4 shadow-2xl',
            'ring-2 ring-[var(--color-accent)]',
            className
          )}
        >
          {/* Background glow */}
          <div className="absolute inset-0 rounded-xl bg-[var(--color-accent)] opacity-5 blur-xl -z-10" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-full p-1 text-[var(--color-fg-tertiary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg-primary)]"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]"
            >
              <CheckCircle className="h-6 w-6 text-white" />
            </motion.div>

            {/* Text */}
            <div className="flex-1">
              <p className="font-display text-lg font-bold text-[var(--color-fg-primary)]">
                Phishing Reportado!
              </p>
              <p className="text-sm text-[var(--color-fg-secondary)]">
                Você ajudou a proteger seus colegas.
              </p>
            </div>
          </div>

          {/* Points earned */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className={cn(
              'mt-4 rounded-lg p-3 text-center',
              hasBonus ? 'bg-[var(--color-warning-subtle)]' : 'bg-[var(--color-surface-2)]'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className={cn(
                'h-5 w-5',
                hasBonus ? 'text-[var(--color-warning)]' : 'text-[var(--color-accent)]'
              )} />
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="font-display text-2xl font-bold text-[var(--color-fg-primary)]"
              >
                +{formatPoints(pointsEarned)}
              </motion.span>
              <span className="text-sm text-[var(--color-fg-tertiary)]">pts</span>
            </div>

            {/* Streak bonus indicator */}
            {hasBonus && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-warning)] px-2 py-0.5"
              >
                <Star className="h-3 w-3 text-[var(--color-on-warning)]" />
                <span className="font-mono text-xs font-bold text-[var(--color-on-warning)]">
                  Bônus ×{streakMultiplier.toFixed(2)}!
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Confetti particles */}
          {hasBonus && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {CONFETTI_PARTICLES.map((particle) => (
                <motion.div
                  key={particle.idx}
                  initial={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    y: 0,
                  }}
                  animate={{
                    opacity: 0,
                    scale: 0,
                    x: particle.x,
                    y: particle.y,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.2 + particle.idx * 0.05,
                    ease: 'easeOut',
                  }}
                  className={cn(
                    'absolute left-1/2 top-1/2 h-2 w-2 rounded-full',
                    particle.idx % 2 === 0 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-accent)]'
                  )}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// =============================================================================
// REPORT BUTTON WITH REWARD
// =============================================================================

interface ReportButtonProps {
  onReport: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function ReportButton({ onReport, disabled, loading, className }: ReportButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onReport}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2',
        'bg-[var(--color-danger)] text-white',
        'font-medium transition-colors',
        'hover:bg-[var(--color-danger-hover)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
        />
      ) : (
        <Shield className="h-4 w-4" />
      )}
      <span>Reportar Phishing</span>
      <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5 font-mono text-xs">
        +50
      </span>
    </motion.button>
  )
}

// =============================================================================
// POINTS ANIMATION (floating +50 text)
// =============================================================================

interface FloatingPointsProps {
  points: number
  x: number
  y: number
  className?: string
}

export function FloatingPoints({ points, x, y, className }: FloatingPointsProps) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{
        opacity: 0,
        y: -50,
        scale: 1.2,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      style={{ left: x, top: y }}
      className={cn(
        'pointer-events-none fixed font-display text-xl font-bold text-[var(--color-success)]',
        className
      )}
    >
      +{formatPoints(points)}
    </motion.div>
  )
}
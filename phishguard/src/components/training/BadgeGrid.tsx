/**
 * BadgeGrid Component
 *
 * Displays earned badges and locked badges with descriptions.
 * Forensic Noir theme with amber/gold accents for earned badges.
 */

import { motion } from 'motion/react'
import { Lock, Award, Star, Target, Zap, Clock, CheckCircle2, Shield, Trophy, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

// Badge type definitions
export type BadgeType =
  | 'first_track'
  | 'speed_demon'
  | 'perfectionist'
  | 'phish_hunter'
  | 'streak_master'
  | 'quiz_whiz'
  | 'module_complete'
  | 'track_complete'
  | 'department_champion'
  | 'security_awareness'
  | 'rapid_responder'
  | 'untouchable'

export interface Badge {
  id: string
  type: BadgeType
  name: string
  description: string
  icon: string // Lucide icon name
  earnedAt?: string // ISO date string if earned
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface BadgeGridProps {
  badges: Badge[]
  earnedOnly?: boolean
  showDescriptions?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Badge catalog - all possible badges
export const BADGE_CATALOG: Record<BadgeType, Omit<Badge, 'id' | 'earnedAt'>> = {
  first_track: {
    type: 'first_track',
    name: 'Primeiro Passo',
    description: 'Complete seu primeiro módulo de treinamento',
    icon: 'Star',
    rarity: 'common',
  },
  speed_demon: {
    type: 'speed_demon',
    name: 'Veloz',
    description: 'Complete um módulo em menos de 5 minutos',
    icon: 'Zap',
    rarity: 'rare',
  },
  perfectionist: {
    type: 'perfectionist',
    name: 'Perfeccionista',
    description: 'Passe em um quiz com 100% de acerto',
    icon: 'Target',
    rarity: 'rare',
  },
  phish_hunter: {
    type: 'phish_hunter',
    name: 'Caçador de Phishing',
    description: 'Identifique 10 emails de phishing corretamente',
    icon: 'Shield',
    rarity: 'epic',
  },
  streak_master: {
    type: 'streak_master',
    name: 'Mestre da Sequência',
    description: 'Mantenha uma sequência de 7 dias',
    icon: 'Flame',
    rarity: 'epic',
  },
  quiz_whiz: {
    type: 'quiz_whiz',
    name: 'Gênio dos Quizzes',
    description: 'Passe em 5 quizzes consecutivos sem errar',
    icon: 'Award',
    rarity: 'rare',
  },
  module_complete: {
    type: 'module_complete',
    name: 'Concluinte',
    description: 'Complete 10 módulos de treinamento',
    icon: 'CheckCircle2',
    rarity: 'common',
  },
  track_complete: {
    type: 'track_complete',
    name: 'Trilha Completa',
    description: 'Complete uma trilha de treinamento inteira',
    icon: 'Trophy',
    rarity: 'epic',
  },
  department_champion: {
    type: 'department_champion',
    name: 'Campeão Departamental',
    description: 'Fique em 1º lugar no ranking do seu departamento',
    icon: 'Trophy',
    rarity: 'legendary',
  },
  security_awareness: {
    type: 'security_awareness',
    name: 'Consciência de Segurança',
    description: 'Complete todos os módulos básicos de segurança',
    icon: 'Shield',
    rarity: 'common',
  },
  rapid_responder: {
    type: 'rapid_responder',
    name: 'Resposta Rápida',
    description: 'Report um email suspeito em menos de 1 minuto',
    icon: 'Zap',
    rarity: 'rare',
  },
  untouchable: {
    type: 'untouchable',
    name: 'Intocável',
    description: 'Complete 30 dias sem errar nenhum quiz',
    icon: 'Flame',
    rarity: 'legendary',
  },
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Star,
  Zap,
  Target,
  Shield,
  Flame,
  Award,
  CheckCircle2,
  Trophy,
  Clock,
}

function getIcon(iconName: string) {
  return iconMap[iconName] || Award
}

// Rarity styles
const rarityStyles = {
  common: {
    bg: 'bg-[var(--color-surface-2)]',
    border: 'border-[var(--color-surface-3)]',
    icon: 'text-[var(--color-fg-secondary)]',
    glow: '',
  },
  rare: {
    bg: 'bg-[var(--color-accent-subtle)]',
    border: 'border-[var(--color-accent)]/40',
    icon: 'text-[var(--color-accent)]',
    glow: 'shadow-[var(--color-accent)]/20',
  },
  epic: {
    bg: 'bg-gradient-to-br from-[var(--color-accent-subtle)] to-[var(--color-purple-500)]/20',
    border: 'border-[var(--color-accent)]',
    icon: 'text-[var(--color-accent)]',
    glow: 'shadow-[var(--color-accent)]/40',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-[var(--color-warning)]/20 to-[var(--color-accent)]/20',
    border: 'border-[var(--color-warning)]',
    icon: 'text-[var(--color-warning)]',
    glow: 'shadow-[var(--color-warning)]/50',
  },
}

// Size classes
const sizeClasses = {
  sm: {
    badge: 'p-2',
    icon: 20,
    name: 'text-xs',
    desc: 'text-[10px]',
  },
  md: {
    badge: 'p-3',
    icon: 28,
    name: 'text-sm',
    desc: 'text-xs',
  },
  lg: {
    badge: 'p-4',
    icon: 36,
    name: 'text-base',
    desc: 'text-sm',
  },
}

function BadgeItem({
  badge,
  earned,
  size = 'md',
  showDescription = true,
}: {
  badge: Badge
  earned: boolean
  size?: 'sm' | 'md' | 'lg'
  showDescription?: boolean
}) {
  const styles = rarityStyles[badge.rarity]
  const classes = sizeClasses[size]
  const Icon = getIcon(badge.icon)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        'relative rounded-xl border transition-all duration-300',
        styles.bg,
        styles.border,
        styles.glow,
        'shadow-lg',
        classes.badge,
        !earned && 'opacity-60'
      )}
    >
      {/* Lock overlay for unearned */}
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--color-surface-0)]/50 backdrop-blur-sm">
          <Lock className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
        </div>
      )}

      {/* Earned animation */}
      {earned && badge.earnedAt && (
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-success)]">
          <CheckCircle2 className="h-3 w-3 text-white" />
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className={cn(
          'mb-2 flex items-center justify-center rounded-full bg-[var(--color-surface-3)] p-2',
          !earned && 'grayscale'
        )}>
          <Icon className={cn(styles.icon, `h-[${classes.icon}px] w-[${classes.icon}px]`)} />
        </div>

        {/* Name */}
        <p className={cn(
          'font-semibold text-[var(--color-fg-primary)]',
          classes.name,
          !earned && 'text-[var(--color-fg-tertiary)]'
        )}>
          {badge.name}
        </p>

        {/* Description */}
        {showDescription && (
          <p className={cn(
            'mt-1 line-clamp-2 text-[var(--color-fg-tertiary)]',
            classes.desc
          )}>
            {badge.description}
          </p>
        )}

        {/* Earned date */}
        {earned && badge.earnedAt && (
          <p className={cn(
            'mt-2 font-mono text-[10px] text-[var(--color-fg-tertiary)]',
            classes.desc
          )}>
            Conquistado em {new Date(badge.earnedAt).toLocaleDateString('pt-BR')}
          </p>
        )}

        {/* Rarity indicator */}
        <div className={cn(
          'mt-2 rounded-full px-2 py-0.5',
          badge.rarity === 'legendary' && 'bg-[var(--color-warning)]/20',
          badge.rarity === 'epic' && 'bg-[var(--color-accent)]/20',
          badge.rarity === 'rare' && 'bg-[var(--color-blue-500)]/20',
          badge.rarity === 'common' && 'bg-[var(--color-surface-3)]'
        )}>
          <span className={cn(
            'font-mono text-[10px] uppercase tracking-wider',
            badge.rarity === 'legendary' && 'text-[var(--color-warning)]',
            badge.rarity === 'epic' && 'text-[var(--color-accent)]',
            badge.rarity === 'rare' && 'text-[var(--color-blue-500)]',
            badge.rarity === 'common' && 'text-[var(--color-fg-tertiary)]'
          )}>
            {badge.rarity}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function BadgeGrid({
  badges,
  earnedOnly = false,
  showDescriptions = true,
  size = 'md',
  className,
}: BadgeGridProps) {
  const earnedBadges = badges.filter((b) => b.earnedAt)
  const lockedBadges = badges.filter((b) => !b.earnedAt)

  const displayBadges = earnedOnly ? earnedBadges : badges

  if (displayBadges.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-8 text-center',
        className
      )}>
        <Award className="h-10 w-10 text-[var(--color-surface-3)] mb-3" />
        <p className="text-sm text-[var(--color-fg-tertiary)]">
          {earnedOnly ? 'Nenhum badge conquistado ainda' : 'Nenhum badge disponível'}
        </p>
        <p className="mt-1 text-xs text-[var(--color-fg-quaternary)]">
          Continue treinando para desbloquear badges!
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Earned Badges Section */}
      {!earnedOnly && earnedBadges.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-[var(--color-accent)]" />
            <h4 className="font-display text-sm font-semibold text-[var(--color-fg-primary)]">
              Conquistados ({earnedBadges.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {earnedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <BadgeItem
                  badge={badge}
                  earned={true}
                  size={size}
                  showDescription={showDescriptions}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges Section */}
      {!earnedOnly && lockedBadges.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
            <h4 className="font-display text-sm font-semibold text-[var(--color-fg-secondary)]">
              Bloqueados ({lockedBadges.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {lockedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (earnedBadges.length + index) * 0.05 }}
              >
                <BadgeItem
                  badge={badge}
                  earned={false}
                  size={size}
                  showDescription={showDescriptions}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Earned Only Mode */}
      {earnedOnly && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {displayBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <BadgeItem
                badge={badge}
                earned={true}
                size={size}
                showDescription={showDescriptions}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MINI BADGE PREVIEW (for user cards)
// =============================================================================

interface MiniBadgePreviewProps {
  earnedCount: number
  totalCount: number
  className?: string
}

export function MiniBadgePreview({ earnedCount, totalCount, className }: MiniBadgePreviewProps) {
  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-1.5',
        'bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]',
        className
      )}
    >
      <Award className="h-4 w-4 text-[var(--color-accent)]" />
      <span className="font-mono text-sm font-medium text-[var(--color-fg-primary)]">
        {earnedCount}/{totalCount}
      </span>
      <span className="text-xs text-[var(--color-fg-tertiary)]">badges</span>
    </motion.div>
  )
}

// Mock data for testing
export const MOCK_BADGES: Badge[] = [
  {
    id: '1',
    ...BADGE_CATALOG.first_track,
    earnedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    ...BADGE_CATALOG.speed_demon,
    earnedAt: '2024-01-20T14:20:00Z',
  },
  {
    id: '3',
    ...BADGE_CATALOG.perfectionist,
    earnedAt: '2024-02-05T09:15:00Z',
  },
  {
    id: '4',
    ...BADGE_CATALOG.phish_hunter,
    earnedAt: '2024-02-28T16:45:00Z',
  },
  {
    id: '5',
    ...BADGE_CATALOG.streak_master,
    earnedAt: '2024-03-10T11:00:00Z',
  },
  {
    id: '6',
    ...BADGE_CATALOG.quiz_whiz,
  },
  {
    id: '7',
    ...BADGE_CATALOG.track_complete,
  },
  {
    id: '8',
    ...BADGE_CATALOG.department_champion,
  },
  {
    id: '9',
    ...BADGE_CATALOG.module_complete,
    earnedAt: '2024-01-10T08:00:00Z',
  },
  {
    id: '10',
    ...BADGE_CATALOG.security_awareness,
    earnedAt: '2024-01-12T10:00:00Z',
  },
  {
    id: '11',
    ...BADGE_CATALOG.rapid_responder,
  },
  {
    id: '12',
    ...BADGE_CATALOG.untouchable,
  },
]
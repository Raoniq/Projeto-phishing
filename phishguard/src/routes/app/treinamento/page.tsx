/* eslint-disable @typescript-eslint/no-explicit-any */
// routes/app/treinamento/page.tsx — Employee Training Hub
// Displays: Meus Treinamentos, XP/Level, Badges, Company Leaderboard
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import {
  GraduationCap,
  Shield,
  Flame,
  Trophy,
  Medal,
  Star,
  CheckCircle2,
  Play,
  BookOpen,
  Clock,
  Sparkles,
  Award,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge as BadgeComponent } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import { useCompany } from '@/hooks/useCompany'
import { useUserEnrollments, useTrainingTracks } from '@/lib/hooks'
import { formatPoints } from '@/lib/gamification/types'
import { PointsDisplay, getLevelFromPoints, getLevelProgress } from '@/components/training/PointsDisplay'
import { BADGE_CATALOG } from '@/components/training/BadgeGrid'
import type { Badge as BadgeType } from '@/components/training/BadgeGrid'

// Database types
interface UserJourneyState {
  current_tier: number
  streak_days: number
  risk_score: number
}

interface UserBadge {
  id: string
  badge_name: string
  badge_icon: string | null
  badge_category: string | null
  earned_at: string
}

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  userAvatar?: string | null
  department?: string
  points: number
  trend?: 'up' | 'down' | 'stable' | number
  isCurrentUser?: boolean
}

// Difficulty config
const DIFFICULTY_CONFIG = {
  beginner: { label: 'Básico', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  intermediate: { label: 'Intermediário', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  advanced: { label: 'Avançado', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
} as const

// =============================================================================
// SKELETON LOADERS
// =============================================================================

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="bg-[var(--color-surface-1)] border-[var(--color-noir-700)]">
          <CardContent className="p-4">
            <div className="h-4 w-20 bg-[var(--color-surface-3)] rounded animate-pulse mb-3" />
            <div className="h-8 w-16 bg-[var(--color-surface-3)] rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EnrollmentsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-[var(--color-surface-1)] border-[var(--color-noir-700)]">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-surface-3)] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-[var(--color-surface-3)] rounded animate-pulse" />
                <div className="h-4 w-32 bg-[var(--color-surface-3)] rounded animate-pulse" />
                <div className="h-2 w-full bg-[var(--color-surface-3)] rounded-full animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LeaderboardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-3">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-surface-3)] animate-pulse" />
          <div className="flex items-center gap-2 flex-1">
            <div className="h-8 w-8 rounded-full bg-[var(--color-surface-3)] animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-4 w-24 rounded bg-[var(--color-surface-3)] animate-pulse" />
              <div className="h-3 w-16 rounded bg-[var(--color-surface-3)] animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-16 rounded bg-[var(--color-surface-3)] animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// STATS CARDS
// =============================================================================

function StatCard({
  label,
  value,
  icon: Icon,
  accentColor,
  delay,
  suffix,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  accentColor: string
  delay: number
  suffix?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden border-[var(--color-noir-700)] bg-[var(--color-surface-1)] hover:border-[var(--color-noir-600)] transition-all duration-300">
        <CardContent className="p-5">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, transparent 60%)`,
            }}
          />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--color-fg-tertiary)] mb-1">{label}</p>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)] tracking-tight">
                {value}
                {suffix && <span className="text-sm text-[var(--color-fg-secondary)] ml-1">{suffix}</span>}
              </p>
            </div>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Icon className="h-5 w-5" style={{ color: accentColor }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function TreinamentoPage() {
  const navigate = useNavigate()

  // Auth state from hooks
  const { session, isLoading: authLoading } = useSession()
  const { company } = useCompany()

  // Local user state (derived from session)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Data state
  const [userXP, setUserXP] = useState(0)
  const [userBadges, setUserBadges] = useState<BadgeType[]>([])
  const [userStreak, setUserStreak] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [, setJourneyState] = useState<UserJourneyState | null>(null)

  // Hooks
  const { enrollments, loading: enrollmentsLoading } = useUserEnrollments(currentUser?.id)
  const { tracks: availableTracks, loading: tracksLoading } = useTrainingTracks(company?.id)

  // Initialize user from session with timeout
  useEffect(() => {
    if (!session?.user) {
      setCurrentUser(null)
      setIsInitialized(true)
      return
    }

    // Timeout fallback - if user fetch takes >5s, show error
    const timeoutId = setTimeout(() => {
      if (!currentUser) {
        setFetchError('Tempo limite ao carregar usuário. Tente novamente.')
        setIsInitialized(true)
      }
    }, 5000)

    async function fetchUser() {
      try {
        // Get user profile from users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single()

        clearTimeout(timeoutId)

        if (profileError) {
          console.error('Failed to fetch user profile:', profileError)
          setFetchError('Erro ao carregar perfil do usuário.')
          setCurrentUser(null)
        } else if (profileData) {
          setCurrentUser({
            id: profileData.id,
            name: profileData.name || profileData.email || 'Usuário',
            role: profileData.role || 'member',
          })
        }
      } catch (err) {
        clearTimeout(timeoutId)
        console.error('Failed to fetch user:', err)
        setFetchError('Erro ao carregar dados do usuário.')
        setCurrentUser(null)
      } finally {
        setIsInitialized(true)
      }
    }

    fetchUser()

    return () => clearTimeout(timeoutId)
  }, [session?.user?.id])

  // Redirect admins to admin/training using React Router
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      navigate('/app/admin/training')
    }
  }, [currentUser, navigate])

  // Fetch user XP from user_points table
  useEffect(() => {
    if (!currentUser?.id) return

    async function fetchUserXP() {
      try {
        const { data } = await supabase
          .from('user_points')
          .select('points')
          .eq('user_id', currentUser.id)
          .eq('points_type', 'xp')

        if (data && data.length > 0) {
          const totalXP = data.reduce((sum, p) => sum + p.points, 0)
          setUserXP(totalXP)
          setUserLevel(getLevelFromPoints(totalXP))
        }
      } catch (err) {
        console.error('Failed to fetch user XP:', err)
      }
    }
    fetchUserXP()
  }, [currentUser])

  // Fetch user badges from user_badges table
  useEffect(() => {
    if (!currentUser?.id) return

    async function fetchUserBadges() {
      try {
        const { data } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', currentUser.id)

        if (data) {
          const badges: BadgeType[] = data.map((b: UserBadge) => ({
            id: b.id,
            type: b.badge_name as any,
            name: b.badge_name,
            description: BADGE_CATALOG[b.badge_name as keyof typeof BADGE_CATALOG]?.description || b.badge_name,
            icon: b.badge_icon || 'Award',
            earnedAt: b.earned_at,
            rarity: 'common' as const,
          }))
          setUserBadges(badges)
        }
      } catch (err) {
        console.error('Failed to fetch user badges:', err)
      }
    }
    fetchUserBadges()
  }, [currentUser])

  // Fetch user journey state for streak
  useEffect(() => {
    if (!currentUser?.id) return

    async function fetchJourneyState() {
      try {
        const { data } = await supabase
          .from('user_journey_states')
          .select('streak_days, current_tier')
          .eq('user_id', currentUser.id)
          .single()

        if (data) {
          setUserStreak(data.streak_days || 0)
          setJourneyState(data as UserJourneyState)
        }
      } catch (err) {
        // Journey state might not exist yet
        console.error('Failed to fetch journey state:', err)
      }
    }
    fetchJourneyState()
  }, [currentUser])

  // Fetch company leaderboard from user_points
  useEffect(() => {
    if (!currentUser?.id) return

    async function fetchLeaderboard() {
      try {
        setLeaderboardLoading(true)

        // Get XP totals per user
        const { data: xpData } = await supabase
          .from('user_points')
          .select('user_id, points')
          .eq('points_type', 'xp')

        if (!xpData) {
          setLeaderboard([])
          return
        }

        // Aggregate points by user
        const userPointsMap = new Map<string, number>()
        xpData.forEach((row) => {
          const current = userPointsMap.get(row.user_id) || 0
          userPointsMap.set(row.user_id, current + row.points)
        })

        // Get user details
        const userIds = Array.from(userPointsMap.keys())
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, department')
          .in('id', userIds.slice(0, 20)) // Top 20

        if (!usersData) {
          setLeaderboard([])
          return
        }

        // Build leaderboard entries
        const entries: LeaderboardEntry[] = usersData
          .map((u) => ({
            rank: 0,
            userId: u.id,
            userName: u.name || u.email || 'Usuário',
            department: u.department || 'Geral',
            points: userPointsMap.get(u.id) || 0,
          }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 10)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
            isCurrentUser: entry.userId === currentUser.id,
          }))

        setLeaderboard(entries)
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err)
        setLeaderboard([])
      } finally {
        setLeaderboardLoading(false)
      }
    }
    fetchLeaderboard()
  }, [currentUser])

  // Filter enrolled vs available tracks
  const enrolledTrackIds = new Set(enrollments.map((e) => e.track_id))
  const enrolledEnrollments = enrollments.filter((e) => e.status !== 'completed')
  const availableToEnroll = availableTracks.filter((t) => !enrolledTrackIds.has(t.id))

  // Calculate stats
  const completedCount = enrollments.filter((e) => e.status === 'completed').length
  const inProgressCount = enrollments.filter((e) => e.status === 'in_progress' || e.status === 'assigned').length

  // Error state - show error with retry
  if (fetchError) {
    return (
      <div className="h-full bg-[var(--color-surface-0)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-error)]/10">
                <AlertCircle className="h-8 w-8 text-[var(--color-error)]" />
              </div>
              <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)] mb-2">
                Erro ao carregar
              </h3>
              <p className="text-sm text-[var(--color-fg-secondary)] mb-6 max-w-sm">
                {fetchError}
              </p>
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Loading state - wait for auth initialization
  if (authLoading || !isInitialized) {
    return (
      <div className="h-full bg-[var(--color-surface-0)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 bg-[var(--color-surface-3)] rounded" />
            <StatsSkeleton />
            <div className="h-64 bg-[var(--color-surface-3)] rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[var(--color-surface-0)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)] flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-amber-400)] shadow-lg shadow-[var(--color-accent)]/30">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            Meus Treinamentos
          </h1>
          <p className="mt-2 text-sm text-[var(--color-fg-secondary)]">
            Desenvolva suas habilidades em segurança digital através de trilhas progressivas
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="XP Total"
            value={formatPoints(userXP)}
            icon={Shield}
            accentColor="var(--color-accent)"
            delay={0}
          />
          <StatCard
            label="Nível Atual"
            value={userLevel}
            icon={Star}
            accentColor="var(--color-amber-500)"
            delay={1}
            suffix={`(${Math.round(getLevelProgress(userXP))}%)`}
          />
          <StatCard
            label="Sequência"
            value={userStreak}
            icon={Flame}
            accentColor="var(--color-warning)"
            delay={2}
            suffix="dias"
          />
          <StatCard
            label="Concluídos"
            value={completedCount}
            icon={Trophy}
            accentColor="var(--color-success)"
            delay={3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Enrollments & Catalog */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Enrollments */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[var(--color-fg-primary)] tracking-tight flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[var(--color-accent)]" />
                    Trilhas em Andamento
                  </h2>
                  <p className="mt-1 text-xs text-[var(--color-fg-secondary)]">
                    {inProgressCount} trilha{inProgressCount !== 1 ? 's' : ''} em progresso
                  </p>
                </div>
              </div>

              {enrollmentsLoading ? (
                <EnrollmentsSkeleton />
              ) : enrolledEnrollments.length === 0 ? (
                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-2)]">
                      <BookOpen className="h-8 w-8 text-[var(--color-fg-tertiary)]" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)] mb-2">
                      Nenhuma trilha em andamento
                    </h3>
                    <p className="text-sm text-[var(--color-fg-secondary)] mb-6 max-w-sm">
                      Comece sua jornada de aprendizado inscrito em uma trilha abaixo
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enrollment, index) => {
                    const track = availableTracks.find((t) => t.id === enrollment.track_id)
                    const difficulty = track?.difficulty_level || 'beginner'
                    const config = DIFFICULTY_CONFIG[difficulty]

                    return (
                      <motion.div
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          className={cn(
                            'border-[var(--color-noir-700)] bg-[var(--color-surface-1)] hover:border-[var(--color-accent)]/50 transition-all duration-300',
                            enrollment.status === 'in_progress' && 'border-[var(--color-accent)]/30'
                          )}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              {/* Icon */}
                              <div className={cn(
                                'flex h-14 w-14 items-center justify-center rounded-xl',
                                'bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-amber-400)]/10',
                                'border border-[var(--color-accent)]/20'
                              )}>
                                <GraduationCap className="h-7 w-7 text-[var(--color-accent)]" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)] truncate">
                                      {track?.name || 'Trilha carregando...'}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={cn(
                                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                                        config.bg,
                                        config.color,
                                        config.border
                                      )}>
                                        {config.label}
                                      </span>
                                      {track?.estimated_duration_minutes && (
                                        <span className="flex items-center gap-1 text-xs text-[var(--color-fg-tertiary)]">
                                          <Clock className="h-3 w-3" />
                                          {track.estimated_duration_minutes}min
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Status Badge */}
                                  {enrollment.status === 'in_progress' && (
<BadgeComponent variant="default" className="shrink-0">
                                       Em progresso
                                     </BadgeComponent>
                                  )}
                                  {enrollment.status === 'completed' && (
<BadgeComponent variant="success" className="shrink-0">
                                       <CheckCircle2 className="h-3 w-3 mr-1" />
                                       Concluído
                                     </BadgeComponent>
                                  )}
                                </div>

                                {/* Progress Bar */}
                                {enrollment.progress !== undefined && enrollment.progress > 0 && (
                                  <div className="mt-3">
                                    <div className="mb-1.5 flex items-center justify-between">
                                      <span className="text-xs text-[var(--color-fg-tertiary)]">Progresso</span>
                                      <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                                        {enrollment.progress}%
                                      </span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${enrollment.progress}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-amber-400)] shadow-lg shadow-[var(--color-accent)]/30"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="mt-4 flex items-center gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => window.location.href = `/app/training/${enrollment.track_id}`}
                                  >
                                    <Play className="h-4 w-4" />
                                    {enrollment.progress > 0 ? 'Continuar' : 'Iniciar'}
                                  </Button>
                                  {enrollment.progress === 100 && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => {/* TODO: Mark complete */}}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      Concluir
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Available Tracks Catalog */}
            {availableToEnroll.length > 0 && (
              <section>
                <div className="mb-4">
                  <h2 className="font-display text-xl font-semibold text-[var(--color-fg-primary)] tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[var(--color-amber-400)]" />
                    Trilhas Disponíveis
                  </h2>
                  <p className="mt-1 text-xs text-[var(--color-fg-secondary)]">
                    Explore novas trilhas para expandir seus conhecimentos
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableToEnroll.slice(0, 4).map((track, index) => {
                    const difficulty = track.difficulty_level || 'beginner'
                    const config = DIFFICULTY_CONFIG[difficulty]

                    return (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] hover:border-[var(--color-noir-600)] transition-all duration-300 h-full">
                          <CardContent className="p-5 flex flex-col h-full">
                            <div className="flex items-start gap-3 mb-3">
                              <div className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg',
                                'bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/20'
                              )}>
                                <GraduationCap className="h-5 w-5 text-[var(--color-accent)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-display text-base font-semibold text-[var(--color-fg-primary)] truncate">
                                  {track.name}
                                </h3>
                                <span className={cn(
                                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium mt-1',
                                  config.bg,
                                  config.color,
                                  config.border
                                )}>
                                  {config.label}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-[var(--color-fg-secondary)] flex-1 line-clamp-2 mb-3">
                              {track.description || 'Descrição não disponível'}
                            </p>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 text-xs text-[var(--color-fg-tertiary)]">
                                <Clock className="h-3 w-3" />
                                {track.estimated_duration_minutes
                                  ? `${track.estimated_duration_minutes}min`
                                  : '-'}
                              </span>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                  // TODO: Implement enrollment
                                  alert('Funcionalidade de inscrição em breve!')
                                }}
                              >
                                <span className="text-xs">Inscrever-se</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - XP, Badges, Leaderboard */}
          <div className="space-y-6">
            {/* XP Display */}
            <PointsDisplay
              points={userXP}
              size="lg"
              showLevelProgress={true}
              animated={true}
            />

            {/* Badges Section */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-[var(--color-fg-primary)] flex items-center gap-2">
                  <Award className="h-4 w-4 text-[var(--color-accent)]" />
                  Conquistas
                </h3>
                <span className="text-xs text-[var(--color-fg-tertiary)]">
                  {userBadges.length} conquistadas
                </span>
              </div>

              {userBadges.length === 0 ? (
                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Award className="h-10 w-10 text-[var(--color-surface-3)] mb-3" />
                    <p className="text-sm text-[var(--color-fg-tertiary)]">
                      Nenhuma conquista ainda
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-fg-quaternary)]">
                      Complete trilhas para desbloquear badges!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {userBadges.slice(0, 6).map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        'flex flex-col items-center rounded-xl border p-3 text-center',
                        'bg-[var(--color-surface-1)] border-[var(--color-surface-3)]',
                        'hover:border-[var(--color-accent)]/50 transition-all duration-300 cursor-pointer'
                      )}
                    >
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
                        <Star className="h-5 w-5 text-[var(--color-accent)]" />
                      </div>
                      <p className="text-xs font-medium text-[var(--color-fg-primary)] line-clamp-1">
                        {badge.name}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Company Leaderboard */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-[var(--color-fg-primary)] flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[var(--color-warning)]" />
                  Ranking da Empresa
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {/* TODO: Refresh leaderboard */}}
                >
                  <RefreshCw className="h-3.5 w-3.5 text-[var(--color-fg-tertiary)]" />
                </Button>
              </div>

              {leaderboardLoading ? (
                <LeaderboardSkeleton rows={5} />
              ) : leaderboard.length === 0 ? (
                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Trophy className="h-10 w-10 text-[var(--color-surface-3)] mb-3" />
                    <p className="text-sm text-[var(--color-fg-tertiary)]">
                      Nenhum jogador no ranking ainda
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-fg-quaternary)]">
                      Seja o primeiro a pontuar!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 transition-all',
                        entry.isCurrentUser
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                          : 'border-[var(--color-surface-3)] bg-[var(--color-surface-1)]',
                        'hover:border-[var(--color-accent)]/50'
                      )}
                    >
                      {/* Rank */}
                      <div className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg border',
                        entry.rank === 1 && 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30',
                        entry.rank === 2 && 'bg-[var(--color-surface-3)]/50 border-[var(--color-surface-3)]',
                        entry.rank === 3 && 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30',
                        entry.rank > 3 && 'bg-[var(--color-surface-2)] border-[var(--color-surface-3)]'
                      )}>
                        {entry.rank === 1 ? (
                          <Trophy className="h-4 w-4 text-[var(--color-warning)]" />
                        ) : entry.rank === 2 ? (
                          <Medal className="h-4 w-4 text-[var(--color-fg-secondary)]" />
                        ) : entry.rank === 3 ? (
                          <Medal className="h-4 w-4 text-[var(--color-accent)]" />
                        ) : (
                          <span className="font-mono text-xs font-medium text-[var(--color-fg-tertiary)]">
                            #{entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">
                          {entry.userName}
                          {entry.isCurrentUser && (
                            <span className="ml-1.5 text-xs text-[var(--color-accent)]">(você)</span>
                          )}
                        </p>
                        {entry.department && (
                          <p className="truncate text-xs text-[var(--color-fg-tertiary)]">{entry.department}</p>
                        )}
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold text-[var(--color-fg-primary)]">
                          {formatPoints(entry.points)}
                        </p>
                        <p className="text-[10px] text-[var(--color-fg-tertiary)]">pts</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/**
 * Training Analytics Dashboard
 * Admin view for training engagement metrics and performance tracking
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  Users,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Download,
  Filter,
  X,
  Calendar,
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toCSV, downloadCSV, type CSVColumn } from '@/lib/csv-export'
import { useTrainingTracks } from '@/lib/hooks/useTraining'

// Types
interface TrackPerformance {
  trackId: string
  trackName: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  enrolled: number
  completed: number
  inProgress: number
  overdue: number
  completionRate: number
  avgTimeToComplete: number | null
}

interface UserProgress {
  userId: string
  userName: string
  email: string
  department: string | null
  tracksAssigned: number
  tracksCompleted: number
  tracksOverdue: number
  lastActivity: string | null
  avgProgress: number
}

interface MonthlyTrend {
  month: string
  completed: number
  enrolled: number
}

interface AnalyticsFilters {
  dateRange: '7d' | '30d' | '90d' | 'all'
  trackId: string
  department: string
}

// Date range helper
function getDateFromRange(range: AnalyticsFilters['dateRange']): string | null {
  const now = new Date()
  if (range === '7d') return new Date(now.setDate(now.getDate() - 7)).toISOString()
  if (range === '30d') return new Date(now.setDate(now.getDate() - 30)).toISOString()
  if (range === '90d') return new Date(now.setDate(now.getDate() - 90)).toISOString()
  return null
}

// CSV Types
interface TrainingAnalyticsCSV {
  trackName: string
  difficulty: string
  enrolled: number
  completed: number
  inProgress: number
  overdue: number
  completionRate: number
  avgTimeMinutes: number | null
}

interface UserProgressCSV {
  userName: string
  email: string
  department: string
  tracksAssigned: number
  tracksCompleted: number
  tracksOverdue: number
  avgProgress: number
  lastActivity: string
}

// CSS Bar Chart Component
function CSSBarChart({ data, maxValue }: { data: MonthlyTrend[]; maxValue: number }) {
  return (
    <div className="flex items-end justify-between gap-3 h-48 px-2">
      {data.map((item, idx) => {
        const heightPercent = maxValue > 0 ? (item.completed / maxValue) * 100 : 0
        const enrolledHeight = maxValue > 0 ? (item.enrolled / maxValue) * 100 : 0
        return (
          <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
            <div className="relative w-full h-36 flex flex-col justify-end items-center gap-1">
              {/* Enrolled bar (background) */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${enrolledHeight}%` }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="absolute bottom-0 w-8 rounded-t-sm bg-[var(--color-noir-600)] opacity-60"
              />
              {/* Completed bar (foreground) */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ delay: idx * 0.1 + 0.2, duration: 0.5 }}
                className="absolute bottom-0 w-8 rounded-t-sm bg-gradient-to-t from-[var(--color-accent)] to-[var(--color-accent-hover)]"
                style={{ height: `${heightPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-[var(--color-fg-tertiary)] font-medium">
              {item.month}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Stat Card Component
function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  accentColor,
  delay,
  trend
}: {
  label: string
  value: string | number
  subValue?: string
  icon: React.ElementType
  accentColor: string
  delay: number
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden border-[var(--color-noir-700)] bg-[var(--color-surface-1)] hover:border-[var(--color-noir-600)] transition-all duration-300">
        <div
          className="absolute inset-0 opacity-5"
          style={{ background: `linear-gradient(135deg, ${accentColor} 0%, transparent 60%)` }}
        />
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                {label}
              </p>
              <p className="font-display text-4xl font-bold text-[var(--color-fg-primary)] tracking-tight">
                {value}
              </p>
              {subValue && (
                <div className="flex items-center gap-1.5">
                  {trend && (
                    <span className={cn(
                      'flex items-center text-xs',
                      trend === 'up' && 'text-emerald-400',
                      trend === 'down' && 'text-red-400',
                      trend === 'neutral' && 'text-[var(--color-fg-muted)]'
                    )}>
                      {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                      {trend === 'down' && <TrendingUp className="h-3 w-3 rotate-180" />}
                    </span>
                  )}
                  <span className="text-xs text-[var(--color-fg-secondary)]">{subValue}</span>
                </div>
              )}
            </div>
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Icon className="h-7 w-7" style={{ color: accentColor }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Loading Skeleton
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-surface-2)]">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-noir-700)] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-[var(--color-noir-700)] rounded animate-pulse" />
            <div className="h-3 w-32 bg-[var(--color-noir-700)] rounded animate-pulse" />
          </div>
          <div className="h-6 w-20 bg-[var(--color-noir-700)] rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// Empty State
function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--color-noir-800)]">
          <BarChart3 className="h-12 w-12 text-[var(--color-fg-tertiary)]" />
        </div>
        <div className="absolute -inset-4 rounded-full border border-dashed border-[var(--color-noir-700)] -z-10" />
      </div>
      <h3 className="font-display text-xl font-semibold text-[var(--color-fg-primary)] mb-2">
        {filtered ? 'Nenhum dado encontrado' : 'Sem dados de treinamento'}
      </h3>
      <p className="text-center text-[var(--color-fg-secondary)] max-w-sm">
        {filtered
          ? 'Tente ajustar os filtros para encontrar o que procura.'
          : 'Ainda não há enrollments de treinamento para exibir. Inscreva usuários em trilhas para ver métricas aqui.'}
      </p>
    </motion.div>
  )
}

// Main Page Component
export default function TrainingAnalyticsPage() {
  // Data state
  const [trackPerformance, setTrackPerformance] = useState<TrackPerformance[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: 'all',
    trackId: 'all',
    department: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)

  // Reference data
  const { tracks } = useTrainingTracks()
  const [departments, setDepartments] = useState<string[]>([])

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const dateFilter = getDateFromRange(filters.dateRange)

      // Fetch all enrollments with joins
      let query = supabase
        .from('user_training_enrollments')
        .select(`
          id,
          status,
          progress,
          enrolled_at,
          completed_at,
          due_date,
          training_tracks(id, name, difficulty_level, estimated_duration_minutes),
          users(id, name, email, department)
        `)

      if (dateFilter) {
        query = query.gte('enrolled_at', dateFilter)
      }

      if (filters.trackId !== 'all') {
        query = query.eq('track_id', filters.trackId)
      }

      const { data: enrollments, error: enrollError } = await query

      if (enrollError) throw enrollError

      // Calculate track performance
      const trackMap = new Map<string, TrackPerformance>()
      const now = new Date()

      for (const enrollment of enrollments || []) {
        const track = enrollment.training_tracks as any
        if (!track) continue

        const trackId = track.id
        if (!trackMap.has(trackId)) {
          trackMap.set(trackId, {
            trackId,
            trackName: track.name,
            difficulty: track.difficulty_level || 'beginner',
            enrolled: 0,
            completed: 0,
            inProgress: 0,
            overdue: 0,
            completionRate: 0,
            avgTimeToComplete: null
          })
        }

        const stats = trackMap.get(trackId)!
        stats.enrolled++

        if (enrollment.status === 'completed') {
          stats.completed++
          if (enrollment.completed_at && enrollment.enrolled_at) {
            const duration = (new Date(enrollment.completed_at).getTime() - new Date(enrollment.enrolled_at).getTime()) / (1000 * 60)
            stats.avgTimeToComplete = stats.avgTimeToComplete
              ? (stats.avgTimeToComplete + duration) / 2
              : duration
          }
        } else if (enrollment.status === 'in_progress') {
          stats.inProgress++
        }

        if (enrollment.due_date && new Date(enrollment.due_date) < now && enrollment.status !== 'completed') {
          stats.overdue++
        }
      }

      // Calculate completion rates
      for (const stats of trackMap.values()) {
        stats.completionRate = stats.enrolled > 0
          ? Math.round((stats.completed / stats.enrolled) * 100)
          : 0
      }

      // Calculate user progress
      const userMap = new Map<string, UserProgress>()

      for (const enrollment of enrollments || []) {
        const user = enrollment.users as any
        if (!user) continue

        if (!userMap.has(user.id)) {
          userMap.set(user.id, {
            userId: user.id,
            userName: user.name || 'Unknown',
            email: user.email || '',
            department: user.department || null,
            tracksAssigned: 0,
            tracksCompleted: 0,
            tracksOverdue: 0,
            lastActivity: null,
            avgProgress: 0
          })
        }

        const progress = userMap.get(user.id)!
        progress.tracksAssigned++
        progress.avgProgress += enrollment.progress || 0

        if (enrollment.status === 'completed') {
          progress.tracksCompleted++
        }

        if (enrollment.due_date && new Date(enrollment.due_date) < now && enrollment.status !== 'completed') {
          progress.tracksOverdue++
        }

        if (!progress.lastActivity || (enrollment.completed_at && progress.lastActivity < enrollment.completed_at)) {
          progress.lastActivity = enrollment.completed_at || enrollment.enrolled_at
        }
      }

      // Average progress
      for (const progress of userMap.values()) {
        progress.avgProgress = progress.tracksAssigned > 0
          ? Math.round(progress.avgProgress / progress.tracksAssigned)
          : 0
      }

      // Filter by department
      let userList = Array.from(userMap.values())
      if (filters.department !== 'all') {
        userList = userList.filter(u => u.department === filters.department)
      }

      // Calculate monthly trends
      const trendMap = new Map<string, MonthlyTrend>()
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

      for (const enrollment of enrollments || []) {
        const date = new Date(enrollment.enrolled_at)
        const monthKey = months[date.getMonth()]
        const yearKey = date.getFullYear()
        const key = `${monthKey}/${yearKey - 2000}`

        if (!trendMap.has(key)) {
          trendMap.set(key, { month: key, enrolled: 0, completed: 0 })
        }

        const trend = trendMap.get(key)!
        trend.enrolled++

        if (enrollment.status === 'completed' && enrollment.completed_at) {
          const completedDate = new Date(enrollment.completed_at)
          if (completedDate.getMonth() === date.getMonth() && completedDate.getFullYear() === date.getFullYear()) {
            trend.completed++
          }
        }
      }

      // Get unique departments
      const allDepts = new Set(userList.filter(u => u.department).map(u => u.department))
      setDepartments(Array.from(allDepts) as string[])

      setTrackPerformance(Array.from(trackMap.values()))
      setUserProgress(userList.sort((a, b) => b.tracksAssigned - a.tracksAssigned))
      setMonthlyTrends(Array.from(trendMap.values()).slice(-6))

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [filters.dateRange, filters.trackId, filters.department, supabase])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Overview stats
  const overviewStats = useMemo(() => {
    const totalEnrollments = trackPerformance.reduce((acc, t) => acc + t.enrolled, 0)
    const totalCompleted = trackPerformance.reduce((acc, t) => acc + t.completed, 0)
    const totalOverdue = trackPerformance.reduce((acc, t) => acc + t.overdue, 0)
    const completionRate = totalEnrollments > 0 ? Math.round((totalCompleted / totalEnrollments) * 100) : 0
    const avgProgress = totalEnrollments > 0
      ? Math.round(trackPerformance.reduce((acc, t) => acc + t.completionRate, 0) / trackPerformance.length) || 0
      : 0

    return { totalEnrollments, totalCompleted, totalOverdue, completionRate, avgProgress }
  }, [trackPerformance])

  // Max value for chart
  const maxChartValue = useMemo(() => {
    const maxEnrolled = Math.max(...monthlyTrends.map(t => t.enrolled), 1)
    const maxCompleted = Math.max(...monthlyTrends.map(t => t.completed), 1)
    return Math.max(maxEnrolled, maxCompleted)
  }, [monthlyTrends])

  // CSV Export
  const handleExportCSV = useCallback(async () => {
    setExporting(true)

    try {
      // Track Performance CSV
      const trackColumns: CSVColumn<TrainingAnalyticsCSV>[] = [
        { header: 'Trilha', accessor: (r) => r.trackName },
        { header: 'Dificuldade', accessor: (r) => r.difficulty },
        { header: 'Matriculados', accessor: (r) => r.enrolled },
        { header: 'Concluídos', accessor: (r) => r.completed },
        { header: 'Em Progresso', accessor: (r) => r.inProgress },
        { header: 'Atrasados', accessor: (r) => r.overdue },
        { header: 'Taxa Conclusão (%)', accessor: (r) => r.completionRate },
        { header: 'Tempo Médio (min)', accessor: (r) => r.avgTimeMinutes ?? '' }
      ]

      const trackData: TrainingAnalyticsCSV[] = trackPerformance.map(t => ({
        trackName: t.trackName,
        difficulty: t.difficulty,
        enrolled: t.enrolled,
        completed: t.completed,
        inProgress: t.inProgress,
        overdue: t.overdue,
        completionRate: t.completionRate,
        avgTimeMinutes: t.avgTimeToComplete
      }))

      const trackCSV = toCSV(trackData, trackColumns)
      downloadCSV(trackCSV, `training-analytics-tracks-${new Date().toISOString().split('T')[0]}.csv`)

      // User Progress CSV
      const userColumns: CSVColumn<UserProgressCSV>[] = [
        { header: 'Usuário', accessor: (r) => r.userName },
        { header: 'Email', accessor: (r) => r.email },
        { header: 'Departamento', accessor: (r) => r.department },
        { header: 'Trilhas Atribuídas', accessor: (r) => r.tracksAssigned },
        { header: 'Concluídas', accessor: (r) => r.tracksCompleted },
        { header: 'Atrasadas', accessor: (r) => r.tracksOverdue },
        { header: 'Progresso Médio (%)', accessor: (r) => r.avgProgress },
        { header: 'Última Atividade', accessor: (r) => r.lastActivity }
      ]

      const userData: UserProgressCSV[] = userProgress.map(u => ({
        userName: u.userName,
        email: u.email,
        department: u.department || '',
        tracksAssigned: u.tracksAssigned,
        tracksCompleted: u.tracksCompleted,
        tracksOverdue: u.tracksOverdue,
        avgProgress: u.avgProgress,
        lastActivity: u.lastActivity ? new Date(u.lastActivity).toLocaleDateString('pt-BR') : ''
      }))

      const userCSV = toCSV(userData, userColumns)
      downloadCSV(userCSV, `training-analytics-users-${new Date().toISOString().split('T')[0]}.csv`)

    } finally {
      setExporting(false)
    }
  }, [trackPerformance, userProgress])

  const hasActiveFilters = filters.dateRange !== 'all' || filters.trackId !== 'all' || filters.department !== 'all'

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                Analytics de Treinamento
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                Métricas de engajamento e desempenho de treinamento
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleExportCSV}
              isLoading={exporting}
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total de Matrículas"
            value={overviewStats.totalEnrollments}
            icon={Users}
            accentColor="var(--color-accent)"
            delay={0}
            trend="neutral"
            subValue="usuários inscritos"
          />
          <StatCard
            label="Taxa de Conclusão"
            value={`${overviewStats.completionRate}%`}
            icon={CheckCircle2}
            accentColor="var(--color-success)"
            delay={1}
            trend={overviewStats.completionRate > 50 ? 'up' : 'down'}
            subValue={`${overviewStats.totalCompleted} concluídos`}
          />
          <StatCard
            label="Usuários Atrasados"
            value={overviewStats.totalOverdue}
            icon={AlertTriangle}
            accentColor="var(--color-danger)"
            delay={2}
            trend={overviewStats.totalOverdue > 0 ? 'down' : 'up'}
            subValue="com trilha em atraso"
          />
          <StatCard
            label="Progresso Médio"
            value={`${overviewStats.avgProgress}%`}
            icon={Activity}
            accentColor="var(--color-amber-500)"
            delay={3}
            trend="neutral"
            subValue="completado em média"
          />
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Button
                  variant={showFilters ? 'primary' : 'secondary'}
                  size="default"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-surface-0)] text-[10px] font-bold text-[var(--color-accent)]">
                      {(filters.dateRange !== 'all' ? 1 : 0) + (filters.trackId !== 'all' ? 1 : 0) + (filters.department !== 'all' ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="default" onClick={() => setFilters({ dateRange: 'all', trackId: 'all', department: 'all' })}>
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={fetchAnalytics}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4">
                  {/* Date Range */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)] flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Período:
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as AnalyticsFilters['dateRange'] })}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="7d">Últimos 7 dias</option>
                      <option value="30d">Últimos 30 dias</option>
                      <option value="90d">Últimos 90 dias</option>
                    </select>
                  </div>

                  {/* Track Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)] flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      Trilha:
                    </label>
                    <select
                      value={filters.trackId}
                      onChange={(e) => setFilters({ ...filters, trackId: e.target.value })}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todas</option>
                      {tracks.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-fg-tertiary)]">Departamento:</label>
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Completion Trend Chart */}
        {monthlyTrends.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[var(--color-accent)]" />
                  Tendência de Conclusão
                </CardTitle>
                <CardDescription>
                  Matrículas e conclusões nos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CSSBarChart data={monthlyTrends} maxValue={maxChartValue} />
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-[var(--color-noir-600)]" />
                    <span className="text-xs text-[var(--color-fg-secondary)]">Matriculados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-[var(--color-accent)]" />
                    <span className="text-xs text-[var(--color-fg-secondary)]">Concluídos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Track Performance Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-[var(--color-accent)]" />
                  Desempenho por Trilha
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <TableSkeleton />
                ) : trackPerformance.length === 0 ? (
                  <EmptyState filtered={hasActiveFilters} />
                ) : (
                  <div className="space-y-4">
                    {trackPerformance.map((track) => (
                      <div key={track.trackId} className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]/80 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--color-fg-primary)] truncate">{track.trackName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={track.difficulty === 'advanced' ? 'destructive' : track.difficulty === 'intermediate' ? 'secondary' : 'default'}
                              className="text-[10px]"
                            >
                              {track.difficulty === 'beginner' ? 'Básico' : track.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-center">
                          <div>
                            <p className="text-lg font-bold text-[var(--color-fg-primary)]">{track.enrolled}</p>
                            <p className="text-[10px] text-[var(--color-fg-muted)]">Inscritos</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-emerald-400">{track.completed}</p>
                            <p className="text-[10px] text-[var(--color-fg-muted)]">Concluídos</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-amber-400">{track.overdue}</p>
                            <p className="text-[10px] text-[var(--color-fg-muted)]">Atrasados</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-[var(--color-accent)]">{track.completionRate}%</p>
                            <p className="text-[10px] text-[var(--color-fg-muted)]">Taxa</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* User Progress Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--color-accent)]" />
                  Progresso por Usuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <TableSkeleton />
                ) : userProgress.length === 0 ? (
                  <EmptyState filtered={hasActiveFilters} />
                ) : (
                  <div className="space-y-4">
                    {userProgress.slice(0, 10).map((user) => (
                      <div key={user.userId} className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]/80 transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold text-sm">
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--color-fg-primary)] truncate">{user.userName}</p>
                          <p className="text-xs text-[var(--color-fg-muted)] truncate">{user.email}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-sm font-bold text-[var(--color-fg-primary)]">{user.tracksAssigned}</p>
                            <p className="text-[10px] text-[var(--color-fg-muted)]">Atribuídas</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-400">{user.tracksCompleted}</p>
                            <p className="text-[10px] text-[var(--color-fg-muted)]">Concluídas</p>
                          </div>
                          <div>
                            <p className={cn(
                              'text-sm font-bold',
                              user.tracksOverdue > 0 ? 'text-red-400' : 'text-[var(--color-fg-primary)]'
                            )}>
                              {user.tracksOverdue}
                            </p>
                            <p className="text-[10px] text-[var(--color-fg-muted)]">Atrasadas</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {userProgress.length > 10 && (
                      <p className="text-center text-xs text-[var(--color-fg-muted)] py-2">
                        + {userProgress.length - 10} usuários
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10">
            <p className="text-sm text-red-400">Erro ao carregar analytics: {error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
/**
 * Gamification Realtime Hooks
 *
 * Subscribe to leaderboard updates via Supabase Realtime
 */

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  LeaderboardEntry,
  DepartmentLeaderboardEntry,
  GamificationChannel,
  LiveLeaderboardProps,
} from './types'

// =============================================================================
// LIVE LEADERBOARD HOOK
// =============================================================================

/**
 * Subscribe to live leaderboard updates.
 * Returns sorted entries (Top 10 only) and realtime channel.
 */
export function useLiveLeaderboard({
  tenantId,
  scope = 'global',
  departmentId,
  limit = 10,
}: LiveLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<GamificationChannel | null>(null)

  // Initial fetch
  useEffect(() => {
    let cancelled = false

    async function fetchLeaderboard() {
      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from('leaderboard_top10')
          .select('*')
          .eq('tenant_id', tenantId)

        if (scope === 'department' && departmentId) {
          query = query.eq('department_id', departmentId)
        }

        const { data, error: fetchError } = await query
          .order('points', { ascending: false })
          .limit(limit)

        if (fetchError) throw fetchError

        if (!cancelled) {
          const formatted: LeaderboardEntry[] = (data ?? []).map((row, idx) => ({
            rank: idx + 1,
            user_id: row.user_id,
            user_name: row.user_name,
            user_avatar: row.user_avatar,
            department: row.department,
            department_id: row.department_id,
            points: row.points,
            streak_count: row.streak_count ?? 0,
            streak_multiplier: row.streak_multiplier ?? 1.0,
          }))

          setEntries(formatted)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLeaderboard()

    return () => { cancelled = true }
  }, [tenantId, scope, departmentId, limit])

  // Realtime subscription
  useEffect(() => {
    const channelName = `leaderboard:${tenantId}:${scope}${departmentId ? `:${departmentId}` : ''}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'armor_points',
          filter: `tenant_id=eq.${tenantId}${departmentId ? `&department_id=eq.${departmentId}` : ''}`,
        },
        (payload) => {
          setEntries((current) => {
            const updated = [...current]
            const row = payload.new as Partial<LeaderboardEntry>

            // Find existing entry
            const existingIdx = updated.findIndex((e) => e.user_id === row.user_id)

            if (payload.event === 'DELETE' && existingIdx !== -1) {
              updated.splice(existingIdx, 1)
            } else if (existingIdx !== -1) {
              // Update existing
              updated[existingIdx] = {
                ...updated[existingIdx],
                points: row.points ?? updated[existingIdx].points,
                streak_count: row.streak_count ?? updated[existingIdx].streak_count,
                streak_multiplier: row.streak_multiplier ?? updated[existingIdx].streak_multiplier,
              }
            } else if (payload.event === 'INSERT') {
              // Add new entry
              const newEntry: LeaderboardEntry = {
                rank: 0, // Will be recalculated
                user_id: row.user_id ?? '',
                user_name: row.user_name ?? 'Unknown',
                user_avatar: row.user_avatar ?? null,
                department: row.department ?? '',
                department_id: row.department_id ?? '',
                points: row.points ?? 0,
                streak_count: row.streak_count ?? 0,
                streak_multiplier: row.streak_multiplier ?? 1.0,
              }
              updated.push(newEntry)
            }

            // Re-sort and re-rank
            updated.sort((a, b) => b.points - a.points)
            return updated.slice(0, limit)
          })
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = { channel, unsubsribe: () => supabase.removeChannel(channel) }

    return () => {
      channelRef.current?.unsubsribe()
      channelRef.current = null
    }
  }, [tenantId, scope, departmentId, limit])

  return {
    entries,
    loading,
    error,
    isConnected,
    refetch: async () => {
      setLoading(true)
      const { data } = await supabase
        .from('leaderboard_top10')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('points', { ascending: false })
        .limit(limit)
      setEntries(
        (data ?? []).map((row, idx) => ({
          rank: idx + 1,
          user_id: row.user_id,
          user_name: row.user_name,
          user_avatar: row.user_avatar,
          department: row.department,
          department_id: row.department_id,
          points: row.points,
          streak_count: row.streak_count ?? 0,
          streak_multiplier: row.streak_multiplier ?? 1.0,
        }))
      )
      setLoading(false)
    },
  }
}

// =============================================================================
// DEPARTMENT COMPETITION HOOK
// =============================================================================

/**
 * Subscribe to department vs department competition updates.
 */
export function useDepartmentCompetition(tenantId: string, myDepartmentId?: string) {
  const [departments, setDepartments] = useState<DepartmentLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Initial fetch
  useEffect(() => {
    async function fetchDepartments() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('department_leaderboard')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('total_points', { ascending: false })
          .limit(10)

        if (fetchError) throw fetchError

        setDepartments(
          (data ?? []).map((row, idx) => ({
            rank: idx + 1,
            department_id: row.department_id,
            department_name: row.department_name,
            total_points: row.total_points,
            member_count: row.member_count,
            avg_points_per_member: row.avg_points_per_member,
            top_contributor_id: row.top_contributor_id,
            top_contributor_name: row.top_contributor_name,
            trend: row.trend ?? 'stable',
            previous_rank: row.previous_rank,
          }))
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch departments')
      } finally {
        setLoading(false)
      }
    }

    fetchDepartments()
  }, [tenantId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`department-comp:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'department_scores',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          setDepartments((current) => {
            const updated = [...current]
            const row = payload.new as Partial<DepartmentLeaderboardEntry>

            const existingIdx = updated.findIndex((d) => d.department_id === row.department_id)

            if (payload.event === 'DELETE') {
              updated.splice(existingIdx, 1)
            } else if (existingIdx !== -1) {
              updated[existingIdx] = {
                ...updated[existingIdx],
                total_points: row.total_points ?? updated[existingIdx].total_points,
                member_count: row.member_count ?? updated[existingIdx].member_count,
                trend: row.trend ?? updated[existingIdx].trend,
              }
            } else if (payload.event === 'INSERT') {
              updated.push({
                rank: 0,
                department_id: row.department_id ?? '',
                department_name: row.department_name ?? 'Unknown',
                total_points: row.total_points ?? 0,
                member_count: row.member_count ?? 0,
                avg_points_per_member: row.avg_points_per_member ?? 0,
                top_contributor_id: row.top_contributor_id ?? null,
                top_contributor_name: row.top_contributor_name ?? null,
                trend: 'stable',
              })
            }

            updated.sort((a, b) => b.total_points - a.total_points)
            return updated
          })
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId])

  return {
    departments,
    loading,
    error,
    isConnected,
    myDepartment: departments.find((d) => d.department_id === myDepartmentId),
  }
}

// =============================================================================
// USER POINTS HOOK
// =============================================================================

/**
 * Subscribe to current user's points updates.
 */
export function useUserArmorPoints(userId: string | null) {
  const [points, setPoints] = useState<number>(0)
  const [streak, setStreak] = useState(0)
  const [multiplier, setMultiplier] = useState(1.0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    // Initial fetch
    async function fetchPoints() {
      setLoading(true)
      const { data } = await supabase
        .from('user_armor_points')
        .select('total_points, streak_count, streak_multiplier')
        .eq('user_id', userId)
        .single()

      if (data) {
        setPoints(data.total_points ?? 0)
        setStreak(data.streak_count ?? 0)
        setMultiplier(data.streak_multiplier ?? 1.0)
      }
      setLoading(false)
    }

    fetchPoints()

    // Realtime subscription
    const channel = supabase
      .channel(`user-points:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_armor_points',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { total_points?: number; streak_count?: number; streak_multiplier?: number }
          setPoints(row.total_points ?? points)
          setStreak(row.streak_count ?? streak)
          setMultiplier(row.streak_multiplier ?? multiplier)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { points, streak, multiplier, loading }
}
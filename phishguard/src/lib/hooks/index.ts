/* eslint-disable react-hooks/set-state-in-effect */
/**
 * Notifications API Hook
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import type { Database } from '../supabase'

type Notification = Database['public']['Tables']['notifications']['Row']

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const markAsRead = useCallback(async (notificationId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    setNotifications(prev => prev.map(n => n.id === notificationId ? data : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    return data
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
    setUnreadCount(0)
  }, [userId])

  const deleteNotification = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
    const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1))
  }, [notifications])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}

/**
 * Audit Log Hook
 */
export function useAuditLogs(companyId?: string) {
  const [logs, setLogs] = useState<Database['public']['Tables']['audit_logs']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async (filters?: {
    user_id?: string
    action?: string
    table_name?: string
    start_date?: string
    end_date?: string
  }) => {
    if (!companyId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filters?.user_id) query = query.eq('user_id', filters.user_id)
      if (filters?.action) query = query.eq('action', filters.action)
      if (filters?.table_name) query = query.eq('table_name', filters.table_name)
      if (filters?.start_date) query = query.gte('created_at', filters.start_date)
      if (filters?.end_date) query = query.lte('created_at', filters.end_date)

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return { logs, loading, error, refetch: fetchLogs }
}

/**
 * User Management Hook
 */
export function useUsers(companyId?: string) {
  const [users, setUsers] = useState<Database['public']['Tables']['users']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    if (!companyId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  const inviteUser = useCallback(async (email: string, name: string, role: 'admin' | 'member' | 'viewer' = 'member') => {
    if (!companyId) throw new Error('Company ID required')

    // Create user record (actual invite flow handled by Supabase Auth)
    const { data, error } = await supabase
      .from('users')
      .insert({
        company_id: companyId,
        email,
        name,
        role
      })
      .select()
      .single()

    if (error) throw error
    setUsers(prev => [data, ...prev])
    return data
  }, [companyId])

  const updateUser = useCallback(async (userId: string, updates: Partial<Database['public']['Tables']['users']['Row']>) => {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    setUsers(prev => prev.map(u => u.id === userId ? data : u))
    return data
  }, [])

  const deactivateUser = useCallback(async (userId: string) => {
    return updateUser(userId, { role: 'viewer' }) // Soft deactivation by changing role
  }, [updateUser])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return { users, loading, error, refetch: fetchUsers, inviteUser, updateUser, deactivateUser }
}

/**
 * Landing Pages Hook
 */
export function useLandingPages(companyId?: string) {
  const [pages, setPages] = useState<Database['public']['Tables']['landing_pages']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPages = useCallback(async () => {
    if (!companyId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPages(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch landing pages')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  const createPage = useCallback(async (page: {
    company_id: string
    name: string
    slug: string
    headline?: string
    body_html?: string
    body_text?: string
    category?: 'default' | 'login' | 'verification' | 'document' | 'prize'
    difficulty_level?: 'easy' | 'medium' | 'hard'
    is_active?: boolean
  }) => {
    const { data, error } = await supabase
      .from('landing_pages')
      .insert(page)
      .select()
      .single()

    if (error) throw error
    setPages(prev => [data, ...prev])
    return data
  }, [])

  const updatePage = useCallback(async (id: string, updates: Partial<Database['public']['Tables']['landing_pages']['Row']>) => {
    const { data, error } = await supabase
      .from('landing_pages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setPages(prev => prev.map(p => p.id === id ? data : p))
    return data
  }, [])

  const deletePage = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('landing_pages')
      .delete()
      .eq('id', id)

    if (error) throw error
    setPages(prev => prev.filter(p => p.id !== id))
  }, [])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  return { pages, loading, error, refetch: fetchPages, createPage, updatePage, deletePage }
}

// Export all hooks
export { useTrainingTracks, useTrainingModules, useUserEnrollments } from './useTraining'
export { useCampaigns, useCampaignTargets, useCampaignAnalytics } from './useCampaigns'
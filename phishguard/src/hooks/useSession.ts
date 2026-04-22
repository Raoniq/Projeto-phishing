/**
 * useSession Hook
 *
 * Provides reactive session state from Supabase auth.
 * Uses onAuthStateChange to avoid polling.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { getSession } from '../lib/auth/session'

export interface UseSessionReturn {
  session: Session | null
  isLoading: boolean
  isExpired: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

/**
 * Hook to access the current Supabase session.
 * Automatically updates when auth state changes.
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpired, setIsExpired] = useState(false)

  // Initial session fetch
  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true)
      try {
        const currentSession = await getSession()
        setSession(currentSession)
        setIsExpired(false)
      } catch (error) {
        console.error('[useSession] Error loading session:', error)
        setSession(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  // Listen for auth state changes (avoids polling)
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.debug('[useSession] Auth state change:', event)

      if (event === 'TOKEN_REFRESHED') {
        setSession(newSession)
        setIsExpired(false)
        return
      }

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setIsExpired(false)
        return
      }

      if (newSession) {
        // Check if session is expired
        const expiresAt = newSession.expires_at
        const now = Math.floor(Date.now() / 1000)
        const isExpired = expiresAt ? expiresAt < now : false

        setSession(newSession)
        setIsExpired(isExpired)
      } else {
        setSession(null)
        setIsExpired(false)
      }
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('[useSession] Refresh error:', error.message)
      setSession(null)
    } else if (data.session) {
      setSession(data.session)
      setIsExpired(false)
    }
  }, [])

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('[useSession] Logout error:', error.message)
    }
    setSession(null)
    setIsExpired(false)
  }, [])

  return {
    session,
    isLoading,
    isExpired,
    refresh,
    logout,
  }
}
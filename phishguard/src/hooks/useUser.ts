/**
 * useUser Hook
 *
 * Provides reactive user profile data from the users table.
 * Depends on session for auth context.
 */

import { useState, useEffect } from 'react'
import { supabase, type Database } from '../lib/supabase'
import { useSession } from './useSession'
import type { User } from '@supabase/supabase-js'

export type UserProfile = Database['public']['Tables']['users']['Row']

export interface UseUserReturn {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAdmin: boolean
  refetch: () => Promise<void>
}

/**
 * Hook to access the current user and their profile.
 * Returns user from Supabase auth and profile from users table.
 */
export function useUser(): UseUserReturn {
  const { session } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      // Clear state if no session
      if (!session) {
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setUser(session.user)

      try {
        // Fetch user profile from users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('[useUser] Profile error:', profileError.message)
        }

        setProfile(profileData ?? null)
      } catch (error) {
        console.error('[useUser] Error:', error)
        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [session?.user?.id]) // Re-fetch when user changes

  const refetch = async () => {
    if (!session?.user) return

    setIsLoading(true)
    try {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', session.user.id)
        .single()

      setProfile(profileData ?? null)
    } catch (error) {
      console.error('[useUser] Refetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin',
    refetch,
  }
}
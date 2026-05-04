/**
 * AuthContext — React Context for real Supabase user data
 *
 * Provides user, profile, company, loading state, and signOut.
 * Replaces mock data in navigation components.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'
import { isMockMode, hasMockSession } from './session'
import { mockSupabaseAuth } from './mockAuth'

type UserProfile = Database['public']['Tables']['users']['Row']
type Company = Database['public']['Tables']['companies']['Row']

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  company: Company | null
  loading: boolean
  isInitialized: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  // loading: true only during initial session check
  const [loading, setLoading] = useState(true)
  // isInitialized: true after first session check completes (regardless of profile fetch)
  const [isInitialized, setIsInitialized] = useState(false)

  const fetchProfileAndCompany = async (authUser: User, quiet = false) => {
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (profileError || !profileData) {
      // Profile fetch failed (406 = RLS policy issue, 404 = user not found)
      // User is still logged in via session, just no profile/company data
      setProfile(null)
      setCompany(null)
      return
    }

    setProfile(profileData)

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id, name, plan, domain')
      .eq('id', profileData.company_id)
      .single()

    if (companyError || !companyData) {
      setCompany(null)
      return
    }

    setCompany(companyData)
  }

  useEffect(() => {
    let cancelled = false

    const initAuth = async () => {
      try {
        if (cancelled) return

        let session = null

        // In mock mode, check for mock session first
        if (isMockMode()) {
          const hasMock = hasMockSession()
          if (hasMock) {
            const { data } = await mockSupabaseAuth.getSession()
            session = data.session
          }
        } else {
          // Wrap getSession in a race with an 8-second timeout
          // to prevent indefinite hangs (e.g. GoTrue lock warnings on production)
          const getSessionWithTimeout = () => {
            let timeoutId: ReturnType<typeof setTimeout>
            const timeout = new Promise<{ data: { session: null } }>((resolve) => {
              timeoutId = setTimeout(() => {
                console.warn('[AuthContext] getSession timed out after 8s')
                resolve({ data: { session: null } })
              }, 8000)
            })
            return Promise.race([supabase.auth.getSession(), timeout]).finally(() => clearTimeout(timeoutId))
          }

          const { data } = await getSessionWithTimeout()
          session = data.session
        }

        if (cancelled) return

        if (session?.user) {
          setUser(session.user as User)
          // Fire-and-forget profile fetch - don't block loading on failure
          fetchProfileAndCompany(session.user).catch(() => {})
        } else {
          setUser(null)
          setProfile(null)
          setCompany(null)
        }
      } catch {
        if (!cancelled) {
          console.warn('[AuthContext] initAuth failed, treating as unauthenticated')
          setUser(null)
          setProfile(null)
          setCompany(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }

    setLoading(true)
    initAuth()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only handle SIGNED_IN and SIGNED_OUT for subsequent events
        // (initial session is handled by initAuth above)
        if (event === 'SIGNED_IN') {
          if (cancelled) return
          if (session?.user) {
            setUser(session.user)
            // Quiet: don't reset loading flag, just update profile/company
            await fetchProfileAndCompany(session.user, true)
          }
        } else if (event === 'SIGNED_OUT') {
          if (cancelled) return
          setUser(null)
          setProfile(null)
          setCompany(null)
        }
        // TOKEN_REFRESHED: ignore, session already valid
      }
    )

    // In mock mode, also subscribe to mock auth state changes
    let mockUnsubscribe: (() => void) | null = null
    if (isMockMode()) {
      mockUnsubscribe = mockSupabaseAuth.onAuthStateChange(async (session) => {
        if (cancelled) return
        if (session?.user) {
          setUser(session.user as User)
          await fetchProfileAndCompany(session.user, true)
        } else {
          setUser(null)
          setProfile(null)
          setCompany(null)
        }
      })
    }

    return () => {
      cancelled = true
      subscription.unsubscribe()
      mockUnsubscribe?.()
    }
  }, [])

  const signOut = async () => {
    if (isMockMode()) {
      await mockSupabaseAuth.signOut()
    } else {
      await supabase.auth.signOut()
    }
    setUser(null)
    setProfile(null)
    setCompany(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, company, loading, signOut, isInitialized }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
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

        // Get session with a 3s timeout to prevent blocking on hard reload.
        // On Cloudflare Pages, getSession() can hang if session detection
        // triggers redirects. We resolve with null session on timeout.
        let session = null
        try {
          const { data } = await Promise.race([
            supabase.auth.getSession(),
            new Promise<{ data: { session: null } }>(resolve =>
              setTimeout(() => resolve({ data: { session: null } }), 3000)
            )
          ])
          session = data.session
        } catch {
          session = null
        }

        if (cancelled) return

        if (session?.user) {
          setUser(session.user)
          // Fire-and-forget profile fetch - don't block loading on failure
          fetchProfileAndCompany(session.user).catch(() => {})
        } else {
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

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
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
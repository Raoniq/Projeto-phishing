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
      if (!quiet) console.error('[AuthContext] Failed to fetch profile:', profileError?.message)
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
      if (!quiet) console.error('[AuthContext] Failed to fetch company:', companyError?.message)
      setCompany(null)
      return
    }

    setCompany(companyData)
  }

  useEffect(() => {
    let cancelled = false

    const initAuth = async () => {
      if (cancelled) return
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()

      if (cancelled) return

      if (session?.user) {
        setUser(session.user)
        // Don't set loading=false yet — wait for profile/company
        await fetchProfileAndCompany(session.user)
      } else {
        setUser(null)
        setProfile(null)
        setCompany(null)
      }

      if (cancelled) return
      setLoading(false)
      setIsInitialized(true)
    }

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
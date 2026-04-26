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
  const [loading, setLoading] = useState(true)
  // Track if initial session check completed (distinct from profile loading)
  const [isInitialized, setIsInitialized] = useState(false)

  const fetchProfileAndCompany = async (authUser: User) => {
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (profileError || !profileData) {
      console.error('[AuthContext] Failed to fetch profile:', profileError?.message)
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
      console.error('[AuthContext] Failed to fetch company:', companyError?.message)
      setCompany(null)
      return
    }

    setCompany(companyData)
  }

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        await fetchProfileAndCompany(session.user)
      } else {
        setUser(null)
        setProfile(null)
        setCompany(null)
      }

      setLoading(false)
      setIsInitialized(true)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          if (session?.user) {
            setUser(session.user)
            await fetchProfileAndCompany(session.user)
          } else {
            setUser(null)
            setProfile(null)
            setCompany(null)
          }
        }
      }
    )

    return () => {
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
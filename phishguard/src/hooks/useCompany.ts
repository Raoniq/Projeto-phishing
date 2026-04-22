/**
 * useCompany Hook
 *
 * Provides reactive company/tenant context.
 * Used for multi-tenant isolation and settings access.
 */

import { useState, useEffect, useRef } from 'react'
import { supabase, type Database } from '../lib/supabase'
import { useSession } from './useSession'
import type { Session } from '@supabase/supabase-js'

export type Company = Database['public']['Tables']['companies']['Row']

export interface UseCompanyReturn {
  company: Company | null
  isLoading: boolean
  isOwner: boolean
  plan: Company['plan'] | null
  refetch: () => Promise<void>
}

/**
 * Hook to access the current user's company context.
 * Requires authenticated session.
 */
export function useCompany(): UseCompanyReturn {
  const { session } = useSession()
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    const loadCompany = async (currentSession: Session) => {
      if (!currentSession) {
        if (isMountedRef.current) {
          setCompany(null)
          setIsLoading(false)
        }
        return
      }

      if (isMountedRef.current) {
        setIsLoading(true)
      }

      try {
        // First get user profile to find company_id
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('company_id, role')
          .eq('auth_id', currentSession.user.id)
          .single()

        if (!isMountedRef.current) return

        if (profileError) {
          console.error('[useCompany] Profile error:', profileError.message)
          setCompany(null)
          setIsLoading(false)
          return
        }

        if (!profile?.company_id) {
          console.warn('[useCompany] User has no company_id')
          setCompany(null)
          setIsLoading(false)
          return
        }

        // Then fetch company data
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single()

        if (!isMountedRef.current) return

        if (companyError) {
          console.error('[useCompany] Company error:', companyError.message)
          setCompany(null)
        } else {
          setCompany(companyData)
        }
      } catch (error) {
        console.error('[useCompany] Error:', error)
        if (isMountedRef.current) {
          setCompany(null)
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    if (session) {
      loadCompany(session)
    } else {
      if (isMountedRef.current) {
        setCompany(null)
        setIsLoading(false)
      }
    }

    return () => {
      isMountedRef.current = false
    }
  }, [session?.user?.id])

  const refetch = async () => {
    if (!session) return

    setIsLoading(true)
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('company_id')
        .eq('auth_id', session.user.id)
        .single()

      if (profile?.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single()

        setCompany(companyData ?? null)
      }
    } catch (error) {
      console.error('[useCompany] Refetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    company,
    isLoading,
    isOwner: false, // TODO: Check ownership via ownership claim in users table
    plan: company?.plan ?? null,
    refetch,
  }
}
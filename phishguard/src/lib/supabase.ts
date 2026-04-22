/**
 * Supabase Client Configuration
 *
 * IMPORTANT: This client uses the ANON key for browser-safe operations only.
 * The SERVICE_ROLE_KEY must NEVER be exposed to the frontend - only Workers use it.
 *
 * All data access is governed by Row Level Security (RLS) policies defined
 * in supabase/migrations/0002_rls_policies.sql
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  )
}

/**
 * Main Supabase client for frontend use.
 * Uses ANON key - RLS policies enforce security.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-refresh session before expiry
    autoRefreshToken: true,
    // Persist session to localStorage
    persistSession: true,
    // Detect logout from other tabs
    detectSessionInUrl: true,
  },
})

/**
 * Type definitions for Supabase database entities.
 * These mirror the schema defined in supabase/migrations/0001_core_schema.sql
 */
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          domain: string
          plan: 'starter' | 'business' | 'enterprise' | 'white_label'
          settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      users: {
        Row: {
          id: string
          auth_id: string | null
          company_id: string
          email: string
          name: string
          role: 'super_admin' | 'admin' | 'manager' | 'viewer'
          department: string | null
          avatar_url: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      learning_tracks: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          category: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          duration_minutes: number
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['learning_tracks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['learning_tracks']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          company_id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_data: Record<string, unknown> | null
          new_data: Record<string, unknown> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never // Immutable - no updates allowed
      }
    }
    Views: {
      [_ in string]: never
    }
    Functions: {
      get_user_company_id: {
        Args: Record<string, never>
        Returns: string
      }
      is_user_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in string]: never
    }
  }
}
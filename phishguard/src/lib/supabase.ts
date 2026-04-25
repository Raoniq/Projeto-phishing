/**
 * Supabase Client Configuration
 *
 * IMPORTANT: This client uses the ANON key for browser-safe operations only.
 * The SERVICE_ROLE_KEY must NEVER be exposed to the frontend - only Workers use it.
 *
 * All data access is governed by Row Level Security (RLS) policies.
 * Database schema is defined in supabase/migrations/0001_core_schema.sql and subsequent migrations.
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dqalvguekknmwrrkeibx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - using mock mode')
}

/**
 * Main Supabase client for frontend use.
 * Uses ANON key - RLS policies enforce security.
 */
export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

/**
 * Type definitions for ALL Supabase database entities.
 * Updated to match all migrations (0001-0022).
 */
export interface Database {
  public: {
    Tables: {
      // ============================================
      // Core Tables (0001_core_schema.sql)
      // ============================================
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
        Insert: {
          name: string
          domain: string
          plan?: 'starter' | 'business' | 'enterprise' | 'white_label'
          settings?: Record<string, unknown>
        }
        Update: Partial<{
          name: string
          domain: string
          plan: 'starter' | 'business' | 'enterprise' | 'white_label'
          settings: Record<string, unknown>
        }>
      }

      users: {
        Row: {
          id: string
          auth_id: string | null
          company_id: string
          email: string
          name: string
          role: 'admin' | 'member' | 'viewer'
          department: string | null
          avatar_url: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          auth_id?: string | null
          company_id: string
          email: string
          name: string
          role?: 'admin' | 'member' | 'viewer'
          department?: string | null
          avatar_url?: string | null
        }
        Update: Partial<{
          auth_id: string | null
          email: string
          name: string
          role: 'admin' | 'member' | 'viewer'
          department: string | null
          avatar_url: string | null
          last_login_at: string | null
        }>
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
        Insert: {
          company_id: string
          name: string
          description?: string | null
          category: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          duration_minutes?: number
          image_url?: string | null
          is_active?: boolean
        }
        Update: Partial<{
          name: string
          description: string | null
          category: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          duration_minutes: number
          image_url: string | null
          is_active: boolean
        }>
      }

      learning_modules: {
        Row: {
          id: string
          track_id: string
          name: string
          description: string | null
          content_type: 'article' | 'video' | 'quiz' | 'interactive'
          content: Record<string, unknown>
          order_index: number
          duration_minutes: number
          passing_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          track_id: string
          name: string
          description?: string | null
          content_type: 'article' | 'video' | 'quiz' | 'interactive'
          content?: Record<string, unknown>
          order_index?: number
          duration_minutes?: number
          passing_score?: number | null
        }
        Update: Partial<{
          name: string
          description: string | null
          content_type: 'article' | 'video' | 'quiz' | 'interactive'
          content: Record<string, unknown>
          order_index: number
          duration_minutes: number
          passing_score: number | null
        }>
      }

      user_track_enrollments: {
        Row: {
          id: string
          user_id: string
          track_id: string
          status: 'enrolled' | 'in_progress' | 'completed' | 'dropped'
          progress: number
          enrolled_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          track_id: string
          status?: 'enrolled' | 'in_progress' | 'completed' | 'dropped'
          progress?: number
        }
        Update: Partial<{
          status: 'enrolled' | 'in_progress' | 'completed' | 'dropped'
          progress: number
          completed_at: string | null
        }>
      }

      user_journey_states: {
        Row: {
          id: string
          user_id: string
          company_id: string
          current_tier: number
          risk_score: number
          last_phishing_attempt_at: string | null
          total_campaigns_participated: number
          total_campaigns_failed: number
          streak_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          company_id: string
          current_tier?: number
          risk_score?: number
          last_phishing_attempt_at?: string | null
          total_campaigns_participated?: number
          total_campaigns_failed?: number
          streak_days?: number
        }
        Update: Partial<{
          current_tier: number
          risk_score: number
          last_phishing_attempt_at: string | null
          total_campaigns_participated: number
          total_campaigns_failed: number
          streak_days: number
        }>
      }

      campaign_templates: {
        Row: {
          id: string
          company_id: string
          name: string
          subject: string
          body_html: string
          body_text: string | null
          category: 'general' | 'banking' | 'rh' | 'it' | 'government' | 'social'
          difficulty_level: 'easy' | 'medium' | 'hard'
          clickbait_score: number
          is_active: boolean
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          subject: string
          body_html: string
          body_text?: string | null
          category?: 'general' | 'banking' | 'rh' | 'it' | 'government' | 'social'
          difficulty_level?: 'easy' | 'medium' | 'hard'
          clickbait_score?: number
          is_active?: boolean
        }
        Update: Partial<{
          name: string
          subject: string
          body_html: string
          body_text: string | null
          category: 'general' | 'banking' | 'rh' | 'it' | 'government' | 'social'
          difficulty_level: 'easy' | 'medium' | 'hard'
          clickbait_score: number
          is_active: boolean
          usage_count: number
        }>
      }

      campaigns: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          template_id: string | null
          status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          target_count: number
          settings: Record<string, unknown>
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          description?: string | null
          template_id?: string | null
          status?: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
          scheduled_at?: string | null
          target_count?: number
          settings?: Record<string, unknown>
          created_by?: string | null
        }
        Update: Partial<{
          name: string
          description: string | null
          template_id: string | null
          status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          target_count: number
          settings: Record<string, unknown>
        }>
      }

      campaign_targets: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          email: string
          tracking_id: string
          landed_url: string | null
          status: 'pending' | 'sent' | 'opened' | 'clicked' | 'reported' | 'failed'
          sent_at: string | null
          opened_at: string | null
          clicked_at: string | null
          reported_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          user_id: string
          email: string
          tracking_id?: string
          landed_url?: string | null
          status?: 'pending' | 'sent' | 'opened' | 'clicked' | 'reported' | 'failed'
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          reported_at?: string | null
        }
        Update: Partial<{
          landed_url: string | null
          status: 'pending' | 'sent' | 'opened' | 'clicked' | 'reported' | 'failed'
          sent_at: string | null
          opened_at: string | null
          clicked_at: string | null
          reported_at: string | null
        }>
      }

      campaign_events: {
        Row: {
          id: string
          campaign_target_id: string
          event_type: 'sent' | 'opened' | 'clicked' | 'reported' | 'failed'
          ip_address: string | null
          user_agent: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          campaign_target_id: string
          event_type: 'sent' | 'opened' | 'clicked' | 'reported' | 'failed'
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Record<string, unknown>
        }
        Update: never // Immutable
      }

      department_scores: {
        Row: {
          id: string
          company_id: string
          department: string
          avg_risk_score: number
          total_users: number
          total_campaigns: number
          phishing_attempts: number
          phishing_failed: number
          success_rate: number
          calculated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          department: string
          avg_risk_score?: number
          total_users?: number
          total_campaigns?: number
          phishing_attempts?: number
          phishing_failed?: number
          success_rate?: number
          calculated_at?: string
        }
        Update: Partial<{
          avg_risk_score: number
          total_users: number
          total_campaigns: number
          phishing_attempts: number
          phishing_failed: number
          success_rate: number
          calculated_at: string
        }>
      }

      risk_scores: {
        Row: {
          id: string
          user_id: string
          company_id: string
          score: number
          score_breakdown: Record<string, unknown>
          risk_factors: unknown[]
          calculated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          company_id: string
          score: number
          score_breakdown?: Record<string, unknown>
          risk_factors?: unknown[]
          calculated_at?: string
        }
        Update: Partial<{
          score: number
          score_breakdown: Record<string, unknown>
          risk_factors: unknown[]
          calculated_at: string
        }>
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
        Insert: {
          company_id: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Record<string, unknown> | null
          new_data?: Record<string, unknown> | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: never // Immutable
      }

      // ============================================
      // Landing Pages (0005)
      // ============================================
      landing_pages: {
        Row: {
          id: string
          company_id: string
          name: string
          slug: string
          headline: string | null
          body_html: string
          body_text: string | null
          category: 'default' | 'login' | 'verification' | 'document' | 'prize'
          difficulty_level: 'easy' | 'medium' | 'hard'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          slug: string
          headline?: string | null
          body_html?: string
          body_text?: string | null
          category?: 'default' | 'login' | 'verification' | 'document' | 'prize'
          difficulty_level?: 'easy' | 'medium' | 'hard'
          is_active?: boolean
        }
        Update: Partial<{
          name: string
          slug: string
          headline: string | null
          body_html: string
          body_text: string | null
          category: 'default' | 'login' | 'verification' | 'document' | 'prize'
          difficulty_level: 'easy' | 'medium' | 'hard'
          is_active: boolean
        }>
      }

      // ============================================
      // Harvested Credentials (0006)
      // ============================================
      harvested_credentials: {
        Row: {
          id: string
          campaign_target_id: string | null
          email: string
          password: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          campaign_target_id?: string | null
          email: string
          password?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Record<string, unknown>
        }
        Update: Partial<{
          password: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Record<string, unknown>
        }>
      }

      // ============================================
      // Quishing Campaigns (0009)
      // ============================================
      quishing_campaigns: {
        Row: {
          id: string
          company_id: string
          name: string
          status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          target_count: number
          settings: Record<string, unknown>
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          status?: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
          scheduled_at?: string | null
          target_count?: number
          settings?: Record<string, unknown>
          created_by?: string | null
        }
        Update: Partial<{
          status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          target_count: number
          settings: Record<string, unknown>
        }>
      }

      quishing_qrcodes: {
        Row: {
          id: string
          campaign_id: string
          target_email: string
          tracking_id: string
          landed_url: string | null
          status: 'pending' | 'scanned' | 'clicked' | 'reported'
          scanned_at: string | null
          created_at: string
        }
        Insert: {
          campaign_id: string
          target_email: string
          tracking_id?: string
          landed_url?: string | null
          status?: 'pending' | 'scanned' | 'clicked' | 'reported'
          scanned_at?: string | null
        }
        Update: Partial<{
          landed_url: string | null
          status: 'pending' | 'scanned' | 'clicked' | 'reported'
          scanned_at: string | null
        }>
      }

      quishing_scan_events: {
        Row: {
          id: string
          qr_id: string
          event_type: 'scanned' | 'clicked' | 'reported'
          ip_address: string | null
          user_agent: string | null
          device_info: Record<string, unknown>
          location: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          qr_id: string
          event_type: 'scanned' | 'clicked' | 'reported'
          ip_address?: string | null
          user_agent?: string | null
          device_info?: Record<string, unknown>
          location?: Record<string, unknown> | null
        }
        Update: never
      }

      // ============================================
      // ISCA Domains (0010)
      // ============================================
      isca_domains: {
        Row: {
          id: string
          company_id: string
          domain: string
          type: 'legitimate' | 'typosquatting' | 'lookalike' | 'suspicious'
          risk_level: number
          target_brand: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          domain: string
          type?: 'legitimate' | 'typosquatting' | 'lookalike' | 'suspicious'
          risk_level?: number
          target_brand?: string | null
          is_active?: boolean
        }
        Update: Partial<{
          domain: string
          type: 'legitimate' | 'typosquatting' | 'lookalike' | 'suspicious'
          risk_level: number
          target_brand: string | null
          is_active: boolean
        }>
      }

      // ============================================
      // Training System (0011)
      // ============================================
      training_tracks: {
        Row: {
          id: string
          name: string
          description: string | null
          difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
          estimated_duration_minutes: number | null
          is_required: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null
          estimated_duration_minutes?: number | null
          is_required?: boolean
        }
        Update: Partial<{
          name: string
          description: string | null
          difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
          estimated_duration_minutes: number | null
          is_required: boolean
        }>
      }

      training_modules: {
        Row: {
          id: string
          track_id: string
          title: string
          sequence_order: number | null
          content_type: 'video' | 'interactive' | 'reading' | 'game' | null
          content_url: string | null
          duration_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          track_id: string
          title: string
          sequence_order?: number | null
          content_type?: 'video' | 'interactive' | 'reading' | 'game' | null
          content_url?: string | null
          duration_minutes?: number | null
        }
        Update: Partial<{
          title: string
          sequence_order: number | null
          content_type: 'video' | 'interactive' | 'reading' | 'game' | null
          content_url: string | null
          duration_minutes: number | null
        }>
      }

      training_lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          content: string | null
          sequence_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          module_id: string
          title: string
          content?: string | null
          sequence_order?: number | null
        }
        Update: Partial<{
          title: string
          content: string | null
          sequence_order: number | null
        }>
      }

      user_training_enrollments: {
        Row: {
          id: string
          user_id: string
          track_id: string
          assigned_due_date: string | null
          assigned_reason: string | null
          status: 'assigned' | 'in_progress' | 'completed' | 'overdue'
          enrolled_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          track_id: string
          assigned_due_date?: string | null
          assigned_reason?: string | null
          status?: 'assigned' | 'in_progress' | 'completed' | 'overdue'
          enrolled_at?: string
          completed_at?: string | null
        }
        Update: Partial<{
          assigned_due_date: string | null
          assigned_reason: string | null
          status: 'assigned' | 'in_progress' | 'completed' | 'overdue'
          completed_at: string | null
        }>
      }

      certificates: {
        Row: {
          id: string
          certificate_number: string
          user_id: string
          track_id: string
          issued_at: string
          expires_at: string | null
          pdf_url: string | null
          verification_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          certificate_number: string
          user_id: string
          track_id: string
          issued_at?: string
          expires_at?: string | null
          pdf_url?: string | null
          verification_code?: string | null
        }
        Update: Partial<{
          pdf_url: string | null
          expires_at: string | null
        }>
      }

      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_name: string
          badge_icon: string | null
          badge_category: string | null
          earned_at: string
        }
        Insert: {
          user_id: string
          badge_name: string
          badge_icon?: string | null
          badge_category?: string | null
          earned_at?: string
        }
        Update: never
      }

      user_points: {
        Row: {
          id: string
          user_id: string
          points: number
          points_type: 'xp' | 'achievement' | 'streak'
          source: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          points: number
          points_type?: 'xp' | 'achievement' | 'streak'
          source?: string | null
        }
        Update: never
      }

      // ============================================
      // SMS Campaigns (0012)
      // ============================================
      sms_campaigns: {
        Row: {
          id: string
          company_id: string
          name: string
          message_template: string
          status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
          scheduled_at: string | null
          sent_count: number
          failed_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          message_template: string
          status?: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
          scheduled_at?: string | null
          sent_count?: number
          failed_count?: number
          created_by?: string | null
        }
        Update: Partial<{
          status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
          scheduled_at: string | null
          sent_count: number
          failed_count: number
        }>
      }

      sms_recipients: {
        Row: {
          id: string
          campaign_id: string
          phone_e164: string
          status: 'pending' | 'sent' | 'failed' | 'delivered'
          sent_at: string | null
          delivered_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          campaign_id: string
          phone_e164: string
          status?: 'pending' | 'sent' | 'failed' | 'delivered'
          sent_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
        }
        Update: Partial<{
          status: 'pending' | 'sent' | 'failed' | 'delivered'
          sent_at: string | null
          delivered_at: string | null
          error_message: string | null
        }>
      }

      sms_message_logs: {
        Row: {
          id: string
          campaign_id: string
          recipient_id: string | null
          message_id: string | null
          status: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          campaign_id: string
          recipient_id?: string | null
          message_id?: string | null
          status?: string | null
          ip_address?: string | null
        }
        Update: never
      }

      // ============================================
      // Advanced Segmentation (0013)
      // ============================================
      departments: {
        Row: {
          id: string
          company_id: string
          name: string
          cost_center: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          cost_center?: string | null
        }
        Update: Partial<{
          name: string
          cost_center: string | null
        }>
      }

      roles: {
        Row: {
          id: string
          company_id: string
          name: string
          permissions: unknown[]
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          permissions?: unknown[]
        }
        Update: Partial<{
          name: string
          permissions: unknown[]
        }>
      }

      locations: {
        Row: {
          id: string
          company_id: string
          name: string
          country: string | null
          region: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          country?: string | null
          region?: string | null
          timezone?: string | null
        }
        Update: Partial<{
          name: string
          country: string | null
          region: string | null
          timezone: string | null
        }>
      }

      employees: {
        Row: {
          id: string
          company_id: string
          user_id: string | null
          email: string
          name: string
          department_id: string | null
          role_id: string | null
          location_id: string | null
          hire_date: string | null
          status: 'active' | 'inactive' | 'terminated'
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          user_id?: string | null
          email: string
          name: string
          department_id?: string | null
          role_id?: string | null
          location_id?: string | null
          hire_date?: string | null
          status?: 'active' | 'inactive' | 'terminated'
          metadata?: Record<string, unknown>
        }
        Update: Partial<{
          user_id: string | null
          email: string
          name: string
          department_id: string | null
          role_id: string | null
          location_id: string | null
          hire_date: string | null
          status: 'active' | 'inactive' | 'terminated'
          metadata: Record<string, unknown>
        }>
      }

      smart_groups: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          criteria: Record<string, unknown>
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          description?: string | null
          criteria?: Record<string, unknown>
          is_active?: boolean
        }
        Update: Partial<{
          name: string
          description: string | null
          criteria: Record<string, unknown>
          is_active: boolean
        }>
      }

      // ============================================
      // Sending Schedules (0014)
      // ============================================
      sending_schedules: {
        Row: {
          id: string
          campaign_id: string
          scheduled_for: string
          batch_size: number
          batch_interval_minutes: number
          status: 'pending' | 'running' | 'completed' | 'cancelled'
          processed_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          scheduled_for: string
          batch_size?: number
          batch_interval_minutes?: number
          status?: 'pending' | 'running' | 'completed' | 'cancelled'
          processed_count?: number
        }
        Update: Partial<{
          scheduled_for: string
          batch_size: number
          batch_interval_minutes: number
          status: 'pending' | 'running' | 'completed' | 'cancelled'
          processed_count: number
        }>
      }

      // ============================================
      // Auto Training Assignment (0016)
      // ============================================
      auto_training_rules: {
        Row: {
          id: string
          company_id: string
          name: string
          trigger_type: 'new_user' | 'campaign_fail' | 'periodic' | 'risk_threshold' | null
          conditions: unknown[]
          track_ids: string[]
          priority: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          trigger_type?: 'new_user' | 'campaign_fail' | 'periodic' | 'risk_threshold' | null
          conditions?: unknown[]
          track_ids?: string[]
          priority?: number
          is_active?: boolean
        }
        Update: Partial<{
          name: string
          trigger_type: 'new_user' | 'campaign_fail' | 'periodic' | 'risk_threshold' | null
          conditions: unknown[]
          track_ids: string[]
          priority: number
          is_active: boolean
        }>
      }

      // ============================================
      // Industry Benchmarks (0017)
      // ============================================
      industry_benchmarks: {
        Row: {
          id: string
          industry: string
          company_size: 'small' | 'medium' | 'large' | 'enterprise' | null
          metric_type: string
          benchmark_value: number | null
          percentile_25: number | null
          percentile_50: number | null
          percentile_75: number | null
          sample_size: number | null
          calculated_at: string
        }
        Insert: {
          industry: string
          company_size?: 'small' | 'medium' | 'large' | 'enterprise' | null
          metric_type: string
          benchmark_value?: number | null
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          sample_size?: number | null
          calculated_at?: string
        }
        Update: Partial<{
          benchmark_value: number | null
          percentile_25: number | null
          percentile_50: number | null
          percentile_75: number | null
          sample_size: number | null
          calculated_at: string
        }>
      }

      // ============================================
      // Attachment Tracking (0018)
      // ============================================
      attachment_tracking: {
        Row: {
          id: string
          campaign_id: string
          file_name: string
          file_hash: string | null
          download_count: number
          unique_downloads: number
          created_at: string
        }
        Insert: {
          campaign_id: string
          file_name: string
          file_hash?: string | null
          download_count?: number
          unique_downloads?: number
        }
        Update: Partial<{
          download_count: number
          unique_downloads: number
        }>
      }

      // ============================================
      // Webhook System (0020)
      // ============================================
      webhooks: {
        Row: {
          id: string
          company_id: string
          name: string
          url: string
          secret: string | null
          events: string[]
          is_active: boolean
          failure_count: number
          last_triggered_at: string | null
          last_success_at: string | null
          last_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          url: string
          secret?: string | null
          events?: string[]
          is_active?: boolean
          failure_count?: number
          last_triggered_at?: string | null
          last_success_at?: string | null
          last_error?: string | null
        }
        Update: Partial<{
          url: string
          secret: string | null
          events: string[]
          is_active: boolean
          failure_count: number
          last_triggered_at: string | null
          last_success_at: string | null
          last_error: string | null
        }>
      }

      webhook_logs: {
        Row: {
          id: string
          webhook_id: string
          event_type: string
          payload: unknown | null
          response_status: number | null
          response_body: string | null
          duration_ms: number | null
          success: boolean
          created_at: string
        }
        Insert: {
          webhook_id: string
          event_type: string
          payload?: unknown | null
          response_status?: number | null
          response_body?: string | null
          duration_ms?: number | null
          success?: boolean
        }
        Update: never
      }

      // ============================================
      // Notifications (0021)
      // ============================================
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'campaign_created' | 'campaign_completed' | 'training_assigned' | 'training_completed' | 'badge_earned' | 'alert' | 'system'
          title: string
          body: string | null
          data: Record<string, unknown>
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          type: 'campaign_created' | 'campaign_completed' | 'training_assigned' | 'training_completed' | 'badge_earned' | 'alert' | 'system'
          title: string
          body?: string | null
          data?: Record<string, unknown>
          is_read?: boolean
          read_at?: string | null
        }
        Update: Partial<{
          is_read: boolean
          read_at: string | null
        }>
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
      update_updated_at_column: {
        Args: Record<string, never>
        Returns: unknown
      }
    }

    Enums: {
      [_ in string]: never
    }
  }
}
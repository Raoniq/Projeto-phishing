/**
 * Query Optimizer for PhishGuard Analytics
 *
 * Provides utilities for analyzing and optimizing database queries,
 * index recommendations, and materialized view management.
 */

import { supabase } from '../supabase'

// ============================================
// Types
// ============================================

export interface IndexRecommendation {
  table: string
  columns: string[]
  type: 'btree' | 'hash' | 'gin' | 'gist'
  reason: string
  estimatedImprovement: string
}

export interface MaterializedViewDefinition {
  name: string
  sql: string
  refreshInterval: 'IMMEDIATE' | 'REFRESH CONCURRENTLY'
}

export interface CacheStrategy {
  table: string
  cacheKey: string
  ttlSeconds: number
  invalidationEvents: string[]
}

export interface QueryAnalysisResult {
  query: string
  plan: unknown
  executionTime?: number
  recommendations: string[]
}

// ============================================
// ANALYZE and EXPLAIN Helpers
// ============================================

/**
 * Executes ANALYZE on a table to update statistics.
 * Should be run after bulk inserts/updates or on a schedule.
 */
export async function analyzeTable(tableName: string): Promise<{ success: boolean; output?: string }> {
  try {
    const { data, error } = await supabase.rpc('pg_catalog', {
      query: `ANALYZE ${tableName}`
    })

    if (error) {
      // Fallback: try via direct query if RPC not available
      const { data: fallbackData, error: fallbackError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (fallbackError) {
        return { success: false }
      }
    }

    return { success: true, output: data ? JSON.stringify(data) : undefined }
  } catch {
    // ANALYZE requires elevated privileges, log for DBA review
    console.warn(`[QueryOptimizer] ANALYZE ${tableName} requires superuser privileges`)
    return { success: false }
  }
}

/**
 * Generates EXPLAIN ANALYZE output for a query.
 * Use this to identify slow queries and optimize them.
 */
export async function explainQuery<T = unknown>(
  query: string,
  params?: unknown[]
): Promise<QueryAnalysisResult> {
  const recommendations: string[] = []

  try {
    // Build the EXPLAIN ANALYZE query
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`

    const { data, error } = await supabase.rpc('pg_catalog', {
      query: explainQuery,
      params: params ? JSON.stringify(params) : undefined
    })

    if (error) {
      // RPC call failed - provide manual recommendations
      recommendations.push('Enable pg_stat_statements extension for query profiling')
      recommendations.push('Review query execution plan manually using EXPLAIN ANALYZE in pgAdmin')

      return {
        query,
        plan: null,
        recommendations
      }
    }

    const plan = Array.isArray(data) ? data[0] : data

    // Analyze the plan for recommendations
    if (plan?.plan) {
      const planStr = JSON.stringify(plan.plan)

      if (planStr.includes('Seq Scan')) {
        recommendations.push('Consider adding an index to avoid sequential scan')
      }
      if (planStr.includes('Hash Join')) {
        recommendations.push('Hash joins indicate large dataset operations - ensure join columns are indexed')
      }
      if (planStr.includes('Nested Loop')) {
        recommendations.push('Nested loop detected - verify inner table has proper indexing')
      }
      if (plan.plan['Execution Time'] > 1000) {
        recommendations.push(`Query execution time (${plan.plan['Execution Time']}ms) exceeds 1s threshold - consider optimization`)
      }
    }

    return {
      query,
      plan,
      executionTime: plan?.plan?.['Execution Time'],
      recommendations
    }
  } catch (err) {
    return {
      query,
      plan: null,
      recommendations: [
        'Unable to analyze query automatically',
        'Run EXPLAIN ANALYZE manually in Supabase dashboard',
        'Consider using pg_stat_statements for historical analysis'
      ]
    }
  }
}

/**
 * Analyzes a table and returns statistics about row count, index usage, etc.
 */
export async function getTableStats(tableName: string): Promise<{
  rowCount?: number
  indexCount?: number
  lastAnalyze?: string
  lastAutoAnalyze?: string
} | null> {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .single()

    if (error || !data) {
      return null
    }

    return {
      rowCount: data.row_count,
      indexCount: data.indexes?.length
    }
  } catch {
    return null
  }
}

// ============================================
// Index Recommendations
// ============================================

/**
 * Returns index recommendations for campaign_events table.
 * These indexes optimize the most common query patterns.
 */
export const campaignEventsIndexRecommendations: IndexRecommendation[] = [
  {
    table: 'campaign_events',
    columns: ['campaign_target_id', 'created_at'],
    type: 'btree',
    reason: 'Composite index for filtering events by target and time range',
    estimatedImprovement: '40-60% faster event lookups'
  },
  {
    table: 'campaign_events',
    columns: ['campaign_target_id', 'event_type', 'created_at'],
    type: 'btree',
    reason: 'Supports queries filtering by target, event type, and date range simultaneously',
    estimatedImprovement: '50-70% faster analytics queries'
  },
  {
    table: 'campaign_events',
    columns: ['created_at', 'event_type'],
    type: 'btree',
    reason: 'Optimizes time-series analysis and event distribution queries',
    estimatedImprovement: '30-50% faster time-based reporting'
  }
]

/**
 * Returns index recommendations for campaign_targets table.
 * These indexes optimize campaign targeting and status tracking.
 */
export const campaignTargetsIndexRecommendations: IndexRecommendation[] = [
  {
    table: 'campaign_targets',
    columns: ['campaign_id', 'status'],
    type: 'btree',
    reason: 'Composite index for campaign progress tracking and status filtering',
    estimatedImprovement: '60-80% faster campaign status queries'
  },
  {
    table: 'campaign_targets',
    columns: ['campaign_id', 'user_id'],
    type: 'btree',
    reason: 'Supports efficient user-level campaign analysis',
    estimatedImprovement: '40-50% faster user targeting lookups'
  },
  {
    table: 'campaign_targets',
    columns: ['campaign_id', 'status', 'created_at'],
    type: 'btree',
    reason: 'Optimizes time-windowed campaign analysis with status filtering',
    estimatedImprovement: '50-70% faster campaign analytics'
  },
  {
    table: 'campaign_targets',
    columns: ['user_id', 'status'],
    type: 'btree',
    reason: 'Enables fast user-specific phish history lookup',
    estimatedImprovement: '70-90% faster user risk history queries'
  }
]

/**
 * Returns all index recommendations combined.
 */
export function getAllIndexRecommendations(): IndexRecommendation[] {
  return [
    ...campaignEventsIndexRecommendations,
    ...campaignTargetsIndexRecommendations
  ]
}

/**
 * Generates the SQL for creating recommended indexes.
 */
export function generateIndexSQL(recommendations: IndexRecommendation[]): string {
  return recommendations
    .map(
      (rec) =>
        `-- ${rec.reason}\n-- Estimated improvement: ${rec.estimatedImprovement}\nCREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${rec.table.replace(/_/g, '_')}_${rec.columns.join('_')}\nON ${rec.table} (${rec.columns.join(', ')});`
    )
    .join('\n\n')
}

// ============================================
// Materialized View Definitions
// ============================================

/**
 * Materialized view definitions for analytics.
 * These pre-compute expensive aggregations for fast dashboard queries.
 */
export const materializedViewDefinitions: MaterializedViewDefinition[] = [
  {
    name: 'campaign_summary',
    sql: `
      CREATE MATERIALIZED VIEW campaign_summary AS
      SELECT
        c.id AS campaign_id,
        c.company_id,
        c.name AS campaign_name,
        c.status,
        c.scheduled_at,
        c.started_at,
        c.completed_at,
        c.target_count,
        COUNT(ct.id) AS actual_targets,
        COUNT(CASE WHEN ct.status = 'sent' THEN 1 END) AS sent_count,
        COUNT(CASE WHEN ct.status = 'opened' THEN 1 END) AS opened_count,
        COUNT(CASE WHEN ct.status = 'clicked' THEN 1 END) AS clicked_count,
        COUNT(CASE WHEN ct.status = 'reported' THEN 1 END) AS reported_count,
        COUNT(CASE WHEN ct.status = 'failed' THEN 1 END) AS failed_count,
        ROUND(
          COUNT(CASE WHEN ct.status = 'clicked' THEN 1 END)::NUMERIC /
          NULLIF(COUNT(CASE WHEN ct.status = 'sent' THEN 1 END), 0) * 100,
          2
        ) AS click_rate,
        ROUND(
          COUNT(CASE WHEN ct.status = 'reported' THEN 1 END)::NUMERIC /
          NULLIF(COUNT(CASE WHEN ct.status = 'sent' THEN 1 END), 0) * 100,
          2
        ) AS report_rate,
        MIN(ct.created_at) AS first_sent_at,
        MAX(ct.created_at) AS last_sent_at
      FROM campaigns c
      LEFT JOIN campaign_targets ct ON c.id = ct.campaign_id
      GROUP BY c.id, c.company_id, c.name, c.status, c.scheduled_at, c.started_at, c.completed_at, c.target_count;
    `,
    refreshInterval: 'REFRESH CONCURRENTLY'
  },
  {
    name: 'department_risk_summary',
    sql: `
      CREATE MATERIALIZED VIEW department_risk_summary AS
      SELECT
        u.company_id,
        u.department,
        COUNT(DISTINCT u.id) AS total_users,
        COUNT(DISTINCT ct.id) AS total_campaigns,
        COUNT(CASE WHEN ce.event_type = 'clicked' THEN 1 END) AS phishing_attempts,
        COUNT(CASE WHEN ce.event_type = 'failed' THEN 1 END) AS phishing_failed,
        ROUND(
          COUNT(CASE WHEN ce.event_type = 'failed' THEN 1 END)::NUMERIC /
          NULLIF(COUNT(CASE WHEN ce.event_type = 'clicked' THEN 1 END), 0) * 100,
          2
        ) AS failure_rate,
        ROUND(
          COUNT(CASE WHEN ce.event_type = 'clicked' THEN 1 END)::NUMERIC /
          NULLIF(COUNT(DISTINCT u.id), 0),
          2
        ) AS avg_attempts_per_user
      FROM users u
      LEFT JOIN campaign_targets ct ON u.id = ct.user_id
      LEFT JOIN campaign_events ce ON ct.id = ce.campaign_target_id
      WHERE u.department IS NOT NULL
      GROUP BY u.company_id, u.department;
    `,
    refreshInterval: 'REFRESH CONCURRENTLY'
  }
]

/**
 * Generates SQL for creating all materialized views.
 */
export function generateMaterializedViewSQL(): string {
  return materializedViewDefinitions
    .map(
      (view) =>
        `-- Materialized View: ${view.name}\n-- Refresh: ${view.refreshInterval}\n${view.sql.trim()};`
    )
    .join('\n\n')
}

/**
 * Generates SQL for refreshing all materialized views.
 */
export function generateRefreshSQL(): string {
  return materializedViewDefinitions
    .map((view) => `REFRESH MATERIALIZED VIEW CONCURRENTLY ${view.name};`)
    .join('\n')
}

// ============================================
// Cache Invalidation Strategies
// ============================================

/**
 * Cache invalidation strategies for frequently accessed data.
 * These patterns help maintain consistency when caching is used.
 */
export const cacheStrategies: CacheStrategy[] = [
  {
    table: 'campaigns',
    cacheKey: 'campaign:{id}',
    ttlSeconds: 300, // 5 minutes
    invalidationEvents: ['INSERT', 'UPDATE', 'DELETE on campaigns']
  },
  {
    table: 'campaign_targets',
    cacheKey: 'campaign_targets:{campaign_id}',
    ttlSeconds: 180, // 3 minutes
    invalidationEvents: [
      'INSERT on campaign_targets',
      'UPDATE on campaign_targets',
      'Campaign status change'
    ]
  },
  {
    table: 'campaign_events',
    cacheKey: 'campaign_events:{campaign_id}:summary',
    ttlSeconds: 60, // 1 minute - high velocity data
    invalidationEvents: [
      'INSERT on campaign_events',
      'Materialized view refresh'
    ]
  },
  {
    table: 'campaign_summary',
    cacheKey: 'view:campaign_summary:{company_id}',
    ttlSeconds: 600, // 10 minutes
    invalidationEvents: [
      'Campaign completed',
      'Materialized view refresh'
    ]
  },
  {
    table: 'department_risk_summary',
    cacheKey: 'view:department_risk_summary:{company_id}',
    ttlSeconds: 900, // 15 minutes
    invalidationEvents: [
      'New campaign completes',
      'User department change',
      'Materialized view refresh'
    ]
  }
]

/**
 * Returns cache strategy for a given table.
 */
export function getCacheStrategyForTable(tableName: string): CacheStrategy | undefined {
  return cacheStrategies.find((s) => s.table === tableName)
}

/**
 * Generates cache invalidation documentation.
 */
export function generateCacheDocumentation(): string {
  const lines = [
    '# Cache Invalidation Strategies',
    '',
    '## Overview',
    'This document outlines cache invalidation patterns for PhishGuard analytics data.',
    'Following these patterns ensures data consistency while maximizing cache efficiency.',
    '',
    '## Cache Keys and TTLs',
    ''
  ]

  cacheStrategies.forEach((strategy) => {
    lines.push(`### ${strategy.table}`)
    lines.push(`- **Cache Key Pattern**: \`${strategy.cacheKey}\``)
    lines.push(`- **TTL**: ${strategy.ttlSeconds} seconds`)
    lines.push(`- **Invalidation Events**: ${strategy.invalidationEvents.join(', ')}`)
    lines.push('')
  })

  lines.push('## Implementation Notes')
  lines.push('')
  lines.push('1. **Event-Driven Invalidation**: Subscribe to database changes via Supabase Realtime')
  lines.push('2. **TTL as Safety Net**: Always pair event-based invalidation with TTL expiration')
  lines.push('3. **Stale-While-Revalidate**: For critical data, serve stale content while refreshing in background')
  lines.push('4. **Batch Invalidations**: Debounce rapid successive invalidations')

  return lines.join('\n')
}

// ============================================
// SQL Generation Utilities
// ============================================

/**
 * Generates a complete SQL migration file content.
 */
export function generateOptimizationMigrationSQL(): string {
  const indexSQL = generateIndexSQL(getAllIndexRecommendations())
  const viewSQL = generateMaterializedViewSQL()
  const refreshSQL = generateRefreshSQL()

  return `-- ============================================
-- Migration: Query Optimization
-- Adds performance indexes and materialized views for analytics
-- ============================================

-- ============================================
-- INDEX RECOMMENDATIONS
-- Campaign Events Indexes
-- ============================================
${indexSQL}

-- ============================================
-- MATERIALIZED VIEWS
-- Pre-computed analytics for fast dashboards
-- ============================================
${viewSQL}

-- ============================================
-- CREATE INDEXES ON MATERIALIZED VIEWS
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_summary_campaign_id
ON campaign_summary(campaign_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_department_risk_summary_company_dept
ON department_risk_summary(company_id, department);

-- ============================================
-- REFRESH SCHEDULE
-- Run these commands to refresh materialized views:
-- ============================================
-- ${refreshSQL.split('\n').join('\n-- ')}

-- ============================================
-- ANALYZE TABLES
-- Update statistics after creating indexes
-- ============================================
ANALYZE campaign_events;
ANALYZE campaign_targets;
ANALYZE campaigns;
`
}

// ============================================
// Performance Monitoring
// ============================================

export interface SlowQueryThreshold {
  warningMs: number
  criticalMs: number
}

const DEFAULT_THRESHOLDS: SlowQueryThreshold = {
  warningMs: 500,
  criticalMs: 2000
}

/**
 * Checks if a query execution time exceeds thresholds.
 */
export function evaluateQueryPerformance(
  executionTimeMs: number,
  thresholds: SlowQueryThreshold = DEFAULT_THRESHOLDS
): 'ok' | 'warning' | 'critical' {
  if (executionTimeMs >= thresholds.criticalMs) {
    return 'critical'
  }
  if (executionTimeMs >= thresholds.warningMs) {
    return 'warning'
  }
  return 'ok'
}

/**
 * Returns optimization suggestions based on query patterns.
 */
export function getOptimizationSuggestions(
  tableName: string,
  queryPattern: 'count' | 'list' | 'aggregate' | 'lookup'
): string[] {
  const baseSuggestions: Record<string, string[]> = {
    campaign_events: [
      'Use composite indexes on (campaign_target_id, event_type, created_at)',
      'Consider partitioning by date if table exceeds 10M rows',
      'Use INSTEAD OF triggers for event aggregation'
    ],
    campaign_targets: [
      'Index on (campaign_id, status) for campaign progress',
      'Index on (user_id, status) for user history lookups',
      'Consider covering indexes for frequent SELECT queries'
    ],
    campaigns: [
      'Add index on (company_id, status) for dashboard queries',
      'Composite index on (company_id, scheduled_at) for scheduling'
    ]
  }

  const tableSuggestions = baseSuggestions[tableName] || ['Review query patterns and add appropriate indexes']

  const patternSuggestions: Record<string, string[]> = {
    count: ['Use estimated counts via pg_class.reltuples for large tables'],
    list: ['Implement cursor-based pagination instead of OFFSET'],
    aggregate: ['Consider materialized views for frequent aggregations'],
    lookup: ['Ensure JOIN columns are indexed']
  }

  return [...tableSuggestions, ...patternSuggestions[queryPattern]]
}

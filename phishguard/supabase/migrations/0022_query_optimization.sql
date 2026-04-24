-- ============================================
-- Migration 0021: Query Optimization
-- Adds performance indexes and materialized views for analytics
-- Created: Performance optimization wave
-- ============================================

-- ============================================
-- INDEX RECOMMENDATIONS
-- Campaign Events Indexes
-- ============================================

-- Composite index for filtering events by target and time range
-- Estimated improvement: 40-60% faster event lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_events_campaign_target_created
ON campaign_events (campaign_target_id, created_at);

-- Supports queries filtering by target, event type, and date range simultaneously
-- Estimated improvement: 50-70% faster analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_events_target_type_created
ON campaign_events (campaign_target_id, event_type, created_at);

-- Optimizes time-series analysis and event distribution queries
-- Estimated improvement: 30-50% faster time-based reporting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_events_created_type
ON campaign_events (created_at, event_type);

-- ============================================
-- Campaign Targets Indexes
-- ============================================

-- Composite index for campaign progress tracking and status filtering
-- Estimated improvement: 60-80% faster campaign status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_targets_campaign_status
ON campaign_targets (campaign_id, status);

-- Supports efficient user-level campaign analysis
-- Estimated improvement: 40-50% faster user targeting lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_targets_campaign_user
ON campaign_targets (campaign_id, user_id);

-- Optimizes time-windowed campaign analysis with status filtering
-- Estimated improvement: 50-70% faster campaign analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_targets_campaign_status_created
ON campaign_targets (campaign_id, status, created_at);

-- Enables fast user-specific phish history lookup
-- Estimated improvement: 70-90% faster user risk history queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_targets_user_status
ON campaign_targets (user_id, status);

-- ============================================
-- MATERIALIZED VIEWS
-- Pre-computed analytics for fast dashboards
-- ============================================

-- campaign_summary: Aggregated campaign metrics
-- Refresh: REFRESH CONCURRENTLY (allows reads during refresh)
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

-- department_risk_summary: Department-level risk metrics
-- Refresh: REFRESH CONCURRENTLY (allows reads during refresh)
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

-- ============================================
-- CREATE INDEXES ON MATERIALIZED VIEWS
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_summary_campaign_id
ON campaign_summary(campaign_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_department_risk_summary_company_dept
ON department_risk_summary(company_id, department);

-- ============================================
-- ANALYZE TABLES
-- Update statistics after creating indexes
-- ============================================
ANALYZE campaign_events;
ANALYZE campaign_targets;
ANALYZE campaigns;

-- ============================================
-- REFRESH MATERIALIZED VIEWS
-- Run these commands manually or via pg_cron:
--
-- REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_summary;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY department_risk_summary;
--
-- Recommended schedule:
-- - campaign_summary: Every 5 minutes during business hours
-- - department_risk_summary: Every 15 minutes
-- ============================================

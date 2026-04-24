-- ============================================
-- Migration 0017: Industry Benchmarks
-- Creates industry_benchmarks table for comparing company metrics
-- against industry averages and best practices
-- ============================================

-- ============================================
-- Industry Benchmarks Table
-- Stores aggregated benchmark data by industry sector
-- ============================================
CREATE TABLE IF NOT EXISTS industry_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry VARCHAR(100) NOT NULL,
    metric VARCHAR(100) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    percentile INT CHECK (percentile >= 0 AND percentile <= 100),
    collected_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(industry, metric, percentile)
);

-- ============================================
-- Indexes for efficient lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_industry ON industry_benchmarks(industry);
CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_metric ON industry_benchmarks(metric);
CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_collected_at ON industry_benchmarks(collected_at DESC);

-- ============================================
-- Row Level Security Policies
-- Benchmarks are read-only for all authenticated users
-- ============================================
ALTER TABLE industry_benchmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read benchmarks
CREATE POLICY "Authenticated users can read industry benchmarks"
ON industry_benchmarks FOR SELECT
TO authenticated
USING (true);

-- Policy: Only service role can insert/update/delete benchmarks
CREATE POLICY "Service role can manage industry benchmarks"
ON industry_benchmarks FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Seed Data: Initial benchmark values
-- ============================================
INSERT INTO industry_benchmarks (industry, metric, value, percentile, collected_at) VALUES
-- Finance Sector
('Finance', 'click_rate', 8.5, 50, NOW()),
('Finance', 'click_rate', 5.0, 75, NOW()),
('Finance', 'click_rate', 12.0, 25, NOW()),
('Finance', 'report_rate', 15.0, 50, NOW()),
('Finance', 'report_rate', 20.0, 75, NOW()),
('Finance', 'report_rate', 10.0, 25, NOW()),
('Finance', 'avg_time_to_click_seconds', 45, 50, NOW()),
('Finance', 'avg_time_to_click_seconds', 30, 75, NOW()),
('Finance', 'avg_time_to_click_seconds', 90, 25, NOW()),
('Finance', 'compromise_rate', 3.2, 50, NOW()),
('Finance', 'compromise_rate', 1.5, 75, NOW()),
('Finance', 'compromise_rate', 6.0, 25, NOW()),

-- Healthcare Sector
('Healthcare', 'click_rate', 6.8, 50, NOW()),
('Healthcare', 'click_rate', 4.0, 75, NOW()),
('Healthcare', 'click_rate', 10.5, 25, NOW()),
('Healthcare', 'report_rate', 12.0, 50, NOW()),
('Healthcare', 'report_rate', 18.0, 75, NOW()),
('Healthcare', 'report_rate', 7.0, 25, NOW()),
('Healthcare', 'avg_time_to_click_seconds', 58, 50, NOW()),
('Healthcare', 'avg_time_to_click_seconds', 40, 75, NOW()),
('Healthcare', 'avg_time_to_click_seconds', 120, 25, NOW()),
('Healthcare', 'compromise_rate', 4.1, 50, NOW()),
('Healthcare', 'compromise_rate', 2.0, 75, NOW()),
('Healthcare', 'compromise_rate', 7.5, 25, NOW()),

-- Technology Sector
('Technology', 'click_rate', 7.2, 50, NOW()),
('Technology', 'click_rate', 4.5, 75, NOW()),
('Technology', 'click_rate', 11.0, 25, NOW()),
('Technology', 'report_rate', 20.0, 50, NOW()),
('Technology', 'report_rate', 28.0, 75, NOW()),
('Technology', 'report_rate', 12.0, 25, NOW()),
('Technology', 'avg_time_to_click_seconds', 42, 50, NOW()),
('Technology', 'avg_time_to_click_seconds', 25, 75, NOW()),
('Technology', 'avg_time_to_click_seconds', 80, 25, NOW()),
('Technology', 'compromise_rate', 2.8, 50, NOW()),
('Technology', 'compromise_rate', 1.2, 75, NOW()),
('Technology', 'compromise_rate', 5.5, 25, NOW())

ON CONFLICT (industry, metric, percentile) DO UPDATE SET
    value = EXCLUDED.value,
    collected_at = EXCLUDED.collected_at,
    updated_at = NOW();

-- ============================================
-- Migration Complete
-- ============================================
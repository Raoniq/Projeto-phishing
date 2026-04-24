-- ============================================
-- Migration 0018: Attachment Tracking
-- Creates attachment_tracking table for tracking when attachments
-- are opened by recipients, with hash-based tracking
-- ============================================

-- ============================================
-- Attachment Tracking Table
-- Stores attachment open events linked to campaign targets
-- ============================================
CREATE TABLE IF NOT EXISTS attachment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_target_id UUID NOT NULL REFERENCES campaign_targets(id) ON DELETE CASCADE,
    attachment_name VARCHAR(255) NOT NULL,
    attachment_hash VARCHAR(64) NOT NULL,
    opened_at TIMESTAMPTZ,
    opened_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(campaign_target_id, attachment_hash)
);

-- ============================================
-- Indexes for efficient lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attachment_tracking_campaign_target ON attachment_tracking(campaign_target_id);
CREATE INDEX IF NOT EXISTS idx_attachment_tracking_hash ON attachment_tracking(attachment_hash);
CREATE INDEX IF NOT EXISTS idx_attachment_tracking_opened_at ON attachment_tracking(opened_at DESC);

-- ============================================
-- Row Level Security Policies
-- Attachment tracking data visible to authenticated users
-- ============================================
ALTER TABLE attachment_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read attachment tracking
CREATE POLICY "Authenticated users can read attachment tracking"
ON attachment_tracking FOR SELECT
TO authenticated
USING (true);

-- Policy: Service role can insert/update attachment tracking
CREATE POLICY "Service role can manage attachment tracking"
ON attachment_tracking FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Migration Complete
-- ============================================
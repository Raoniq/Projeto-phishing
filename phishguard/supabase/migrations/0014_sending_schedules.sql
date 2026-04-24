-- ============================================
-- Migration 0014: Sending Schedules Table
-- ============================================
-- Table: sending_schedules

-- ============================================
-- Sending Schedules Table
-- ============================================
CREATE TABLE sending_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES campaign_targets(id) ON DELETE CASCADE,
    scheduled_send_at TIMESTAMPTZ NOT NULL,
    actual_sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
    batch_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sending_schedules_campaign_id ON sending_schedules(campaign_id);
CREATE INDEX idx_sending_schedules_target_id ON sending_schedules(target_id);
CREATE INDEX idx_sending_schedules_scheduled ON sending_schedules(scheduled_send_at);

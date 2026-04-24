-- ============================================
-- Migration 0012: SMS Campaigns
-- Creates sms_campaigns, sms_recipients, and sms_message_logs tables
-- for SMS phishing campaign management
-- ============================================

-- ============================================
-- SMS Campaigns Table
-- Stores SMS campaign metadata and templates
-- ============================================
CREATE TABLE IF NOT EXISTS sms_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'CANCELLED')),
    message_template TEXT NOT NULL,
    sender_name VARCHAR(50),
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SMS Recipients Table
-- Stores individual recipients for each campaign
-- ============================================
CREATE TABLE IF NOT EXISTS sms_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'CLICKED', 'FAILED', 'OPTED_OUT')),
    opted_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(campaign_id, phone_number)
);

-- ============================================
-- SMS Message Logs Table
-- Tracks delivery and interaction events for each message
-- ============================================
CREATE TABLE IF NOT EXISTS sms_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES sms_recipients(id) ON DELETE CASCADE,
    provider_message_id VARCHAR(255),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'CLICKED', 'FAILED', 'UNDELIVERED')),
    num_segments INTEGER DEFAULT 1,
    short_url VARCHAR(255),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes for efficient lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON sms_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_scheduled_at ON sms_campaigns(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_sms_recipients_campaign_id ON sms_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_recipients_status ON sms_recipients(status);
CREATE INDEX IF NOT EXISTS idx_sms_recipients_opted_out ON sms_recipients(opted_out);

CREATE INDEX IF NOT EXISTS idx_sms_message_logs_campaign_id ON sms_message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_message_logs_recipient_id ON sms_message_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_sms_message_logs_status ON sms_message_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_message_logs_sent_at ON sms_message_logs(sent_at);

-- ============================================
-- Row Level Security Policies
-- ============================================
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_message_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read SMS campaigns
CREATE POLICY "Authenticated users can read SMS campaigns"
ON sms_campaigns FOR SELECT
TO authenticated
USING (true);

-- Policy: Service role can manage SMS campaigns
CREATE POLICY "Service role can manage SMS campaigns"
ON sms_campaigns FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Anyone authenticated can read SMS recipients
CREATE POLICY "Authenticated users can read SMS recipients"
ON sms_recipients FOR SELECT
TO authenticated
USING (true);

-- Policy: Service role can manage SMS recipients
CREATE POLICY "Service role can manage SMS recipients"
ON sms_recipients FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Anyone authenticated can read SMS message logs
CREATE POLICY "Authenticated users can read SMS message logs"
ON sms_message_logs FOR SELECT
TO authenticated
USING (true);

-- Policy: Service role can manage SMS message logs
CREATE POLICY "Service role can manage SMS message logs"
ON sms_message_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Migration Complete
-- ============================================

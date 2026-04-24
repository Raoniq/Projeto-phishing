-- ============================================
-- Migration 0020: Webhook System
-- Creates generic webhook system for outbound/inbound integrations
-- Features: outbound webhooks, inbound webhooks, webhook logs with retry logic
-- ============================================

-- ============================================
-- Webhooks Table
-- Stores webhook configurations for external integrations
-- ============================================
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    secret VARCHAR(255),
    headers JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Webhook Logs Table
-- Tracks all webhook deliveries with retry support
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    response_status INT,
    response_body TEXT,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes for efficient lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_webhooks_company_id ON webhooks(company_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_next_retry ON webhook_logs(next_retry_at) WHERE retry_count > 0 AND next_retry_at IS NOT NULL;

-- ============================================
-- Row Level Security Policies
-- ============================================
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Company admins can manage webhooks for their company
CREATE POLICY "Company admins can manage webhooks"
ON webhooks FOR ALL
TO authenticated
USING (
    company_id IN (
        SELECT id FROM companies WHERE id = get_user_company_id()
    )
);

-- Policy: Service role can manage all webhooks
CREATE POLICY "Service role can manage all webhooks"
ON webhooks FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Users can read webhook logs for their company's webhooks
CREATE POLICY "Users can read webhook logs for their company"
ON webhook_logs FOR SELECT
TO authenticated
USING (
    webhook_id IN (
        SELECT id FROM webhooks WHERE company_id IN (
            SELECT id FROM companies WHERE id = get_user_company_id()
        )
    )
);

-- Policy: Service role can manage all webhook logs
CREATE POLICY "Service role can manage all webhook logs"
ON webhook_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Helper Function: Generate HMAC signature
-- Used for outbound webhook payload signing
-- ============================================
CREATE OR REPLACE FUNCTION generate_webhook_signature(
    payload TEXT,
    secret VARCHAR(255)
) RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        hmac(
            payload::bytea,
            secret::bytea,
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Migration Complete
-- ============================================
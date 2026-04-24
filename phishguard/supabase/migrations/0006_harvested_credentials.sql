-- ============================================
-- Migration 0006: Harvested Credentials
-- Stores phishing-harvested credentials (hash-only)
-- Auto-expires after 30 days
-- ============================================

-- ============================================
-- Harvested Credentials Table
-- ============================================
CREATE TABLE harvested_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES campaign_targets(id) ON DELETE CASCADE,
    attempt_hash TEXT NOT NULL,  -- SHA-256 of email:password
    password_length INTEGER NOT NULL CHECK (password_length >= 0 AND password_length <= 128),
    email_hash TEXT NOT NULL,     -- SHA-256 of email only (for deduplication)
    ip_address INET,
    user_agent TEXT,
    harvested_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL  -- 30 days from harvest
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_harvested_credentials_campaign_id ON harvested_credentials(campaign_id);
CREATE INDEX idx_harvested_credentials_target_id ON harvested_credentials(target_id);
CREATE INDEX idx_harvested_credentials_expires_at ON harvested_credentials(expires_at);

-- ============================================
-- Auto-Delete Expired Credentials Function
-- ============================================
CREATE OR REPLACE FUNCTION delete_expired_credentials()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM harvested_credentials WHERE expires_at < now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run cleanup on each insert ( lightweight approach)
-- For high-volume, consider pg_cron instead
CREATE TRIGGER cleanup_expired_credentials
    AFTER INSERT ON harvested_credentials
    FOR EACH STATEMENT EXECUTE FUNCTION delete_expired_credentials();

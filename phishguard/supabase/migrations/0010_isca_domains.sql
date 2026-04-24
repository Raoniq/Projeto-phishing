-- ============================================
-- Migration 0010: ISCA Domains (Bait Domain Pool)
-- Bait domain pool for phishing campaigns
-- ============================================

-- ============================================
-- ISCA Domains Table
-- ============================================
CREATE TABLE isca_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    health TEXT DEFAULT 'unknown' CHECK (health IN ('healthy', 'warming', 'burned', 'unknown')),
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'retired')),
    reputation_score INTEGER DEFAULT 50 CHECK (reputation_score >= 0 AND reputation_score <= 100),
    health_check_url TEXT,
    -- Rotation metadata
    used_in_campaigns INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    max_campaigns_before_retirement INTEGER DEFAULT 3,
    -- Warming schedule (JSONB)
    warming_schedule JSONB DEFAULT '{"phase":"cold","dailyVolume":0,"targetVolume":500}',
    -- DNS records
    spf_record TEXT,
    dkim_record TEXT,
    dmarc_record TEXT,
    -- Domain metadata
    nameservers TEXT[],
    registered_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    notes TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Unique constraint: one domain per company
    UNIQUE(company_id, domain)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_isca_domains_company_id ON isca_domains(company_id);
CREATE INDEX idx_isca_domains_health ON isca_domains(health);
CREATE INDEX idx_isca_domains_status ON isca_domains(status);
CREATE INDEX idx_isca_domains_reputation ON isca_domains(reputation_score);

-- ============================================
-- Updated At Trigger
-- ============================================
CREATE TRIGGER update_isca_domains_updated_at
    BEFORE UPDATE ON isca_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE isca_domains ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for isca_domains
-- ============================================

-- Users can SELECT their company's domains
CREATE POLICY "Users can view company isca domains"
    ON isca_domains FOR SELECT
    USING (
        get_user_company_id() = isca_domains.company_id
    );

-- Admins can INSERT their company's domains
CREATE POLICY "Admins can insert company isca domains"
    ON isca_domains FOR INSERT
    WITH CHECK (
        get_user_company_id() = isca_domains.company_id AND
        is_user_admin()
    );

-- Users can UPDATE their company's domains
CREATE POLICY "Users can update company isca domains"
    ON isca_domains FOR UPDATE
    USING (
        get_user_company_id() = isca_domains.company_id
    );

-- Admins can DELETE their company's domains
CREATE POLICY "Admins can delete company isca domains"
    ON isca_domains FOR DELETE
    USING (
        get_user_company_id() = isca_domains.company_id AND
        is_user_admin()
    );

-- ============================================
-- Migration Complete
-- ============================================
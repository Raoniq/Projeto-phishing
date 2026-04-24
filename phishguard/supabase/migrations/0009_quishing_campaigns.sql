-- ============================================
-- Migration 0009: Quishing Campaigns
-- QR Code phishing campaign system
-- ============================================

-- ============================================
-- Quishing Campaigns Table
-- ============================================
CREATE TABLE quishing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    landing_page_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    target_count INTEGER DEFAULT 0,
    scan_count INTEGER DEFAULT 0,
    unique_scans INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_quishing_campaigns_company_id ON quishing_campaigns(company_id);
CREATE INDEX idx_quishing_campaigns_status ON quishing_campaigns(status);
CREATE INDEX idx_quishing_campaigns_scheduled_at ON quishing_campaigns(scheduled_at);

-- ============================================
-- QR Codes Table (individual QR codes per campaign)
-- ============================================
CREATE TABLE quishing_qrcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES quishing_campaigns(id) ON DELETE CASCADE,
    tracking_id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT,
    url_shortcode TEXT NOT NULL,  -- short code for QR URL: /qr/{tracking_id}
    foreground_color TEXT DEFAULT '#000000',
    background_color TEXT DEFAULT '#ffffff',
    logo_url TEXT,
    scan_count INTEGER DEFAULT 0,
    unique_scans INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quishing_qrcodes_campaign_id ON quishing_qrcodes(campaign_id);
CREATE INDEX idx_quishing_qrcodes_tracking_id ON quishing_qrcodes(tracking_id);
CREATE INDEX idx_quishing_qrcodes_url_shortcode ON quishing_qrcodes(url_shortcode);

-- ============================================
-- Quishing Scan Events
-- ============================================
CREATE TABLE quishing_scan_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qrcode_id UUID NOT NULL REFERENCES quishing_qrcodes(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES quishing_campaigns(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    scan_hour INTEGER DEFAULT 0 CHECK (scan_hour >= 0 AND scan_hour <= 23),
    is_unique BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quishing_scan_events_qrcode_id ON quishing_scan_events(qrcode_id);
CREATE INDEX idx_quishing_scan_events_campaign_id ON quishing_scan_events(campaign_id);
CREATE INDEX idx_quishing_scan_events_created_at ON quishing_scan_events(created_at DESC);
CREATE INDEX idx_quishing_scan_events_scan_hour ON quishing_scan_events(scan_hour);

-- ============================================
-- Updated At Trigger for quishing_campaigns
-- ============================================
CREATE TRIGGER update_quishing_campaigns_updated_at
    BEFORE UPDATE ON quishing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quishing_qrcodes_updated_at
    BEFORE UPDATE ON quishing_qrcodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE quishing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE quishing_qrcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quishing_scan_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for quishing_campaigns
-- ============================================

-- Users can SELECT their company's quishing campaigns
CREATE POLICY "Users can view company quishing campaigns"
    ON quishing_campaigns FOR SELECT
    USING (
        get_user_company_id() = quishing_campaigns.company_id
    );

-- Admins can INSERT their company's quishing campaigns
CREATE POLICY "Admins can insert company quishing campaigns"
    ON quishing_campaigns FOR INSERT
    WITH CHECK (
        get_user_company_id() = quishing_campaigns.company_id AND
        is_user_admin()
    );

-- Users can UPDATE their company's quishing campaigns
CREATE POLICY "Users can update company quishing campaigns"
    ON quishing_campaigns FOR UPDATE
    USING (
        get_user_company_id() = quishing_campaigns.company_id
    );

-- Admins can DELETE their company's quishing campaigns
CREATE POLICY "Admins can delete company quishing campaigns"
    ON quishing_campaigns FOR DELETE
    USING (
        get_user_company_id() = quishing_campaigns.company_id AND
        is_user_admin()
    );

-- ============================================
-- RLS Policies for quishing_qrcodes
-- ============================================

-- Users can SELECT their company's QR codes (via campaign)
CREATE POLICY "Users can view company QR codes"
    ON quishing_qrcodes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quishing_campaigns
            WHERE quishing_campaigns.id = quishing_qrcodes.campaign_id
            AND quishing_campaigns.company_id = get_user_company_id()
        )
    );

-- Admins can INSERT QR codes for their company's campaigns
CREATE POLICY "Admins can insert company QR codes"
    ON quishing_qrcodes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM quishing_campaigns
            WHERE quishing_campaigns.id = quishing_qrcodes.campaign_id
            AND quishing_campaigns.company_id = get_user_company_id()
            AND is_user_admin()
        )
    );

-- Users can UPDATE their company's QR codes
CREATE POLICY "Users can update company QR codes"
    ON quishing_qrcodes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM quishing_campaigns
            WHERE quishing_campaigns.id = quishing_qrcodes.campaign_id
            AND quishing_campaigns.company_id = get_user_company_id()
        )
    );

-- Admins can DELETE their company's QR codes
CREATE POLICY "Admins can delete company QR codes"
    ON quishing_qrcodes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM quishing_campaigns
            WHERE quishing_campaigns.id = quishing_qrcodes.campaign_id
            AND quishing_campaigns.company_id = get_user_company_id()
            AND is_user_admin()
        )
    );

-- ============================================
-- RLS Policies for quishing_scan_events
-- ============================================

-- Users can SELECT their company's scan events (via campaign/qrcode)
CREATE POLICY "Users can view company scan events"
    ON quishing_scan_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quishing_qrcodes qrc
            JOIN quishing_campaigns qc ON qc.id = qrc.campaign_id
            WHERE qrc.id = quishing_scan_events.qrcode_id
            AND qc.company_id = get_user_company_id()
        )
    );

-- Service role can INSERT scan events (edge function uses service key)
CREATE POLICY "Service role can insert scan events"
    ON quishing_scan_events FOR INSERT
    WITH CHECK (false);

-- No regular user modification of scan events
CREATE POLICY "No regular user update of scan events"
    ON quishing_scan_events FOR UPDATE
    USING (false);

CREATE POLICY "No regular user delete of scan events"
    ON quishing_scan_events FOR DELETE
    USING (false);

-- ============================================
-- RPC Function for incrementing scan counts
-- ============================================
CREATE OR REPLACE FUNCTION increment_qr_scan_count(
  p_qrcode_id UUID,
  p_campaign_id UUID,
  p_is_unique BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
  -- Increment QR code scan count
  UPDATE quishing_qrcodes
  SET scan_count = scan_count + 1
  WHERE id = p_qrcode_id;

  -- Increment unique scan count if applicable
  IF p_is_unique THEN
    UPDATE quishing_qrcodes
    SET unique_scans = unique_scans + 1
    WHERE id = p_qrcode_id;
  END IF;

  -- Increment campaign scan counts
  UPDATE quishing_campaigns
  SET scan_count = scan_count + 1
  WHERE id = p_campaign_id;

  -- Increment unique scan count on campaign if applicable
  IF p_is_unique THEN
    UPDATE quishing_campaigns
    SET unique_scans = unique_scans + 1
    WHERE id = p_campaign_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Migration Complete
-- ============================================
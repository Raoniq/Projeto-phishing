-- ============================================
-- Migration 0008: RLS Policies for New Tables
-- Wave 1, Task 4 - RLS for landing_pages and harvested_credentials
-- ============================================

-- ============================================
-- Enable RLS on New Tables
-- ============================================
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvested_credentials ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Landing Pages Policies
-- ============================================

-- Landing Pages: Users can SELECT their company's landing pages
CREATE POLICY "Users can view company landing pages"
    ON landing_pages FOR SELECT
    USING (
        get_user_company_id() = landing_pages.company_id
    );

-- Landing Pages: Admins can INSERT their company's landing pages
CREATE POLICY "Admins can insert company landing pages"
    ON landing_pages FOR INSERT
    WITH CHECK (
        get_user_company_id() = landing_pages.company_id AND
        is_user_admin()
    );

-- Landing Pages: Users can UPDATE their company's landing pages
CREATE POLICY "Users can update company landing pages"
    ON landing_pages FOR UPDATE
    USING (
        get_user_company_id() = landing_pages.company_id
    );

-- Landing Pages: Admins can DELETE their company's landing pages
CREATE POLICY "Admins can delete company landing pages"
    ON landing_pages FOR DELETE
    USING (
        get_user_company_id() = landing_pages.company_id AND
        is_user_admin()
    );

-- ============================================
-- Harvested Credentials Policies
-- ============================================

-- Harvested Credentials: Users can SELECT their company's credentials (via campaign)
CREATE POLICY "Users can view company harvested credentials"
    ON harvested_credentials FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = harvested_credentials.campaign_id
            AND campaigns.company_id = get_user_company_id()
        )
    );

-- Harvested Credentials: Admins can SELECT all (for reporting)
CREATE POLICY "Admins can view all harvested credentials"
    ON harvested_credentials FOR SELECT
    USING (is_user_admin());

-- Harvested Credentials: No INSERT for regular users (Edge Function only with service role)
-- Policy exists but denies regular users (service role bypasses RLS)
CREATE POLICY "Service role can insert harvested credentials"
    ON harvested_credentials FOR INSERT
    WITH CHECK (false);

-- Harvested Credentials: No DELETE for regular users
CREATE POLICY "No regular user deletion of harvested credentials"
    ON harvested_credentials FOR DELETE
    USING (false);

-- ============================================
-- Migration Complete
-- Next: Wave 2 Edge Functions
-- ============================================
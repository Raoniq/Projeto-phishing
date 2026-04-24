-- ============================================
-- Migration 0007: Landing Assets Storage Bucket
-- For landing page images and CSS assets
-- ============================================

-- Create storage bucket for landing assets
-- noir-900: Company-prefixed isolation for security
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'landing-assets',
    'landing-assets',
    false,  -- noir-900: Not public, company isolation required
    5242880,  -- 5MB in bytes
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'text/css']
);

-- ============================================
-- RLS Policies for landing-assets bucket
-- ============================================

-- noir-900: Company users can read their company assets only
CREATE POLICY "Users can read company landing assets"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'landing-assets'
        AND auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = (
                SELECT company_id FROM users WHERE auth_id = auth.uid()
            )
        )
    );

-- noir-900: Company users can upload to their company prefix only
CREATE POLICY "Users can upload to company landing assets"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'landing-assets'
        AND auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = (
                SELECT company_id FROM users WHERE auth_id = auth.uid()
            )
        )
    );

-- noir-900: Admins can manage all landing assets
CREATE POLICY "Admins can manage all landing assets"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'landing-assets'
        AND auth.uid() IN (
            SELECT auth_id FROM users WHERE role = 'admin'
        )
    );

-- noir-900: No deletion for regular users
CREATE POLICY "No user deletion of landing assets"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'landing-assets'
        AND auth.uid() IN (
            SELECT auth_id FROM users WHERE role = 'admin'
        )
    );
-- ============================================
-- Migration 0019: Spear Phishing Personalization Columns
-- ============================================
-- Adds manager_name and project_name columns to campaign_targets
-- for personalized spear phishing campaigns

-- ============================================
-- Add manager_name column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaign_targets' AND column_name = 'manager_name'
    ) THEN
        ALTER TABLE campaign_targets ADD COLUMN manager_name VARCHAR(100);
    END IF;
END $$;

-- ============================================
-- Add project_name column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaign_targets' AND column_name = 'project_name'
    ) THEN
        ALTER TABLE campaign_targets ADD COLUMN project_name VARCHAR(100);
    END IF;
END $$;

-- ============================================
-- Migration Complete
-- ============================================
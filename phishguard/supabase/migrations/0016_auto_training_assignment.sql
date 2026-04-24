-- ============================================
-- Migration 0016: Auto Training Assignment
-- Creates database function and trigger for automatic training assignment
-- when campaign targets fail phishing simulations
-- ============================================

-- Add failure_count column to campaign_targets if it doesn't exist
-- This tracks how many times a target has failed phishing simulations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaign_targets' AND column_name = 'failure_count'
    ) THEN
        ALTER TABLE campaign_targets ADD COLUMN failure_count INT DEFAULT 0;
    END IF;
END $$;

-- Add phishing_campaign_id column to user_training_enrollments if it doesn't exist
-- This links training enrollment to the phishing campaign that triggered it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_training_enrollments' AND column_name = 'phishing_campaign_id'
    ) THEN
        ALTER TABLE user_training_enrollments ADD COLUMN phishing_campaign_id UUID;
    END IF;
END $$;

-- ============================================
-- Function: assign_training_on_phishing_failure
-- Automatically assigns appropriate training track based on failure count
-- Difficulty levels:
--   - beginner: failure_count <= 1
--   - intermediate: failure_count <= 3
--   - advanced: failure_count > 3
-- Due date is set to 14 days from assignment
-- ============================================
CREATE OR REPLACE FUNCTION assign_training_on_phishing_failure(
    p_user_id UUID,
    p_campaign_id UUID,
    p_failure_count INT
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_training_enrollments (user_id, track_id, assigned_due_date, assigned_reason, phishing_campaign_id)
    SELECT
        p_user_id,
        t.id,
        NOW() + INTERVAL '14 days',
        'phishing_failure',
        p_campaign_id
    FROM training_tracks t
    WHERE t.is_required = true
      AND t.difficulty_level = (
          CASE
              WHEN p_failure_count <= 1 THEN 'beginner'
              WHEN p_failure_count <= 3 THEN 'intermediate'
              ELSE 'advanced'
          END
      )
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Migration Complete
-- ============================================
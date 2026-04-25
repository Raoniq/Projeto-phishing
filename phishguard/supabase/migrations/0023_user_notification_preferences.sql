-- Migration: 0023_user_notification_preferences.sql
-- User notification preferences per channel and event type
-- Allows users to configure which notifications they receive via email, in-app, SMS

BEGIN;

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'in_app', 'sms')),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'new_training_assigned',
        'campaign_launched',
        'campaign_results',
        'weekly_digest',
        'security_alert'
    )),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, channel, event_type)
);

-- Index for efficient queries
CREATE INDEX idx_user_notification_prefs_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_user_notification_prefs_user_channel ON user_notification_preferences(user_id, channel);
CREATE INDEX idx_user_notification_prefs_user_event ON user_notification_preferences(user_id, event_type);

-- RLS policies
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only view their own preferences
CREATE POLICY "Users can view own notification preferences"
    ON user_notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
    ON user_notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
    ON user_notification_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own notification preferences"
    ON user_notification_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- Function to upsert user notification preference
CREATE OR REPLACE FUNCTION upsert_user_notification_preference(
    p_user_id UUID,
    p_channel VARCHAR,
    p_event_type VARCHAR,
    p_enabled BOOLEAN
) RETURNS UUID AS $$
DECLARE
    pref_id UUID;
BEGIN
    INSERT INTO user_notification_preferences (user_id, channel, event_type, enabled)
    VALUES (p_user_id, p_channel, p_event_type, p_enabled)
    ON CONFLICT (user_id, channel, event_type)
    DO UPDATE SET enabled = p_enabled, updated_at = now()
    RETURNING id INTO pref_id;

    RETURN pref_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk upsert preferences (for channel-wide changes)
CREATE OR REPLACE FUNCTION bulk_upsert_user_notification_preferences(
    p_user_id UUID,
    p_channel VARCHAR,
    p_event_types VARCHAR[],
    p_enabled BOOLEAN
) RETURNS SETOF UUID AS $$
DECLARE
    pref_uuid UUID;
BEGIN
    FOREACH pref_uuid IN ARRAY p_event_types LOOP
        PERFORM upsert_user_notification_preference(p_user_id, p_channel, pref_uuid, p_enabled);
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for preferences table
ALTER PUBLICATION supabase_realtime ADD TABLE user_notification_preferences;

-- Trigger to auto-create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_channel VARCHAR;
    v_event VARCHAR;
BEGIN
    -- Default enabled channels and events
    FOR v_channel IN SELECT unnest(ARRAY['email', 'in_app', 'sms']) LOOP
        FOR v_event IN SELECT unnest(ARRAY[
            'new_training_assigned',
            'campaign_launched',
            'campaign_results',
            'weekly_digest',
            'security_alert'
        ]) LOOP
            -- Set sensible defaults: email enabled for most, in_app for all, sms only for security_alert
            IF v_channel = 'email' AND v_event = 'weekly_digest' THEN
                -- Weekly digest off by default for email
                CONTINUE;
            ELSIF v_channel = 'sms' AND v_event NOT IN ('security_alert', 'campaign_results') THEN
                -- SMS only for important notifications
                CONTINUE;
            ELSE
                INSERT INTO user_notification_preferences (user_id, channel, event_type, enabled)
                VALUES (p_user_id, v_channel, v_event, true)
                ON CONFLICT (user_id, channel, event_type) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
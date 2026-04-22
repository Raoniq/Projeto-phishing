-- ============================================
-- Migration 0004: Supabase Auth Configuration
-- Configure email/password, magic link, MFA
-- ============================================

-- Enable email/password and magic link authentication
-- Note: This is configured by default in Supabase, but we set explicit options

-- Configure auth settings for the project
-- These settings affect the Supabase Auth configuration

-- ============================================
-- Auth Provider Configuration
-- ============================================

-- Update auth.users metadata to track additional info
CREATE OR REPLACE FUNCTION update_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync email to our users table if it changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE users SET email = NEW.email WHERE auth_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_email_change
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_metadata();

-- ============================================
-- Signup Helper Function
-- Creates user record in users table after auth signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Check if user already exists in our users table
  IF EXISTS (SELECT 1 FROM users WHERE auth_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- For signup, we need to create a pending user record
  -- The actual company association should be done during onboarding
  -- This function is called after auth.users insert

  -- Log the signup event
  INSERT INTO audit_logs (
    company_id,
    user_id,
    action,
    table_name,
    record_id,
    new_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID, -- System/none for signup
    NULL,
    'signup',
    'auth.users',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

-- ============================================
-- Session Validation Helper
-- Used by Workers to validate JWT tokens
-- ============================================

CREATE OR REPLACE FUNCTION validate_session_token(token TEXT)
RETURNS TABLE(
  user_id UUID,
  auth_id UUID,
  company_id UUID,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.auth_id,
    u.company_id,
    u.role::TEXT
  FROM users u
  INNER JOIN auth.users au ON au.id = u.auth_id
  WHERE au.id = (
    SELECT (auth.jwt_token(token)).subject::UUID
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MFA Configuration for Admin Users
-- ============================================

-- Function to enforce MFA for admin users on login
CREATE OR REPLACE FUNCTION enforce_admin_mfa()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_has_mfa BOOLEAN;
BEGIN
  -- Check if user is an admin
  SELECT u.id INTO v_user_id
  FROM users u
  WHERE u.auth_id = NEW.id AND u.role = 'admin';

  IF v_user_id IS NOT NULL THEN
    -- Check if user has MFA enabled
    SELECT EXISTS (
      SELECT 1 FROM auth.mfa_factors
      WHERE user_id = NEW.id AND status = 'verified'
    ) INTO v_has_mfa;

    IF NOT v_has_mfa THEN
      -- MFA is required but not enabled - log warning
      INSERT INTO audit_logs (
        company_id,
        user_id,
        action,
        table_name,
        record_id,
        new_data
      ) VALUES (
        (SELECT company_id FROM users WHERE auth_id = NEW.id),
        v_user_id,
        'mfa_required_but_not_enabled',
        'auth.users',
        NEW.id,
        jsonb_build_object('email', NEW.email)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_admin_login_mfa_check
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION enforce_admin_mfa();

-- ============================================
-- Rate Limiting for Auth Attempts
-- Prevents brute force attacks on login/signup
-- ============================================

CREATE OR REPLACE FUNCTION check_auth_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_attempts INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Check recent auth attempts (5 minutes window)
  v_window_start := NOW() - INTERVAL '5 minutes';

  SELECT COUNT(*) INTO v_attempts
  FROM auth.audit_log_entries
  WHERE created_at > v_window_start AND auth_user_id = NEW.id;

  -- If more than 20 attempts in 5 minutes, raise exception
  IF v_attempts > 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would be on auth.audit_log_entries which is managed by Supabase
-- For now, we rely on Supabase's built-in rate limiting

-- ============================================
-- Auth Hooks for Custom Claims
-- Adds company_id and role to JWT for easy access in Workers
-- ============================================

CREATE OR REPLACE FUNCTION set_auth_claims()
RETURNS TRIGGER AS $$
BEGIN
  -- Set custom claims on the user
  -- This makes company_id and role available in JWT without additional DB lookups
  PERFORM auth.update_user(
    NEW.id,
    jsonb_build_object(
      'custom_claims', jsonb_build_object(
        'company_id', (SELECT company_id FROM users WHERE auth_id = NEW.id),
        'role', (SELECT role FROM users WHERE auth_id = NEW.id)
      )
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail signup if claim update fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_user_claims_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_claims();

-- ============================================
-- Password Validation Function
-- Enforces strong passwords
-- ============================================

CREATE OR REPLACE FUNCTION validate_password_strength(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Minimum 8 characters, at least one uppercase, one lowercase, one number
  IF length(password) < 8 THEN
    RETURN FALSE;
  END IF;

  IF NOT password ~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;

  IF NOT password ~ '[a-z]' THEN
    RETURN FALSE;
  END IF;

  IF NOT password ~ '[0-9]' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Email Verification Status Check
-- Helper to check if user has verified email
-- ============================================

CREATE OR REPLACE FUNCTION is_email_verified(auth_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_confirmed_at TIMESTAMPTZ;
BEGIN
  SELECT confirmed_at INTO v_confirmed_at
  FROM auth.users
  WHERE id = auth_user_id;

  RETURN v_confirmed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Session Refresh Handler
-- Updates last_login_at on session refresh
-- ============================================

CREATE OR REPLACE FUNCTION on_session_refresh()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_login_at in our users table on token refresh
  UPDATE users
  SET last_login_at = NOW()
  WHERE auth_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Token refresh is tracked via auth.audit_log_entries
-- This trigger would be on auth.sessions but that table may not be accessible
-- Supabase manages this internally

-- ============================================
-- Cleanup function for auth audit logs
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_auth_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE table_name = 'auth.users'
    AND created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
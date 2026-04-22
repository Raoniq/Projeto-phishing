-- ============================================
-- Migration 0003: Auth Events Audit Log
-- Records authentication events for security audit
-- ============================================

-- Function to log auth events to audit_logs
CREATE OR REPLACE FUNCTION log_auth_event()
RETURNS TRIGGER AS $$
DECLARE
  -- Get the user_id from our users table (not auth.users)
  v_user_id UUID;
  v_company_id UUID;
BEGIN
  -- Try to find the user in our users table
  SELECT id, company_id INTO v_user_id, v_company_id
  FROM users
  WHERE auth_id = NEW.id;

  -- Log the auth event
  INSERT INTO audit_logs (
    company_id,
    user_id,
    action,
    table_name,
    record_id,
    new_data,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(v_company_id, '00000000-0000-0000-0000-000000000000'::UUID),
    v_user_id,
    TG_ARGV[0], -- 'login', 'logout', 'signup', 'password_reset', etc.
    'auth.users',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'last_sign_in_at', NEW.last_sign_in_at,
      'created_at', NEW.created_at
    ),
    NULL, -- IP address not available in trigger
    NULL  -- User agent not available in trigger
  );

  -- Update last_login_at in users table if user exists
  IF v_user_id IS NOT NULL THEN
    UPDATE users SET last_login_at = NOW() WHERE id = v_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user login (last_sign_in_at updated)
CREATE OR REPLACE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION log_auth_event('login');

-- Trigger for new user creation (signup)
CREATE OR REPLACE TRIGGER on_auth_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION log_auth_event('signup');

-- ============================================
-- MFA Enforcement for Admin Users
-- ============================================

-- Function to check if admin users have MFA enabled
CREATE OR REPLACE FUNCTION check_admin_mfa_status(auth_user_id UUID)
RETURNS TABLE(factor_id UUID, status TEXT, factor_type TEXT) AS $$
BEGIN
  -- This uses the auth.mfa API to check factors
  -- The actual MFA challenge is handled by Supabase client
  RETURN QUERY
  SELECT f.id, f.status::TEXT, f.factor_type::TEXT
  FROM auth.mfa_factors f
  WHERE f.user_id = auth_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Audit log cleanup function (for data retention)
-- Note: Actual cleanup should be handled by a Worker with service role
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
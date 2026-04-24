-- ============================================
-- Migration 0015: QR Scan Enhancements
-- Enhanced scan tracking with device info and geo-location
-- ============================================

-- Add device_info column for parsed device details (mobile/desktop/tablet)
ALTER TABLE quishing_scan_events
ADD COLUMN IF NOT EXISTS device_info JSONB;

-- Add location_country from Cloudflare CF-IPCountry header
ALTER TABLE quishing_scan_events
ADD COLUMN IF NOT EXISTS location_country TEXT;

-- user_agent column already exists, this is just for documentation/completeness
-- ALTER TABLE quishing_scan_events
-- ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ============================================
-- Migration Complete
-- ============================================
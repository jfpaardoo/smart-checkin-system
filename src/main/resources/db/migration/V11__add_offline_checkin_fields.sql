-- ====================================================================
-- SMART CHECK-IN SYSTEM - MIGRATION V11: OFFLINE CHECKIN SUPPORT
-- ====================================================================

ALTER TABLE checkins ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT FALSE;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS offline_timestamp TIMESTAMP;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS offline_qr_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_checkins_offline ON checkins(is_offline, user_id);

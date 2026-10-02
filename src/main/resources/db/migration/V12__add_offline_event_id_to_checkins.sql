-- ====================================================================
-- SMART CHECK-IN SYSTEM - MIGRATION V12: ADD OFFLINE EVENT ID TO CHECKINS
-- ====================================================================

ALTER TABLE checkins ADD COLUMN IF NOT EXISTS offline_event_id VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_offline_event_id 
ON checkins(offline_event_id) 
WHERE offline_event_id IS NOT NULL;

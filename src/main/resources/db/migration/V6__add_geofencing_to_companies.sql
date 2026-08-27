-- ==============================================================================
-- SMART CHECK-IN SYSTEM - MIGRATION V6: ADD GEOFENCING AND ADDRESS TO COMPANIES
-- ==============================================================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS radius_meters INTEGER DEFAULT 100;

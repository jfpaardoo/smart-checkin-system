-- ==============================================================================
-- SMART CHECK-IN SYSTEM - MIGRATION V4: ADD LOCATION AND TRAINER TO FORMATIONS
-- ==============================================================================

ALTER TABLE formations ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'BA VILLAFRANCA';
ALTER TABLE formations ADD COLUMN IF NOT EXISTS trainer VARCHAR(255) DEFAULT 'VICTOR PARDO';

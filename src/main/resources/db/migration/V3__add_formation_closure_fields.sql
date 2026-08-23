-- ====================================================================
-- SMART CHECK-IN SYSTEM - MIGRATION V3: ADD FORMATION CLOSURE FIELDS
-- ====================================================================

ALTER TABLE formations ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;
ALTER TABLE formations ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE formations ADD COLUMN IF NOT EXISTS trainer_signature TEXT;
ALTER TABLE formations ADD COLUMN IF NOT EXISTS closed_date TIMESTAMP;

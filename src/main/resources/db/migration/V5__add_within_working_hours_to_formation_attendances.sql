-- ==============================================================================
-- SMART CHECK-IN SYSTEM - MIGRATION V5: ADD WITHIN_WORKING_HOURS TO FORMATION ATTENDANCES
-- ==============================================================================

ALTER TABLE formation_attendances ADD COLUMN IF NOT EXISTS within_working_hours BOOLEAN DEFAULT TRUE;

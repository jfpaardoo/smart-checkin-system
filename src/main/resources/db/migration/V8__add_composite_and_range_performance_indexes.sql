-- ====================================================================
-- SMART CHECK-IN SYSTEM - MIGRATION V8: COMPOSITE AND RANGE PERFORMANCE INDEXES
-- ====================================================================

-- 1. Checkins: composite index for queries by user ordered by date descending
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, check_in_date);

-- 2. Formations: index on formation_date for range/ordering and composite with status
CREATE INDEX IF NOT EXISTS idx_formations_date ON formations(formation_date);
CREATE INDEX IF NOT EXISTS idx_formations_status_date ON formations(status, formation_date);

-- 3. Formation Attendances: composite index for pair (formation_id, user_id)
CREATE INDEX IF NOT EXISTS idx_formation_attendances_form_user ON formation_attendances(formation_id, user_id);

-- 4. AppUsers: composite index for company approval dashboard
CREATE INDEX IF NOT EXISTS idx_appusers_comp_approved ON appusers(company_id, is_approved);

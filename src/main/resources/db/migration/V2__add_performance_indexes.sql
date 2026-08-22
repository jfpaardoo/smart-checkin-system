-- ====================================================================
-- SMART CHECK-IN SYSTEM - PERFORMANCE INDEXES (Flyway V2)
-- ====================================================================

-- 1. AppUsers indexes
CREATE INDEX IF NOT EXISTS idx_appusers_company_id ON appusers(company_id);
CREATE INDEX IF NOT EXISTS idx_appusers_authority ON appusers(authority);
CREATE INDEX IF NOT EXISTS idx_appusers_locator ON appusers(locator);
CREATE INDEX IF NOT EXISTS idx_appusers_is_approved ON appusers(is_approved);

-- 2. Formation Attendances indexes
CREATE INDEX IF NOT EXISTS idx_formation_attendances_user_id ON formation_attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_formation_attendances_formation_id ON formation_attendances(formation_id);

-- 3. Checkins indexes
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_check_in_date ON checkins(check_in_date);

-- 4. Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_username ON audit_logs(username);

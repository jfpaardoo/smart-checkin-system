-- ====================================================================
-- SMART CHECK-IN SYSTEM - MIGRATION V15: USER SESSIONS PERFORMANCE INDEXES
-- ====================================================================

-- 1. Optimizar la búsqueda y conteo de sesiones activas por usuario ordenadas por actividad reciente
CREATE INDEX IF NOT EXISTS idx_user_sessions_username_active_activity ON user_sessions(username, is_active, last_activity_at DESC);

-- 2. Optimizar la búsqueda y resolución de token hash con última actividad
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash_activity ON user_sessions(token_hash, last_activity_at DESC);

-- 3. Optimizar la limpieza de sesiones en el mismo dispositivo para un usuario
CREATE INDEX IF NOT EXISTS idx_user_sessions_username_device ON user_sessions(username, device_info, is_active);

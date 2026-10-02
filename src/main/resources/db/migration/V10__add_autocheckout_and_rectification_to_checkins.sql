-- ====================================================================
-- SMART CHECK-IN SYSTEM - MIGRATION V10: AUTO CHECK-OUT & RECTIFICATION
-- AND SCHEMA CONSOLIDATION
-- ====================================================================

-- 1. Normalizar columnas de fecha y tipo en checkins si venían de esquemas previos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkins' AND column_name = 'timestamp') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkins' AND column_name = 'check_in_date') THEN
        ALTER TABLE checkins RENAME COLUMN timestamp TO check_in_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkins' AND column_name = 'type') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkins' AND column_name = 'check_in_type') THEN
        ALTER TABLE checkins RENAME COLUMN type TO check_in_type;
    END IF;
END $$;

ALTER TABLE checkins ADD COLUMN IF NOT EXISTS check_in_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS check_in_type VARCHAR(50) NOT NULL DEFAULT 'ENTRADA';

-- 2. Campos para ciclo de vida de fichajes olvidados (Auto Check-out) y rectificación
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS is_auto_checkout BOOLEAN DEFAULT FALSE;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS is_rectified BOOLEAN DEFAULT FALSE;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS rectified_checkout_date TIMESTAMP;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS rectification_notes TEXT;

-- 3. Índices de rendimiento para la detección de fichajes stale y rectificaciones pendientes
CREATE INDEX IF NOT EXISTS idx_checkins_auto_checkout_pending 
ON checkins(user_id, is_auto_checkout, is_rectified);

CREATE INDEX IF NOT EXISTS idx_checkins_type_date 
ON checkins(check_in_type, check_in_date);

-- 4. Creación y consolidación de tablas auxiliares si no existen
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    ip_address VARCHAR(100),
    user_agent VARCHAR(512),
    device_info VARCHAR(255),
    last_activity_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_username ON user_sessions(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);

CREATE TABLE IF NOT EXISTS formation_documents (
    formation_id INTEGER NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
    document_url VARCHAR(1000) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_2fa_backup_codes (
    user_id INTEGER NOT NULL REFERENCES appusers(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL
);

-- 5. Consolidación de columnas en appusers (2FA, seguridad, privacidad)
ALTER TABLE appusers ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
ALTER TABLE appusers ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE appusers ADD COLUMN IF NOT EXISTS two_factor_type VARCHAR(10) DEFAULT 'APP';
ALTER TABLE appusers ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE appusers ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE appusers ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMP;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appusers' AND column_name = 'is_2fa_enabled') THEN
        UPDATE appusers SET two_factor_enabled = is_2fa_enabled WHERE two_factor_enabled IS NULL OR two_factor_enabled = FALSE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appusers' AND column_name = 'secret_2fa') THEN
        UPDATE appusers SET two_factor_secret = secret_2fa WHERE two_factor_secret IS NULL;
    END IF;
END $$;

-- 6. Consolidación de columnas en audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS log_hash VARCHAR(64);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS signature_hmac VARCHAR(64);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'current_hash') THEN
        UPDATE audit_logs SET log_hash = current_hash WHERE log_hash IS NULL;
    END IF;
END $$;

-- 7. Consolidación de columnas en jwt_blacklisted_tokens
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jwt_blacklisted_tokens' AND column_name = 'expiry_date') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jwt_blacklisted_tokens' AND column_name = 'expires_at') THEN
        ALTER TABLE jwt_blacklisted_tokens RENAME COLUMN expiry_date TO expires_at;
    END IF;
END $$;
ALTER TABLE jwt_blacklisted_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- 8. Consolidación de columnas en user_passkeys
ALTER TABLE user_passkeys ADD COLUMN IF NOT EXISTS device_type VARCHAR(100);
ALTER TABLE user_passkeys ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);
ALTER TABLE user_passkeys ADD COLUMN IF NOT EXISTS aaguid VARCHAR(64);
ALTER TABLE user_passkeys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- 9. Consolidación de columnas en cloud_settings
ALTER TABLE cloud_settings ADD COLUMN IF NOT EXISTS onedrive_client_id VARCHAR(255);
ALTER TABLE cloud_settings ADD COLUMN IF NOT EXISTS onedrive_client_secret VARCHAR(255);
ALTER TABLE cloud_settings ADD COLUMN IF NOT EXISTS onedrive_tenant_id VARCHAR(255);
ALTER TABLE cloud_settings ADD COLUMN IF NOT EXISTS onedrive_refresh_token TEXT;

-- 10. Consolidación de columnas en platform_statistics
ALTER TABLE platform_statistics ADD COLUMN IF NOT EXISTS average_hours_per_employee DOUBLE PRECISION;
ALTER TABLE platform_statistics ADD COLUMN IF NOT EXISTS formation_attendance_rate DOUBLE PRECISION;

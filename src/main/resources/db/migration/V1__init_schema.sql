-- ====================================================================
-- SMART CHECK-IN SYSTEM - INITIAL DATABASE SCHEMA (Flyway V1)
-- ====================================================================

-- 1. Companies (Empresas asociadas / colaboradoras)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

-- 2. Authorities (Roles de seguridad)
CREATE TABLE IF NOT EXISTS authorities (
    id SERIAL PRIMARY KEY,
    authority VARCHAR(50) NOT NULL
);

-- 3. Users (Usuarios del sistema)
CREATE TABLE IF NOT EXISTS appusers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    authority INTEGER REFERENCES authorities(id),
    personal_code VARCHAR(10) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_working BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    failed_login_attempts INTEGER DEFAULT 0,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    push_notifications_enabled BOOLEAN DEFAULT TRUE,
    locator VARCHAR(50),
    company_id INTEGER REFERENCES companies(id),
    secret_2fa VARCHAR(255),
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    department_id INTEGER
);

-- 4. Formations (Cursos y sesiones de formación)
CREATE TABLE IF NOT EXISTS formations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    formation_date TIMESTAMP,
    expiration_date TIMESTAMP,
    location VARCHAR(255),
    trainer VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Formation Attendances (Asistencias y firmas a formaciones)
CREATE TABLE IF NOT EXISTS formation_attendances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES appusers(id) ON DELETE CASCADE,
    formation_id INTEGER REFERENCES formations(id) ON DELETE CASCADE,
    check_in_date TIMESTAMP,
    check_out_date TIMESTAMP,
    signature TEXT
);

-- 6. Checkins (Fichajes de entrada y salida)
CREATE TABLE IF NOT EXISTS checkins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES appusers(id) ON DELETE CASCADE,
    formation_id INTEGER REFERENCES formations(id) ON DELETE SET NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50) NOT NULL,
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    admin_lat DOUBLE PRECISION,
    admin_lng DOUBLE PRECISION,
    within_range BOOLEAN DEFAULT TRUE,
    signature TEXT
);

-- 7. Audit Logs (Trazabilidad y cadena criptográfica)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(100),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    previous_hash VARCHAR(255),
    current_hash VARCHAR(255)
);

-- 8. Push Subscriptions (Notificaciones Web Push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES appusers(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL
);

-- 9. User Passkeys (WebAuthn / FIDO2)
CREATE TABLE IF NOT EXISTS user_passkeys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES appusers(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    sign_count BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    label VARCHAR(100)
);

-- 10. Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES appusers(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL
);

-- 11. JWT Blacklist
CREATE TABLE IF NOT EXISTS jwt_blacklisted_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(512) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL
);

-- 12. Cloud Settings (OneDrive / Cloud Backup)
CREATE TABLE IF NOT EXISTS cloud_settings (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP
);

-- 13. Platform Statistics (Métricas históricas)
CREATE TABLE IF NOT EXISTS platform_statistics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    total_checkins BIGINT DEFAULT 0,
    active_formations INTEGER DEFAULT 0
);

-- ====================================================================
-- SEED DATA (Datos maestros iniciales)
-- ====================================================================
INSERT INTO companies(id, name, description) 
SELECT 1, 'BA Glass Spain SAU', 'Empresa principal de fabricación de vidrio' 
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 1);

INSERT INTO companies(id, name, description) 
SELECT 2, 'OT Noriega', 'Operador de transporte y logística' 
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 2);

INSERT INTO companies(id, name, description) 
SELECT 3, 'Eurotalia Transportes e Logística LDA.', 'Transporte internacional y logística' 
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 3);

INSERT INTO companies(id, name, description) 
SELECT 4, 'Otros', 'Otras empresas y colaboradores externos' 
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 4);

INSERT INTO authorities(id, authority) 
SELECT 1, 'ADMIN' 
WHERE NOT EXISTS (SELECT 1 FROM authorities WHERE id = 1);

INSERT INTO authorities(id, authority) 
SELECT 2, 'USER' 
WHERE NOT EXISTS (SELECT 1 FROM authorities WHERE id = 2);

INSERT INTO appusers(id, username, email, password, authority, personal_code, first_name, last_name, is_working, is_approved, failed_login_attempts, email_notifications_enabled, push_notifications_enabled, locator, company_id) 
SELECT 1, 'admin1', 'admin@smartcheckin.com', '$2a$10$nMmTWAhPTqXqLDJTag3prumFrAJpsYtroxf0ojesFYq0k4PmcbWUS', 1, '0001', 'ADMIN', 'SISTEMA', false, true, 0, true, true, 'AV', 1 
WHERE NOT EXISTS (SELECT 1 FROM appusers WHERE id = 1);

-- Sincronización de secuencias de claves primarias
SELECT setval(pg_get_serial_sequence('companies', 'id'), COALESCE(MAX(id), 1)) FROM companies;
SELECT setval(pg_get_serial_sequence('authorities', 'id'), COALESCE(MAX(id), 1)) FROM authorities;
SELECT setval(pg_get_serial_sequence('appusers', 'id'), COALESCE(MAX(id), 1)) FROM appusers;

-- ====================================================================
-- SMART CHECK-IN SYSTEM - MIGRATION V9: PASSKEY AND AUDIT PERFORMANCE INDEXES
-- ====================================================================

-- 1. User Passkeys: index on user_id to accelerate credential checks and cascading operations
CREATE INDEX IF NOT EXISTS idx_user_passkeys_user_id ON user_passkeys(user_id);

-- 2. Push Subscriptions: index on user_id for fast targeted web push dispatches
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- 3. Password Reset Tokens: index on user_id for lookup and purge operations
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- 4. Audit Logs: composite index for filtered lookups by action ordered chronologically
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp ON audit_logs(action, timestamp DESC);

-- 5. Formations: index on trainer for instructor filtering and metrics
CREATE INDEX IF NOT EXISTS idx_formations_trainer ON formations(trainer);

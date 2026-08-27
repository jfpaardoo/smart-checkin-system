-- ====================================================================
-- SMART CHECK-IN SYSTEM - MIGRATION V7: ADD FORMATION STATUS AND DRAFT SUPPORT
-- ====================================================================

ALTER TABLE formations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PUBLISHED';

-- Set CLOSED status for previously closed formations
UPDATE formations SET status = 'CLOSED' WHERE is_closed = TRUE;

-- Create index on status for high performance querying
CREATE INDEX IF NOT EXISTS idx_formations_status ON formations(status);

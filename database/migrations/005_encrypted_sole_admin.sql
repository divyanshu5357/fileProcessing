

BEGIN;

-- 1. Create singleton system_admin_config table to store encrypted sole admin identity
CREATE TABLE IF NOT EXISTS system_admin_config (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    admin_user_id VARCHAR(255) REFERENCES "user"(id) ON DELETE SET NULL,
    encrypted_email TEXT NOT NULL,          -- AES-256-GCM encrypted payload (iv:tag:data)
    email_hmac VARCHAR(64) NOT NULL UNIQUE, -- HMAC-SHA256 signature of admin email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enforce physical database-level constraint: exactly ZERO or ONE user can ever be 'admin'
-- Any attempt to elevate a second user will be rejected by PostgreSQL engine with unique violation
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_admin ON "user" ((role = 'admin')) WHERE role = 'admin';

-- 3. Audit trail table for admin verification events
CREATE TABLE IF NOT EXISTS admin_security_events (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255),
    event_type VARCHAR(64) NOT NULL, -- e.g. 'ADMIN_LOGIN_SUCCESS', 'ADMIN_ACCESS_DENIED'
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sec_created ON admin_security_events(created_at DESC);

COMMIT;

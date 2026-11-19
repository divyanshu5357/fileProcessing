-- =============================================================================
-- Migration: 003_admin_rbac.sql
-- Gyanvatsala Role-Based Access Control (RBAC), Admin Audit Logs & Better Auth Extension
-- =============================================================================

-- 1. Add RBAC & Admin fields to Better Auth user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" VARCHAR(32) NOT NULL DEFAULT 'user';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "impersonatedBy" TEXT;

-- 2. Create index on user role for fast permission verification
CREATE INDEX IF NOT EXISTS idx_user_role ON "user"("role");

-- 3. Create Admin Audit Logs Table for tracking all role and configuration changes
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    actor_id VARCHAR(255) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(128) NOT NULL,
    target_id VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor ON admin_audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- 4. Secure Idempotent First Administrator Bootstrap
-- Automatically sets role = 'admin' for verified authorized emails from environment configuration
UPDATE "user"
SET "role" = 'admin'
WHERE LOWER("email") IN (
    'fileprocess@gyanvatsala.in',
    'abhishek5357kumar@gmail.com',
    'admin@gyanvatsala.in',
    'divyanshu@gyanvatsala.in'
) AND "role" <> 'admin';

-- =============================================================================
-- Migration: 001_initial_schema.sql
-- PixelKit Complete SaaS Architecture Schema for Neon PostgreSQL
-- =============================================================================

-- Enable pgcrypto / uuid-ossp for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update timestamp columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- -----------------------------------------------------------------------------
-- 1. Better Auth Core Tables: "user", "session", "account", "verification"
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT,
    "email" TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "image" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "token" TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
    "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE("providerId", "accountId")
);

CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Folders Hierarchy Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS folders (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    parent_folder_id VARCHAR(36) REFERENCES folders(id) ON DELETE CASCADE,
    folder_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_folder_id ON folders(parent_folder_id);

-- -----------------------------------------------------------------------------
-- 3. Files Metadata Table (Binary content stored securely in AWS S3)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS files (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    folder_id VARCHAR(36) REFERENCES folders(id) ON DELETE SET NULL,
    original_name VARCHAR(512) NOT NULL,
    stored_name VARCHAR(512) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    file_extension VARCHAR(32) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    s3_key VARCHAR(1024) NOT NULL,
    checksum VARCHAR(128),
    status VARCHAR(64) NOT NULL DEFAULT 'ready',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files(deleted_at);

-- -----------------------------------------------------------------------------
-- 4. Processing Jobs Table (Celery Queue Tracker)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS processing_jobs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    file_id VARCHAR(36) REFERENCES files(id) ON DELETE SET NULL,
    operation VARCHAR(128) NOT NULL,
    job_status VARCHAR(64) NOT NULL DEFAULT 'queued',
    progress INTEGER NOT NULL DEFAULT 0,
    input_s3_key VARCHAR(1024) NOT NULL,
    output_s3_key VARCHAR(1024),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. Processing History Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS processing_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    file_id VARCHAR(36) REFERENCES files(id) ON DELETE SET NULL,
    operation VARCHAR(128) NOT NULL,
    processing_status VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_history_user_id ON processing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_history_created_at ON processing_history(created_at DESC);

-- -----------------------------------------------------------------------------
-- 6. Storage Usage Quota Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS storage_usage (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
    total_storage_used BIGINT NOT NULL DEFAULT 0,
    total_files INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_usage_user_id ON storage_usage(user_id);

-- -----------------------------------------------------------------------------
-- 7. User Settings Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
    theme VARCHAR(32) NOT NULL DEFAULT 'system',
    default_processing_mode VARCHAR(32) NOT NULL DEFAULT 'auto',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- -----------------------------------------------------------------------------
-- 8. Subscriptions Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
    plan_name VARCHAR(64) NOT NULL DEFAULT 'free',
    storage_limit BIGINT NOT NULL DEFAULT 524288000,          -- 500 MB default
    file_size_limit BIGINT NOT NULL DEFAULT 52428800,        -- 50 MB default
    monthly_processing_limit INTEGER NOT NULL DEFAULT 100,
    subscription_status VARCHAR(64) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- -----------------------------------------------------------------------------
-- 9. Automatic Triggers for updated_at
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trigger_update_folders_updated_at ON folders;
CREATE TRIGGER trigger_update_folders_updated_at
BEFORE UPDATE ON folders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_files_updated_at ON files;
CREATE TRIGGER trigger_update_files_updated_at
BEFORE UPDATE ON files
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_jobs_updated_at ON processing_jobs;
CREATE TRIGGER trigger_update_jobs_updated_at
BEFORE UPDATE ON processing_jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_settings_updated_at ON user_settings;
CREATE TRIGGER trigger_update_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

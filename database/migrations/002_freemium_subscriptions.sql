-- =============================================================================
-- Migration: 002_freemium_subscriptions.sql
-- Gyanvatsala Freemium Subscription, Pricing, Retention & Deletion Architecture
-- =============================================================================

-- 1. Create Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    slug VARCHAR(64) UNIQUE NOT NULL,
    price_monthly_inr INTEGER NOT NULL DEFAULT 0,
    price_yearly_inr INTEGER NOT NULL DEFAULT 0,
    storage_limit_bytes BIGINT NOT NULL,
    retention_days INTEGER NOT NULL,
    max_file_size_bytes BIGINT NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed the 4 Freemium Plans
INSERT INTO plans (id, name, slug, price_monthly_inr, price_yearly_inr, storage_limit_bytes, retention_days, max_file_size_bytes, is_recommended, features)
VALUES 
(
    'free',
    'Free',
    'free',
    0,
    0,
    15728640, -- 15 MB
    7,        -- 7 days
    15728640, -- 15 MB max file
    FALSE,
    '["15 MB Secure Cloud Storage", "7-Day Automatic Data Retention", "In-Browser Privacy Mode", "Standard Processing Queue", "Download anytime before expiration"]'::jsonb
),
(
    'prime',
    'Prime',
    'prime',
    49,
    499,
    52428800, -- 50 MB
    14,       -- 14 days
    26214400, -- 25 MB max file
    FALSE,
    '["50 MB Cloud Storage", "14-Day Automatic Data Retention", "Priority Queue Processing", "48h & 24h Expiration Alerts", "Direct Multipart S3 Uploads"]'::jsonb
),
(
    'prime_plus',
    'PrimePlus',
    'prime_plus',
    99,
    999,
    104857600, -- 100 MB
    30,        -- 30 days
    52428800,  -- 50 MB max file
    TRUE,      -- RECOMMENDED PLAN
    '["100 MB Cloud Storage", "30-Day Extended Data Retention", "High-Speed Parallel Processing", "Batch PDF Assembler & Editor", "Automated Expiration Warnings", "Priority Support"]'::jsonb
),
(
    'prime_ultra',
    'PrimeUltra',
    'prime_ultra',
    249,
    2499,
    524288000, -- 500 MB
    365,       -- 365 days (1 year)
    104857600, -- 100 MB max file
    FALSE,
    '["500 MB Enterprise Cloud Storage", "365-Day (1 Year) Retention", "Unlimited Batch Conversions", "Dedicated Concurrency Workers", "VIP Support & Advanced Tools"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_monthly_inr = EXCLUDED.price_monthly_inr,
    price_yearly_inr = EXCLUDED.price_yearly_inr,
    storage_limit_bytes = EXCLUDED.storage_limit_bytes,
    retention_days = EXCLUDED.retention_days,
    max_file_size_bytes = EXCLUDED.max_file_size_bytes,
    is_recommended = EXCLUDED.is_recommended,
    features = EXCLUDED.features;

-- 2. Enhance Subscriptions Table
ALTER TABLE subscriptions 
    ADD COLUMN IF NOT EXISTS plan_id VARCHAR(64) REFERENCES plans(id) DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(32) NOT NULL DEFAULT 'monthly',
    ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '100 years'),
    ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- 3. Payments / Invoices History Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    subscription_id VARCHAR(36) REFERENCES subscriptions(id) ON DELETE SET NULL,
    plan_id VARCHAR(64) REFERENCES plans(id),
    amount_inr INTEGER NOT NULL,
    billing_cycle VARCHAR(32) NOT NULL DEFAULT 'monthly',
    payment_method VARCHAR(64) NOT NULL DEFAULT 'UPI / Card',
    transaction_id VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(64) NOT NULL DEFAULT 'succeeded',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- 4. Enhance Files Table with Retention Expiration & Warning Tracking
ALTER TABLE files
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS notified_48h BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS notified_24h BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);

-- 5. Deletion Logs Table for Audit Trail
CREATE TABLE IF NOT EXISTS deletion_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    file_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(512) NOT NULL,
    file_size BIGINT NOT NULL,
    s3_key VARCHAR(1024) NOT NULL,
    reason VARCHAR(64) NOT NULL, -- 'expired', 'user_deleted', 'quota_cleanup'
    status VARCHAR(64) NOT NULL, -- 'success', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_logs_user_id ON deletion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_created_at ON deletion_logs(created_at DESC);

-- 6. User Registration Automatic Trigger: Auto-assign Free plan and Storage Quota
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically provision Free subscription
    INSERT INTO subscriptions (
        user_id,
        plan_id,
        plan_name,
        storage_limit,
        file_size_limit,
        monthly_processing_limit,
        subscription_status,
        billing_cycle,
        current_period_start,
        current_period_end,
        cancel_at_period_end
    )
    VALUES (
        NEW.id,
        'free',
        'Free',
        15728640, -- 15 MB
        15728640, -- 15 MB
        50,
        'active',
        'monthly',
        NOW(),
        NOW() + INTERVAL '100 years',
        FALSE
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Automatically provision Storage Usage record
    INSERT INTO storage_usage (user_id, total_storage_used, total_files)
    VALUES (NEW.id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_user_subscription ON "user";
CREATE TRIGGER trigger_auto_user_subscription
AFTER INSERT ON "user"
FOR EACH ROW EXECUTE FUNCTION handle_new_user_subscription();

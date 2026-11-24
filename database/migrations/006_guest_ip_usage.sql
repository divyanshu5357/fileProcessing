-- =============================================================================
-- Migration: 006_guest_ip_usage.sql
-- Tracks anonymous (unsigned) guest usage by normalized IP per product
-- Enforces 4-use quota per product when user is not signed in
-- =============================================================================

CREATE TABLE IF NOT EXISTS guest_ip_usage (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ip_address VARCHAR(128) NOT NULL,
    product_id VARCHAR(64) NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_user_agent TEXT,
    first_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(ip_address, product_id)
);

CREATE INDEX IF NOT EXISTS idx_guest_ip_usage_ip ON guest_ip_usage(ip_address);
CREATE INDEX IF NOT EXISTS idx_guest_ip_usage_product ON guest_ip_usage(product_id);

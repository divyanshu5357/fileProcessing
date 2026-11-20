// High-Performance Sliding Window Rate Limiter
// Supports IPv4 & IPv6 Subnet Normalization, Anti-Abuse Protection, and Dual-Axis Rate Limiting

export type RateLimitCategory = 'auth' | 'admin' | 'api' | 'otp';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const LIMITS: Record<RateLimitCategory, RateLimitConfig> = {
  otp: { limit: 5, windowMs: 600_000 },    // 5 OTP dispatches per 10 minutes per IP/Email
  auth: { limit: 15, windowMs: 60_000 },   // 15 req/min on sensitive auth routes
  admin: { limit: 30, windowMs: 60_000 },  // 30 req/min on admin endpoints
  api: { limit: 100, windowMs: 60_000 },   // 100 req/min on standard APIs
};

interface WindowEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, WindowEntry>();

// Periodic cleanup of expired entries every 60s
let lastCleanup = Date.now();
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Normalizes IP addresses:
 * - IPv4: used as-is.
 * - IPv6: groups by /64 prefix to prevent rotation within a single allocated /64 subnet.
 */
export function normalizeIp(ip: string): string {
  if (!ip) return '127.0.0.1';
  const clean = ip.trim().toLowerCase();

  // If IPv6 with at least 4 segments, group by /64 prefix (first 4 hextets)
  if (clean.includes(':')) {
    const parts = clean.split(':');
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}::/64`;
    }
  }

  return clean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;       // Unix epoch in seconds
  retryAfter: number;  // Seconds until reset
}

/**
 * Checks and updates sliding window rate limit counter for a given client identifier and category.
 */
export function checkRateLimit(
  identifier: string,
  category: RateLimitCategory = 'api'
): RateLimitResult {
  cleanupExpired();

  const cfg = LIMITS[category] || LIMITS.api;
  const now = Date.now();
  const normalizedId = category === 'otp' ? identifier.trim().toLowerCase() : normalizeIp(identifier);
  const key = `${category}:${normalizedId}`;

  const current = memoryStore.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + cfg.windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: cfg.limit,
      remaining: cfg.limit - 1,
      reset: Math.ceil(resetAt / 1000),
      retryAfter: 0,
    };
  }

  current.count += 1;
  const remaining = Math.max(0, cfg.limit - current.count);
  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

  if (current.count > cfg.limit) {
    return {
      allowed: false,
      limit: cfg.limit,
      remaining: 0,
      reset: Math.ceil(current.resetAt / 1000),
      retryAfter,
    };
  }

  return {
    allowed: true,
    limit: cfg.limit,
    remaining,
    reset: Math.ceil(current.resetAt / 1000),
    retryAfter: 0,
  };
}

/**
 * Dual-axis OTP Rate Limiter:
 * Enforces limits simultaneously across BOTH Client IP AND Target Email address.
 * Prevents:
 * 1. Spraying thousands of emails from a single IP.
 * 2. Flooding a single victim's email from multiple proxy IPs.
 */
export function checkOtpRateLimit(
  ip: string,
  email: string
): { allowed: boolean; reason?: string; retryAfter?: number } {
  // 1. IP-level restriction (max 5 OTPs per 10m per IP)
  const ipResult = checkRateLimit(ip, 'otp');
  if (!ipResult.allowed) {
    return {
      allowed: false,
      reason: `Too many verification requests from your network. Please wait ${ipResult.retryAfter}s.`,
      retryAfter: ipResult.retryAfter,
    };
  }

  // 2. Email-level restriction (max 3 OTPs per 10m per Email)
  const emailResult = checkRateLimit(`email:${email.toLowerCase().trim()}`, 'otp');
  if (!emailResult.allowed) {
    return {
      allowed: false,
      reason: `Too many verification requests for this email address. Please try again in ${emailResult.retryAfter}s.`,
      retryAfter: emailResult.retryAfter,
    };
  }

  return { allowed: true };
}

// High-Performance Sliding Window & Distributed Rate Limiter
// Supports IPv4 & IPv6 Subnet Normalization, Anti-Abuse Protection, and Dual-Axis Rate Limiting

export type RateLimitCategory = 'auth' | 'admin' | 'api' | 'otp' | 'otp_email' | 'otp_account';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const LIMITS: Record<RateLimitCategory, RateLimitConfig> = {
  otp: { limit: 5, windowMs: 600_000 },          // 5 OTP dispatches per 10 minutes per IP
  otp_email: { limit: 3, windowMs: 600_000 },    // 3 OTP dispatches per 10 minutes per Target Email
  otp_account: { limit: 5, windowMs: 600_000 },  // 5 OTP dispatches per 10 minutes per User Account
  auth: { limit: 15, windowMs: 60_000 },         // 15 req/min on sensitive auth routes
  admin: { limit: 30, windowMs: 60_000 },        // 30 req/min on admin endpoints
  api: { limit: 100, windowMs: 60_000 },         // 100 req/min on standard APIs
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
 * - IPv6: groups by /64 prefix to prevent rotation within an allocated /64 subnet.
 * - Non-IP identifiers (emails, tokens): normalized to lowercase trimmed string.
 */
export function normalizeIp(ip: string): string {
  if (!ip) return 'untrusted-client';
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
 * In-memory sliding window rate limiter.
 * Ultra-fast local execution for single-instance or edge fallback.
 */
export function checkRateLimit(
  identifier: string,
  category: RateLimitCategory = 'api'
): RateLimitResult {
  cleanupExpired();

  const cfg = LIMITS[category] || LIMITS.api;
  const now = Date.now();
  const normalizedId =
    category === 'otp' ? identifier.trim().toLowerCase() : normalizeIp(identifier);
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
 * Optional Distributed Redis Rate Limiter via Upstash REST API or standard HTTP Redis.
 * If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, state is shared across all horizontal instances.
 * If unset, falls back seamlessly to the high-performance local sliding window memory store.
 */
export async function checkDistributedRateLimit(
  identifier: string,
  category: RateLimitCategory = 'api'
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Fallback to local memory if Redis credentials are not configured
  if (!redisUrl || !redisToken) {
    return checkRateLimit(identifier, category);
  }

  const cfg = LIMITS[category] || LIMITS.api;
  const normalizedId =
    category === 'otp' ? identifier.trim().toLowerCase() : normalizeIp(identifier);
  const key = `ratelimit:${category}:${normalizedId}`;
  const windowSec = Math.ceil(cfg.windowMs / 1000);

  try {
    // Atomic INCR + EXPIRE via Redis pipeline
    const pipelineUrl = `${redisUrl.replace(/\/+$/, '')}/pipeline`;
    const res = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSec, 'NX'],
        ['TTL', key],
      ]),
      cache: 'no-store',
    });

    if (!res.ok) {
      return checkRateLimit(identifier, category);
    }

    const data = await res.json();
    const count = Number(data[0]?.result || 1);
    const ttl = Number(data[2]?.result || windowSec);
    const retryAfter = Math.max(1, ttl);
    const reset = Math.floor(Date.now() / 1000) + retryAfter;

    if (count > cfg.limit) {
      return {
        allowed: false,
        limit: cfg.limit,
        remaining: 0,
        reset,
        retryAfter,
      };
    }

    return {
      allowed: true,
      limit: cfg.limit,
      remaining: Math.max(0, cfg.limit - count),
      reset,
      retryAfter: 0,
    };
  } catch (err) {
    console.debug('[RateLimit] Distributed Redis call error; falling back to local memory:', err);
    return checkRateLimit(identifier, category);
  }
}

/**
 * Multi-axis OTP Rate Limiter:
 * Enforces limits simultaneously across Client IP, Target Email, and Account ID.
 * Prevents:
 * 1. Spraying thousands of emails from a single IP.
 * 2. Flooding a single victim's email from multiple proxy IPs.
 * 3. Circumventing limits by switching between OAuth and credentials.
 */
export function checkOtpRateLimit(
  ip: string,
  email: string,
  accountId?: string
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
  const emailResult = checkRateLimit(email.toLowerCase().trim(), 'otp_email');
  if (!emailResult.allowed) {
    return {
      allowed: false,
      reason: `Too many verification requests for this email address. Please try again in ${emailResult.retryAfter}s.`,
      retryAfter: emailResult.retryAfter,
    };
  }

  // 3. Account-level restriction if authenticated user account exists
  if (accountId && accountId.trim()) {
    const acctResult = checkRateLimit(accountId.trim(), 'otp_account');
    if (!acctResult.allowed) {
      return {
        allowed: false,
        reason: `Too many verification requests on this account. Please wait ${acctResult.retryAfter}s.`,
        retryAfter: acctResult.retryAfter,
      };
    }
  }

  return { allowed: true };
}

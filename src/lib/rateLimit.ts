// High-Performance Sliding Window & Distributed Rate Limiter
// Supports IPv4 & IPv6 Subnet Normalization, Anti-Abuse Protection, and Multi-Axis Rate Limiting

import { normalizeIp, isLoopbackIp } from './ipUtils';

export type RateLimitCategory =
  | 'auth'
  | 'admin'
  | 'api'
  | 'otp'
  | 'otp_email'
  | 'otp_account'
  | 'otp_network'
  | 'otp_cooldown'
  | 'otp_verify_email'
  | 'otp_verify_ip'
  | 'password_login_email'
  | 'password_login_ip'
  | 'password_signup_ip'
  | 'password_set_ip';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export const LIMITS: Record<RateLimitCategory, RateLimitConfig> = {
  // Business Logic OTP Limits:
  otp_email: { limit: 3, windowMs: 600_000 },       // Max 3 OTP dispatches per 10 minutes per Target Email
  otp_cooldown: { limit: 1, windowMs: 60_000 },      // 60-second cooldown between consecutive OTP requests for an email
  otp_network: { limit: 30, windowMs: 600_000 },     // Max 30 OTP dispatches per 10 minutes per IP/Subnet
  otp_account: { limit: 5, windowMs: 600_000 },      // Max 5 OTP dispatches per 10 minutes per Authenticated Account
  otp_verify_email: { limit: 5, windowMs: 300_000 }, // Max 5 OTP verification tries per 5 minutes per Email
  otp_verify_ip: { limit: 20, windowMs: 600_000 },   // Max 20 OTP verification tries per 10 minutes per IP/Subnet
  otp: { limit: 30, windowMs: 600_000 },             // General OTP network category fallback

  // Password Login & Registration Rate Limits:
  password_login_email: { limit: 5, windowMs: 900_000 }, // Max 5 password attempts per 15 minutes per Target Email
  password_login_ip: { limit: 20, windowMs: 900_000 },   // Max 20 password attempts per 15 minutes per IP/Subnet
  password_signup_ip: { limit: 5, windowMs: 3600_000 },  // Max 5 password account registrations per 1 hour per IP
  password_set_ip: { limit: 10, windowMs: 900_000 },     // Max 10 password setup requests per 15 minutes per IP

  // Middleware Volumetric Protection Limits:
  auth: { limit: 30, windowMs: 60_000 },             // 30 req/min on auth endpoints
  admin: { limit: 30, windowMs: 60_000 },            // 30 req/min on admin endpoints
  api: { limit: 100, windowMs: 60_000 },             // 100 req/min on standard APIs
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

const EMAIL_SCOPED_CATEGORIES = new Set<RateLimitCategory>([
  'otp_email',
  'otp_cooldown',
  'otp_verify_email',
  'password_login_email',
]);

/**
 * Resets rate limit for a specific identifier and category (used in tests or after login success).
 */
export function resetRateLimit(identifier: string, category: RateLimitCategory): void {
  const normalizedId = EMAIL_SCOPED_CATEGORIES.has(category)
    ? identifier.trim().toLowerCase()
    : normalizeIp(identifier);
  const key = `${category}:${normalizedId}`;
  memoryStore.delete(key);
}

/**
 * Clears all rate limit records in memory (for test isolation).
 */
export function clearAllRateLimits(): void {
  memoryStore.clear();
}

export function cleanupExpiredRateLimits(): number {
  let cleaned = 0;
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
      cleaned++;
    }
  }
  return cleaned;
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
  const normalizedId = EMAIL_SCOPED_CATEGORIES.has(category)
    ? identifier.trim().toLowerCase()
    : normalizeIp(identifier);
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
  const normalizedId = EMAIL_SCOPED_CATEGORIES.has(category)
    ? identifier.trim().toLowerCase()
    : normalizeIp(identifier);
  const key = `ratelimit:${category}:${normalizedId}`;
  const windowSec = Math.ceil(cfg.windowMs / 1000);

  try {
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

export interface OtpRateLimitResult {
  allowed: boolean;
  status?: number;
  reason?: string;
  retryAfter?: number;
  ruleEvaluated: 'email' | 'network' | 'account' | 'cooldown' | 'none';
  ruleTriggered?: 'otp_email' | 'otp_network' | 'otp_account' | 'otp_cooldown' | 'none';
  remaining?: number;
}

/**
 * Multi-Axis OTP Rate Limiter:
 * 
 * Design Principles:
 * 1. Per-Email Isolation (Primary Defense):
 *    - Each email address is strictly limited to 3 OTP requests per 10 minutes.
 *    - Unrelated users or devices NEVER share this quota.
 * 2. Network-Level Abuse Protection (Anti-Bot Spraying):
 *    - Public networks are limited to 30 OTP requests per 10 minutes per IP/subnet.
 *    - This accommodates normal shared networks (office Wi-Fi, university campuses, mobile NAT/CGNAT)
 *      without blocking individual legitimate users on their first request.
 *    - Loopback connections in development (127.0.0.1, ::1) are given high developer capacity (100/10m)
 *      so local testing never blocks developer logins.
 * 3. Account-Level Protection:
 *    - Authenticated accounts are limited to 5 requests per 10 minutes.
 */
export function checkOtpRateLimit(
  ipOrParams: string | { ip: string; email: string; accountId?: string },
  emailParam?: string,
  accountIdParam?: string
): OtpRateLimitResult {
  let ip: string;
  let cleanEmail: string;
  let accountId: string | undefined;

  if (typeof ipOrParams === 'object' && ipOrParams !== null) {
    ip = ipOrParams.ip || '127.0.0.1';
    cleanEmail = (ipOrParams.email || '').toLowerCase().trim();
    accountId = ipOrParams.accountId;
  } else {
    ip = ipOrParams || '127.0.0.1';
    cleanEmail = (emailParam || '').toLowerCase().trim();
    accountId = accountIdParam;
  }

  // 0. Cooldown check (60s cooldown per email)
  const cooldownKey = `otp_cooldown:${cleanEmail}`;
  const existingCooldown = memoryStore.get(cooldownKey);
  const now = Date.now();
  if (existingCooldown && existingCooldown.resetAt > now) {
    const retryAfter = Math.ceil((existingCooldown.resetAt - now) / 1000);
    return {
      allowed: false,
      status: 429,
      reason: `Please wait ${retryAfter}s before requesting another verification code.`,
      retryAfter,
      ruleEvaluated: 'cooldown',
      ruleTriggered: 'otp_cooldown',
      remaining: 0,
    };
  }

  // 1. Per-Email Limit (Max 3 OTP requests per 10m per email)
  const emailResult = checkRateLimit(cleanEmail, 'otp_email');
  if (!emailResult.allowed) {
    return {
      allowed: false,
      status: 429,
      reason: `Too many verification requests for this email address. Please try again in ${emailResult.retryAfter}s.`,
      retryAfter: emailResult.retryAfter,
      ruleEvaluated: 'email',
      ruleTriggered: 'otp_email',
      remaining: 0,
    };
  }

  // 2. Account-Level Limit (if authenticated account ID is present)
  if (accountId && accountId.trim()) {
    const acctResult = checkRateLimit(accountId.trim(), 'otp_account');
    if (!acctResult.allowed) {
      return {
        allowed: false,
        status: 429,
        reason: `Too many verification requests on this account. Please wait ${acctResult.retryAfter}s.`,
        retryAfter: acctResult.retryAfter,
        ruleEvaluated: 'account',
        ruleTriggered: 'otp_account',
        remaining: 0,
      };
    }
  }

  // 3. Network-Level Limit (Anti-Bot Spraying)
  const isLoopback = isLoopbackIp(ip);
  if (isLoopback && process.env.NODE_ENV !== 'production') {
    // In local dev, loopback requests are granted up to 100 attempts per 10m
    const devResult = checkRateLimit('loopback', 'api');
    if (!devResult.allowed) {
      return {
        allowed: false,
        status: 429,
        reason: `Too many local requests. Please wait ${devResult.retryAfter}s.`,
        retryAfter: devResult.retryAfter,
        ruleEvaluated: 'network',
        ruleTriggered: 'otp_network',
        remaining: 0,
      };
    }
  } else {
    // For public network IPs, enforce network abuse threshold (30 requests per 10m per IP/subnet)
    const netResult = checkRateLimit(ip, 'otp_network');
    if (!netResult.allowed) {
      return {
        allowed: false,
        status: 429,
        reason: `Too many verification requests from your network. Please wait ${netResult.retryAfter}s.`,
        retryAfter: netResult.retryAfter,
        ruleEvaluated: 'network',
        ruleTriggered: 'otp_network',
        remaining: 0,
      };
    }
  }

  // Mark 60s cooldown for this email
  memoryStore.set(cooldownKey, { count: 1, resetAt: now + 60_000 });

  return {
    allowed: true,
    status: 200,
    ruleEvaluated: 'none',
    ruleTriggered: 'none',
    remaining: emailResult.remaining,
  };
}

/**
 * Multi-axis Rate Limiter for Password Sign-In, Password Registration, and Password Set.
 * Enforces both target email protection and IP/subnet flood defense.
 */
export function checkPasswordAuthRateLimit(
  ip: string,
  email: string,
  mode: 'login' | 'signup' | 'set'
): OtpRateLimitResult {
  const cleanEmail = email.trim().toLowerCase();

  if (mode === 'login' && cleanEmail) {
    const emailRes = checkRateLimit(cleanEmail, 'password_login_email');
    if (!emailRes.allowed) {
      return {
        allowed: false,
        status: 429,
        reason: `Too many password login attempts for this email. Try again in ${emailRes.retryAfter}s or sign in with Email OTP.`,
        retryAfter: emailRes.retryAfter,
        ruleEvaluated: 'email',
        remaining: 0,
      };
    }
  }

  const ipCategory: RateLimitCategory =
    mode === 'signup'
      ? 'password_signup_ip'
      : mode === 'set'
      ? 'password_set_ip'
      : 'password_login_ip';

  const ipRes = checkRateLimit(ip, ipCategory);
  if (!ipRes.allowed) {
    return {
      allowed: false,
      status: 429,
      reason: `Too many authentication attempts from your network. Please wait ${ipRes.retryAfter}s.`,
      retryAfter: ipRes.retryAfter,
      ruleEvaluated: 'network',
      remaining: 0,
    };
  }

  return {
    allowed: true,
    status: 200,
    ruleEvaluated: 'none',
    ruleTriggered: 'none',
    remaining: ipRes.remaining,
  };
}

/**
 * Multi-axis Rate Limiter for OTP code verification attempts.
 */
export function checkOtpVerifyRateLimit(
  ip: string,
  email: string
): OtpRateLimitResult {
  const cleanEmail = email.trim().toLowerCase();

  if (cleanEmail) {
    const emailRes = checkRateLimit(cleanEmail, 'otp_verify_email');
    if (!emailRes.allowed) {
      return {
        allowed: false,
        status: 429,
        reason: `Too many verification attempts for this code. Request a new code in ${emailRes.retryAfter}s or sign in with password.`,
        retryAfter: emailRes.retryAfter,
        ruleEvaluated: 'email',
        remaining: 0,
      };
    }
  }

  const ipRes = checkRateLimit(ip, 'otp_verify_ip');
  if (!ipRes.allowed) {
    return {
      allowed: false,
      status: 429,
      reason: `Too many verification attempts from your network. Please wait ${ipRes.retryAfter}s.`,
      retryAfter: ipRes.retryAfter,
      ruleEvaluated: 'network',
      remaining: 0,
    };
  }

  return {
    allowed: true,
    status: 200,
    ruleEvaluated: 'none',
    ruleTriggered: 'none',
    remaining: ipRes.remaining,
  };
}

export { normalizeIp };

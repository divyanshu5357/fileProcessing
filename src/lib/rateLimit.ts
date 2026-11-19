// High-performance In-Memory Sliding Window Rate Limiter

export type RateLimitCategory = 'auth' | 'admin' | 'api';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const LIMITS: Record<RateLimitCategory, RateLimitConfig> = {
  auth: { limit: 15, windowMs: 60_000 },   // 15 req/min on sensitive auth/OTP routes
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

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;       // Unix epoch in seconds
  retryAfter: number;  // Seconds until reset
}

/**
 * Checks and updates rate limit counter for a given client IP and category.
 */
export function checkRateLimit(
  ip: string,
  category: RateLimitCategory = 'api'
): RateLimitResult {
  cleanupExpired();

  const cfg = LIMITS[category] || LIMITS.api;
  const now = Date.now();
  const key = `${category}:${ip || 'unknown'}`;

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

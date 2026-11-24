import { NextRequest, NextResponse } from 'next/server';
import { auth, pool } from '@/lib/auth';
import { extractClientIp, normalizeIp } from '@/lib/ipUtils';
import {
  GUEST_LIMIT_6_HOURS,
  GUEST_LIMIT_DAILY_24H,
  GUEST_WINDOW_6H_MS,
  GUEST_WINDOW_24H_MS,
  GUEST_SPACE_6H_BYTES,
  formatWaitDuration,
  getProductMeta,
  isMeteredGuestProduct,
  isUnlimitedSimpleProduct,
} from '@/lib/guestQuota';
import { getMemoryProfile } from '@/lib/memoryProfile';

interface UsageEventEntry {
  ts: number;
  bytes: number;
}

// Fallback in-memory event log per subject key when DB pool is unavailable
const fallbackEventStore = new Map<string, UsageEventEntry[]>();

const PAID_PLANS = new Set(['prime', 'prime_plus', 'primeplus', 'prime_ultra', 'primeultra']);

async function ensureUsageEventsTable() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS download_usage_events (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      subject_key VARCHAR(160) NOT NULL,
      ip_address VARCHAR(128) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      file_size_bytes BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_download_usage_subject_created
      ON download_usage_events (subject_key, created_at DESC);
  `);
}

async function resolveSessionContext(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      const sessionUser = session.user as { id: string; plan?: string; role?: string };
      let plan = sessionUser.plan || 'Free';
      let role = sessionUser.role || 'user';
      if (pool) {
        try {
          const userRes = await pool.query(
            `SELECT role FROM public."user" WHERE id = $1 LIMIT 1`,
            [session.user.id]
          );
          if (userRes.rows[0]?.role) role = userRes.rows[0].role;

          const subRes = await pool.query(
            `SELECT plan_name FROM public.subscriptions WHERE user_id = $1 AND subscription_status = 'active' LIMIT 1`,
            [session.user.id]
          );
          if (subRes.rows[0]?.plan_name) plan = subRes.rows[0].plan_name;
        } catch {}
      }

      const normalizedPlan = plan.toLowerCase().replace(/\s+/g, '');
      const isUnlimited = role === 'admin' || PAID_PLANS.has(normalizedPlan);
      return {
        authenticated: true,
        userId: session.user.id,
        plan,
        isUnlimited,
      };
    }
  } catch {}
  return { authenticated: false, userId: null, plan: 'Free', isUnlimited: false };
}

async function getWindowStatus(subjectKeys: string[]): Promise<{
  used6h: number;
  used24h: number;
  bytes6h: number;
  oldest6hMs: number | null;
  oldest24hMs: number | null;
}> {
  const now = Date.now();
  const cutoff6h = now - GUEST_WINDOW_6H_MS;
  const cutoff24h = now - GUEST_WINDOW_24H_MS;

  if (pool) {
    try {
      await ensureUsageEventsTable();
      await pool.query(
        `DELETE FROM download_usage_events WHERE subject_key = ANY($1::text[]) AND created_at < NOW() - INTERVAL '24 hours'`,
        [subjectKeys]
      );

      const res = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '6 hours')::int AS used_6h,
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS used_24h,
           COALESCE(SUM(file_size_bytes) FILTER (WHERE created_at >= NOW() - INTERVAL '6 hours'), 0)::bigint AS bytes_6h,
           MIN(created_at) FILTER (WHERE created_at >= NOW() - INTERVAL '6 hours') AS oldest_6h,
           MIN(created_at) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS oldest_24h
         FROM download_usage_events
         WHERE subject_key = ANY($1::text[])`,
        [subjectKeys]
      );

      const row = res.rows[0] || {};
      return {
        used6h: Number(row.used_6h || 0),
        used24h: Number(row.used_24h || 0),
        bytes6h: Number(row.bytes_6h || 0),
        oldest6hMs: row.oldest_6h ? new Date(row.oldest_6h).getTime() : null,
        oldest24hMs: row.oldest_24h ? new Date(row.oldest_24h).getTime() : null,
      };
    } catch {
      // Fallback below
    }
  }

  const combined: UsageEventEntry[] = [];
  for (const key of subjectKeys) {
    const existing = (fallbackEventStore.get(key) || []).filter((e) => e.ts >= cutoff24h);
    fallbackEventStore.set(key, existing);
    combined.push(...existing);
  }
  combined.sort((a, b) => a.ts - b.ts);
  const in6h = combined.filter((e) => e.ts >= cutoff6h);
  const bytes6h = in6h.reduce((sum, e) => sum + e.bytes, 0);

  return {
    used6h: in6h.length,
    used24h: combined.length,
    bytes6h,
    oldest6hMs: in6h.length > 0 ? in6h[0].ts : null,
    oldest24hMs: combined.length > 0 ? combined[0].ts : null,
  };
}

async function recordUsageEvent(
  primaryKey: string,
  ipAddress: string,
  productId: string,
  fileSizeBytes: number
) {
  const now = Date.now();
  const safeBytes = Math.max(0, Math.round(fileSizeBytes));
  if (pool) {
    try {
      await ensureUsageEventsTable();
      await pool.query(
        `INSERT INTO download_usage_events (subject_key, ip_address, product_id, file_size_bytes, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [primaryKey, ipAddress, productId, safeBytes]
      );
      return;
    } catch {
      // Fallback below
    }
  }
  const arr = (fallbackEventStore.get(primaryKey) || []).filter(
    (e) => e.ts >= now - GUEST_WINDOW_24H_MS
  );
  arr.push({ ts: now, bytes: safeBytes });
  fallbackEventStore.set(primaryKey, arr);
}

export async function GET(req: NextRequest) {
  const productId = (req.nextUrl.searchParams.get('productId') || 'pdf-editor').trim();
  const meta = getProductMeta(productId);
  const ipInfo = extractClientIp(req);
  const normalizedIp = normalizeIp(ipInfo.ip) || 'unknown';
  const sessionCtx = await resolveSessionContext(req);
  const memoryProfile = getMemoryProfile(sessionCtx.plan, sessionCtx.authenticated);

  if (sessionCtx.isUnlimited || isUnlimitedSimpleProduct(productId)) {
    return NextResponse.json({
      authenticated: sessionCtx.authenticated,
      unlimited: true,
      allowed: true,
      productId,
      productName: meta.name,
      memoryProfile,
    });
  }

  const subjectKeys = [`ip:${normalizedIp}`];
  if (sessionCtx.userId) subjectKeys.push(`user:${sessionCtx.userId}`);
  const status = await getWindowStatus(subjectKeys);
  const allowed =
    status.used6h < GUEST_LIMIT_6_HOURS &&
    status.used24h < GUEST_LIMIT_DAILY_24H &&
    status.bytes6h < GUEST_SPACE_6H_BYTES;

  // Never expose IP address or raw limit counts in UI responses
  return NextResponse.json({
    authenticated: sessionCtx.authenticated,
    unlimited: false,
    allowed,
    productId,
    productName: meta.name,
    memoryProfile,
  });
}

export async function POST(req: NextRequest) {
  const ipInfo = extractClientIp(req);
  const normalizedIp = normalizeIp(ipInfo.ip) || 'unknown';
  const body = await req.json().catch(() => ({}));
  const productId = (
    typeof body?.productId === 'string' ? body.productId : 'pdf-editor'
  ).trim();
  const fileSizeBytes = Math.max(0, Number(body?.fileSizeBytes || 0));

  if (!isMeteredGuestProduct(productId)) {
    return NextResponse.json({ error: 'Invalid tool request.' }, { status: 400 });
  }

  const meta = getProductMeta(productId);
  const sessionCtx = await resolveSessionContext(req);
  const memoryProfile = getMemoryProfile(sessionCtx.plan, sessionCtx.authenticated);

  // Simple lightweight tasks (e.g. Image to PDF, PDF to Image, Image Size Reducer) & Paid accounts are unlimited
  if (sessionCtx.isUnlimited || isUnlimitedSimpleProduct(productId)) {
    return NextResponse.json({
      authenticated: sessionCtx.authenticated,
      unlimited: true,
      allowed: true,
      productId,
      productName: meta.name,
      memoryProfile,
    });
  }

  const primaryKey = `ip:${normalizedIp}`;
  const subjectKeys = [primaryKey];
  if (sessionCtx.userId) subjectKeys.push(`user:${sessionCtx.userId}`);

  const status = await getWindowStatus(subjectKeys);
  const now = Date.now();

  if (status.used24h >= GUEST_LIMIT_DAILY_24H) {
    const refreshAtMs = (status.oldest24hMs || now) + GUEST_WINDOW_24H_MS;
    const retryAfterSeconds = Math.max(60, Math.ceil((refreshAtMs - now) / 1000));
    const waitLabel = formatWaitDuration(retryAfterSeconds);

    return NextResponse.json(
      {
        authenticated: sessionCtx.authenticated,
        unlimited: false,
        allowed: false,
        reason: 'daily_limit',
        requiresUpgrade: true,
        retryAfterSeconds,
        waitLabel,
        refreshAtIso: new Date(refreshAtMs).toISOString(),
        productId,
        productName: meta.name,
        message: `Daily download limit exceeded. Please wait ${waitLabel} for refresh or upgrade to Premium to download now.`,
      },
      { status: 403 }
    );
  }

  if (status.used6h >= GUEST_LIMIT_6_HOURS) {
    const refreshAtMs = (status.oldest6hMs || now) + GUEST_WINDOW_6H_MS;
    const retryAfterSeconds = Math.max(60, Math.ceil((refreshAtMs - now) / 1000));
    const waitLabel = formatWaitDuration(retryAfterSeconds);

    return NextResponse.json(
      {
        authenticated: sessionCtx.authenticated,
        unlimited: false,
        allowed: false,
        reason: 'window_6h',
        requiresUpgrade: true,
        retryAfterSeconds,
        waitLabel,
        refreshAtIso: new Date(refreshAtMs).toISOString(),
        productId,
        productName: meta.name,
        message: `Download limit exceeded. Please wait for the 6-hour refresh (${waitLabel} remaining) or upgrade to Premium to download your edited file immediately.`,
      },
      { status: 403 }
    );
  }

  // Cumulative 15 MB total space across 6 hours (e.g. 5 MB + 10 MB = 15 MB used)
  if (status.bytes6h + fileSizeBytes > GUEST_SPACE_6H_BYTES) {
    const refreshAtMs = (status.oldest6hMs || now) + GUEST_WINDOW_6H_MS;
    const retryAfterSeconds = Math.max(60, Math.ceil((refreshAtMs - now) / 1000));
    const waitLabel = formatWaitDuration(retryAfterSeconds);
    const remainingSpaceBytes = Math.max(0, GUEST_SPACE_6H_BYTES - status.bytes6h);

    return NextResponse.json(
      {
        authenticated: sessionCtx.authenticated,
        unlimited: false,
        allowed: false,
        reason: status.bytes6h === 0 ? 'file_size' : 'space_6h',
        requiresUpgrade: true,
        retryAfterSeconds,
        waitLabel,
        remainingSpaceBytes,
        refreshAtIso: new Date(refreshAtMs).toISOString(),
        productId,
        productName: meta.name,
        message:
          status.bytes6h === 0
            ? 'This file exceeds the 15 MB 6-hour space limit. Upgrade to Premium to download immediately.'
            : `6-hour 15 MB total space limit exceeded. Please wait ${waitLabel} for refresh or upgrade to Premium to download immediately.`,
      },
      { status: 403 }
    );
  }

  await recordUsageEvent(primaryKey, normalizedIp, productId, fileSizeBytes);

  return NextResponse.json({
    authenticated: sessionCtx.authenticated,
    unlimited: false,
    allowed: true,
    productId,
    productName: meta.name,
    memoryProfile,
  });
}
